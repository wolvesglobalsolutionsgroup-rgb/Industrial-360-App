import * as functions from 'firebase-functions/v1';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import { handleGeminiProxy } from '../../src/lib/geminiServer';
import { requireAuth } from './middleware/requireAuth';
import { rateLimit } from './middleware/rateLimit';
import { logger } from './logger';

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
      logger.warn('Gemini Proxy Quota Limit Exceeded:', error?.message);
      res.status(429).json({ error: error?.message || 'Quota exceeded for Gemini API.' });
    } else {
      logger.error('Gemini Proxy Error:', error);
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
  const requestedRole = userData.role;

  if (!orgId || !requestedRole) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'El documento de usuario no posee orgId o role válidos.'
    );
  }

  let finalRole = requestedRole;

  // Validación autoritativa para roles elevados ('superadmin', 'gerente'):
  // Se debe verificar la existencia y estado de la membership autoritativa
  // en /organizations/{orgId}/memberships/{uid} (solo escribible por Admin SDK)
  if (requestedRole === 'superadmin' || requestedRole === 'gerente') {
    const membershipSnap = await dbAdmin
      .collection(`organizations/${orgId}/memberships`)
      .doc(uid)
      .get();

    if (!membershipSnap.exists) {
      finalRole = 'campo';
    } else {
      const membershipData = membershipSnap.data() || {};
      if (
        membershipData.status &&
        membershipData.status !== 'approved' &&
        membershipData.status !== 'aprobado' &&
        membershipData.status !== 'active'
      ) {
        finalRole = 'campo';
      }
    }
  }

  // Asignar Custom Claims autoritativos
  await authAdmin.setCustomUserClaims(uid, { orgId, role: finalRole });

  // Revocar tokens de refresco para forzar actualización de ID token
  await authAdmin.revokeRefreshTokens(uid);

  return {
    success: true,
    orgId,
    role: finalRole,
    message: `Claims asegurados exitosamente para ${uid}: orgId=${orgId}, role=${finalRole}`,
  };
});

export { issueRegulatoryCode } from './regulatoryIds';

/**
 * Sprint 9 - MODELO DE PORTAL SEGURO
 * Callable Cloud Function: createClientPortal
 * - Genera token 32 bytes crypto (64 chars hex)
 * - Guarda en Firestore SOLO el hash SHA-256 (tokenHash)
 * - Retorna el token en texto plano UNA SOLA VEZ al llamador
 */
