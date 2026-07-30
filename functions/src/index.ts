import * as functions from 'firebase-functions/v1';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { handleGeminiProxy } from '../../src/lib/geminiServer';
import { requireAuth } from './middleware/requireAuth';
import { rateLimit } from './middleware/rateLimit';

if (!getApps().length) {
  initializeApp();
}

export { requireAuth } from './middleware/requireAuth';
export { rateLimit, checkRateLimit } from './middleware/rateLimit';

// HTTPS Cloud Function endpoint export style (Firebase Functions compatible)
export const callGeminiProxy = async (req: any, res: any) => {
  // CORS Handling - Restricted Origins
  const allowed = ['https://industrial-360.vercel.app'];
  const origin = req.headers?.origin;
  if (origin && allowed.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // 1. Middleware de Autenticación requireAuth
  await new Promise<void>((resolve, reject) => {
    requireAuth(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (res.headersSent) return;

  // 2. Rate limiting (20/min por uid para callGeminiProxy)
  const geminiRateLimiter = rateLimit({ operation: 'callGeminiProxy', maxRequests: 20 });
  await new Promise<void>((resolve, reject) => {
    geminiRateLimiter(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (res.headersSent) return;

  try {
    const result = await handleGeminiProxy(req.body || {});
    res.status(200).json(result);
  } catch (error: any) {
    const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded');
    if (is429) {
      console.warn('Gemini Proxy Quota Limit Exceeded:', error?.message);
      res.status(429).json({ error: error?.message || 'Quota exceeded for Gemini API.' });
    } else {
      console.error('Gemini Proxy Error:', error);
      res.status(500).json({ error: error?.message || 'Error executing Gemini request on server.' });
    }
  }
};

/**
 * HTTPS Cloud Function para envío de emails con rate limit de 5/min por uid.
 */
export const sendEmail = async (req: any, res: any) => {
  // CORS Handling
  const allowed = ['https://industrial-360.vercel.app'];
  const origin = req.headers?.origin;
  if (origin && allowed.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // 1. Middleware requireAuth
  await new Promise<void>((resolve, reject) => {
    requireAuth(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (res.headersSent) return;

  // 2. Rate Limit (5/min por uid para sendEmail)
  const emailRateLimiter = rateLimit({ operation: 'sendEmail', maxRequests: 5 });
  await new Promise<void>((resolve, reject) => {
    emailRateLimiter(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (res.headersSent) return;

  try {
    const { to, subject, html, event, portalLink } = req.body || {};

    if (!to || (!html && !subject)) {
      res.status(400).json({ error: 'Faltan parámetros requeridos: to, subject, html' });
      return;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);
      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Industrial Control 360 <notificaciones@industrialcontrol360.com>',
        to: Array.isArray(to) ? to : [to],
        subject: subject || 'Notificación Operativa Industrial Control 360',
        html: html || `<p>Tiene una nueva actualización de su proyecto.</p><p><a href="${portalLink || '#'}">Acceder al Portal Cliente</a></p>`
      });
      res.status(200).json({ success: true, data: emailResult });
    } else {
      res.status(200).json({
        success: true,
        simulated: true,
        message: 'Notificación registrada exitosamente (simulado sin RESEND_API_KEY).',
        details: { to, subject, event }
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error al procesar envío de correo.' });
  }
};

/**
 * Callable Cloud Function para establecer Custom Claims a un usuario.
 * Exige autenticación y que el solicitante sea 'superadmin' o 'gerente' de la orgId objetivo.
 */
export const setUserCustomClaims = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'El usuario debe estar autenticado para realizar esta acción.'
    );
  }

  const callerUid = context.auth.uid;
  const callerRole = context.auth.token?.role;
  const callerOrgId = context.auth.token?.orgId;

  const { targetUid, role, orgId } = data || {};

  if (!targetUid || !role || !orgId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan parámetros requeridos: targetUid, role y orgId.'
    );
  }

  const isSuperadmin = callerRole === 'superadmin';
  const isGerenteOfOrg = callerRole === 'gerente' && callerOrgId === orgId;

  if (!isSuperadmin && !isGerenteOfOrg) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'No tiene permisos suficientes para modificar roles en esta organización.'
    );
  }

  const authAdmin = getAuth();
  const dbAdmin = getFirestore();

  // 1. Asignar Custom Claims (SIN 'status')
  await authAdmin.setCustomUserClaims(targetUid, { role, orgId });

  // 2. Revocar tokens de refresco
  await authAdmin.revokeRefreshTokens(targetUid);

  // 3. Determinar IP del solicitante
  const headers = context.rawRequest?.headers || {};
  const rawIp = headers['x-forwarded-for'] ||
                headers['fastly-client-ip'] ||
                headers['x-real-ip'] ||
                context.rawRequest?.ip || 'unknown';
  const ip = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : String(rawIp);

  // 4. Registrar Audit Log en /organizations/{orgId}/audit_logs
  const auditRef = dbAdmin.collection(`organizations/${orgId}/audit_logs`);
  await auditRef.add({
    action: 'USER_ROLE_UPDATED',
    callerUid,
    targetUid,
    newRole: role,
    ip,
    timestamp: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    message: `Custom claims asignados exitosamente al usuario ${targetUid}`,
  };
});

/**
 * Callable Cloud Function para asegurar que el usuario tenga Custom Claims asignados a partir de su documento en /users/{uid}.
 * (a) Exige context.auth
 * (b) Lee /users/{context.auth.uid} del PROPIO usuario
 * (c) Fija claims {orgId, role} en Auth
 * (d) NUNCA acepta role/orgId desde el payload del cliente
 * (e) Llama admin.auth().revokeRefreshTokens(uid)
 */
export const ensureOwnClaims = functions.https.onCall(async (_data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'El usuario debe estar autenticado para asegurar sus claims.'
    );
  }

  const uid = context.auth.uid;
  const dbAdmin = getFirestore();
  const authAdmin = getAuth();

  const userDocSnap = await dbAdmin.collection('users').doc(uid).get();

  if (!userDocSnap.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      `No se encontró el documento de usuario en /users/${uid}`
    );
  }

  const userData = userDocSnap.data() || {};
  const orgId = userData.orgId;
  const role = userData.role;

  if (!orgId || !role) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'El documento de usuario no posee orgId o role válidos.'
    );
  }

  // Asignar Custom Claims
  await authAdmin.setCustomUserClaims(uid, { orgId, role });

  // Revocar tokens de refresco para forzar actualización de ID token
  await authAdmin.revokeRefreshTokens(uid);

  return {
    success: true,
    orgId,
    role,
    message: `Claims asegurados exitosamente para ${uid}: orgId=${orgId}, role=${role}`,
  };
});

export { issueRegulatoryCode } from './regulatoryIds';

