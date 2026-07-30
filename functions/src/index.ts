import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { handleGeminiProxy } from '../../src/lib/geminiServer';

if (!admin.apps.length) {
  admin.initializeApp();
}

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
 * Callable Cloud Function para establecer Custom Claims a un usuario.
 * Exige autenticación y que el solicitante sea 'superadmin' o 'gerente' de la orgId objetivo.
 */
export const setUserCustomClaims = functions.https.onCall(async (data, context) => {
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

  // 1. Asignar Custom Claims (SIN 'status')
  await admin.auth().setCustomUserClaims(targetUid, { role, orgId });

  // 2. Revocar tokens de refresco
  await admin.auth().revokeRefreshTokens(targetUid);

  // 3. Determinar IP del solicitante
  const headers = context.rawRequest?.headers || {};
  const rawIp = headers['x-forwarded-for'] ||
                headers['fastly-client-ip'] ||
                headers['x-real-ip'] ||
                context.rawRequest?.ip || 'unknown';
  const ip = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : String(rawIp);

  // 4. Registrar Audit Log en /organizations/{orgId}/audit_logs
  const auditRef = admin.firestore().collection(`organizations/${orgId}/audit_logs`);
  await auditRef.add({
    action: 'USER_ROLE_UPDATED',
    callerUid,
    targetUid,
    newRole: role,
    ip,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    message: `Custom claims asignados exitosamente al usuario ${targetUid}`,
  };
});