export const createClientPortal = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'El usuario debe estar autenticado para crear o configurar un portal de cliente.'
    );
  }

  const callerUid = context.auth.uid;
  const { 
    id, name, clientName, orgId, linkedProjectIds, branding, visibilityMatrix, expiresAtOption, isRevoked 
  } = data || {};

  if (!name || !orgId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan parámetros obligatorios: name u orgId.'
    );
  }

  const dbAdmin = getFirestore();
  const portalId = id || `portal_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // 1. Generar token criptográfico de 32 bytes (64 caracteres hexadecimales)
  const rawToken = crypto.randomBytes(32).toString('hex');

  // 2. Calcular Hash SHA-256
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // 3. Calcular Expiración
  let expiresAt: string | null = null;
  if (expiresAtOption === '30days') {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    expiresAt = d.toISOString();
  } else if (expiresAtOption === '90days' || !expiresAtOption) {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    expiresAt = d.toISOString();
  }

  const portalPayload = {
    id: portalId,
    name,
    clientName: clientName || 'Comité de Inspección / Cliente Final',
    orgId,
    linkedProjectIds: Array.isArray(linkedProjectIds) ? linkedProjectIds : [],
    tokenHash, // SOLO guardamos el Hash SHA-256
    expiresAt,
    isRevoked: !!isRevoked,
    branding: branding || {
      logoUrl: '',
      accentColor: '#0B2239',
      themePreset: 'mineral',
    },
    visibilityMatrix: visibilityMatrix || {
      showKpis: true,
      showScurve: true,
      showMilestones: true,
      showGallery: true,
      showSihoPtw: true,
      showNdtWeld: true,
      showDossier: true,
      showValuations: false,
    },
    createdAt: new Date().toISOString(),
    createdBy: callerUid,
    updatedAt: new Date().toISOString()
  };

  // Guardar en /organizations/{orgId}/client_portals/{portalId} y en /client_portals/{portalId}
  await dbAdmin.collection(`organizations/${orgId}/client_portals`).doc(portalId).set(portalPayload, { merge: true });
  await dbAdmin.collection('client_portals').doc(portalId).set(portalPayload, { merge: true });

  // Registrar audit log
  await dbAdmin.collection(`organizations/${orgId}/audit_logs`).add({
    action: 'CLIENT_PORTAL_CREATED',
    callerUid,
    portalId,
    timestamp: FieldValue.serverTimestamp(),
  });

  // Retorna rawToken en texto plano UNA SOLA VEZ
  return {
    success: true,
    portalId,
    rawToken,
    expiresAt,
    message: 'Portal de cliente creado. El token en texto plano solo se muestra en esta respuesta.',
  };
});

/**
 * Sprint 9 - ACCESO PÚBLICO CONTROLADO
 * Function HTTPS: getClientPortal
 * Recibe portalId y token por query/body
 * Compara hash del token recibido con tokenHash guardado
 * Rate limiting por IP
 * Retorna solo widgets/datos publicados
 * Audit log server-side
 */
export const getClientPortal = async (req: any, res: any) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Rate limit por IP (30 solicitudes / min por IP)
  const portalRateLimiter = rateLimit({ operation: 'getClientPortal', maxRequests: 30 });
  await new Promise<void>((resolve, reject) => {
    portalRateLimiter(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (res.headersSent) return;

  try {
    const portalId = req.query.portalId || req.body?.portalId;
    const token = req.query.token || req.body?.token;

    if (!portalId || !token) {
      res.status(400).json({ error: 'Acceso Denegado: Faltan parámetros portalId o token de seguridad.' });
      return;
    }

    const dbAdmin = getFirestore();
    const portalSnap = await dbAdmin.collection('client_portals').doc(portalId).get();

    if (!portalSnap.exists) {
      res.status(404).json({ error: 'Acceso Denegado: Portal de cliente no encontrado.' });
      return;
    }

    const portalData = portalSnap.data() as any;

    if (portalData.isRevoked) {
      res.status(403).json({ error: 'Acceso Revocado: El acceso a este portal ha sido suspendido por la empresa contratista.' });
      return;
    }

    if (portalData.expiresAt && new Date(portalData.expiresAt).getTime() < Date.now()) {
      res.status(403).json({ error: 'Acceso Caducado: El token de acceso para este portal ha expirado.' });
      return;
    }

    // Comparar SHA-256 hash del token recibido
    const computedHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const isValidToken = computedHash === portalData.tokenHash || portalData.accessToken === token;

    if (!isValidToken) {
      res.status(401).json({ error: 'Acceso Denegado: Token de seguridad no válido.' });
      return;
    }

    // Registrar Audit Log Server-Side
    const rawIp = req.headers['x-forwarded-for'] || req.ip || 'unknown';
    const ip = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : String(rawIp);
    const orgId = portalData.orgId || 'semax_pino';

    try {
      await dbAdmin.collection(`organizations/${orgId}/client_portal_access_logs`).add({
        portalId,
        orgId,
        ip,
        accessedAt: new Date().toISOString(),
        userAgent: req.headers['user-agent'] || 'unknown',
      });
    } catch (logErr) {
      logger.warn('Error registrando log de acceso:', logErr);
    }

    // Retornar solo widgets publicados según visibilityMatrix
    res.status(200).json({
      success: true,
      portal: {
        id: portalData.id,
        name: portalData.name,
        clientName: portalData.clientName,
        orgId: portalData.orgId,
        linkedProjectIds: portalData.linkedProjectIds,
        branding: portalData.branding,
        visibilityMatrix: portalData.visibilityMatrix,
        updatedAt: portalData.updatedAt,
      }
    });
  } catch (err: any) {
    logger.error('Error en getClientPortal:', err);
    res.status(500).json({ error: err?.message || 'Error al validar portal de cliente.' });
  }
};

/**
 * Sprint 9 - SELLO DOCUMENTAL SERVER-SIDE
 * Callable Cloud Function: sealDocument
 * - Modela DocumentVerification
 * - Calcula SHA-256 server-side
 * - Escribe en colección append-only
 */
export const sealDocument = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Se requiere autenticación para sellar documentos.'
    );
  }

  const callerUid = context.auth.uid;
  const { docId, orgId, projId, pdfBytesBase64, version, metadata } = data || {};

  if (!docId || !orgId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan parámetros requeridos: docId y orgId.'
    );
  }

  // 1. Calcular Hash SHA-256 Server-Side
  let sha256 = '';
  if (pdfBytesBase64) {
    const pdfBuffer = Buffer.from(pdfBytesBase64, 'base64');
    sha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
  } else {
    // Generar hash server-side basado en metadatos + timestamp inmutable
    const payload = `DOC:${docId}|ORG:${orgId}|PROJ:${projId || 'N/A'}|TS:${new Date().toISOString()}|BY:${callerUid}`;
    sha256 = crypto.createHash('sha256').update(payload).digest('hex');
  }

  const issuedAt = new Date().toISOString();
  const dbAdmin = getFirestore();
  const verificationId = sha256;

  const verificationRecord = {
    id: verificationId,
    docId,
    orgId,
    projId: projId || 'proj-default',
    sha256,
    status: 'VALIDEZ_OFICIAL',
    version: version || 'REV-0',
    issuedAt,
    sealedBy: callerUid,
    verificationUrl: `/verify-document?sha256=${sha256}&docId=${docId}`,
    metadata: metadata || {}
  };

  // Escribir en colección append-only
  await dbAdmin.collection(`organizations/${orgId}/document_verifications`).doc(verificationId).set(verificationRecord, { merge: true });
  await dbAdmin.collection('document_verifications').doc(verificationId).set(verificationRecord, { merge: true });

  // Audit Log
  await dbAdmin.collection(`organizations/${orgId}/audit_logs`).add({
    action: 'DOCUMENT_SEALED',
    callerUid,
    docId,
    sha256,
    timestamp: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    verificationId,
    docId,
    sha256,
    status: 'VALIDEZ_OFICIAL',
    version: verificationRecord.version,
    issuedAt,
    verificationUrl: verificationRecord.verificationUrl
  };
});

/**
 * Sprint 9 - VERIFICACIÓN PÚBLICA POR QR (HTTPS)
 * Function HTTPS pública: verifyDocument
 * Retorna { status, version, issuedAt, sha256, docId, metadata }
 */
export const verifyDocument = async (req: any, res: any) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const sha256 = req.query.sha256 || req.body?.sha256;
    const docId = req.query.docId || req.body?.docId;

    if (!sha256 && !docId) {
      res.status(400).json({ error: 'Se requiere sha256 o docId para verificar la validez del documento.' });
      return;
    }

    const dbAdmin = getFirestore();
    let record: any = null;

    if (sha256) {
      const snap = await dbAdmin.collection('document_verifications').doc(sha256).get();
      if (snap.exists) record = snap.data();
    }

    if (!record && docId) {
      const querySnap = await dbAdmin.collection('document_verifications').where('docId', '==', docId).get();
      if (!querySnap.empty) {
        record = querySnap.docs[0].data();
      }
    }

    if (!record) {
      res.status(404).json({
        status: 'NO_ENCONTRADO',
        message: 'No se encontró un sello de verificación inmutable para este documento.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      status: record.status || 'VALIDEZ_OFICIAL',
      version: record.version || 'REV-0',
      issuedAt: record.issuedAt,
      sha256: record.sha256,
      docId: record.docId,
      orgId: record.orgId,
      projId: record.projId,
      verificationUrl: record.verificationUrl,
      metadata: record.metadata || {}
    });
  } catch (err: any) {
    logger.error('Error en verifyDocument:', err);
    res.status(500).json({ error: err?.message || 'Error al verificar documento.' });
  }
};


