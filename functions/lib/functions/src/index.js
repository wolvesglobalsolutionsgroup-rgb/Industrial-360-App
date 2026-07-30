"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureOwnClaims = exports.setUserCustomClaims = exports.callGeminiProxy = void 0;
const functions = require("firebase-functions/v1");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const geminiServer_1 = require("../../src/lib/geminiServer");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
// HTTPS Cloud Function endpoint export style (Firebase Functions compatible)
const callGeminiProxy = async (req, res) => {
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
        const result = await (0, geminiServer_1.handleGeminiProxy)(req.body || {});
        res.status(200).json(result);
    }
    catch (error) {
        const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded');
        if (is429) {
            console.warn('Gemini Proxy Quota Limit Exceeded:', error?.message);
            res.status(429).json({ error: error?.message || 'Quota exceeded for Gemini API.' });
        }
        else {
            console.error('Gemini Proxy Error:', error);
            res.status(500).json({ error: error?.message || 'Error executing Gemini request on server.' });
        }
    }
};
exports.callGeminiProxy = callGeminiProxy;
/**
 * Callable Cloud Function para establecer Custom Claims a un usuario.
 * Exige autenticación y que el solicitante sea 'superadmin' o 'gerente' de la orgId objetivo.
 */
exports.setUserCustomClaims = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'El usuario debe estar autenticado para realizar esta acción.');
    }
    const callerUid = context.auth.uid;
    const callerRole = context.auth.token?.role;
    const callerOrgId = context.auth.token?.orgId;
    const { targetUid, role, orgId } = data || {};
    if (!targetUid || !role || !orgId) {
        throw new functions.https.HttpsError('invalid-argument', 'Faltan parámetros requeridos: targetUid, role y orgId.');
    }
    const isSuperadmin = callerRole === 'superadmin';
    const isGerenteOfOrg = callerRole === 'gerente' && callerOrgId === orgId;
    if (!isSuperadmin && !isGerenteOfOrg) {
        throw new functions.https.HttpsError('permission-denied', 'No tiene permisos suficientes para modificar roles en esta organización.');
    }
    const authAdmin = (0, auth_1.getAuth)();
    const dbAdmin = (0, firestore_1.getFirestore)();
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
        timestamp: firestore_1.FieldValue.serverTimestamp(),
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
exports.ensureOwnClaims = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'El usuario debe estar autenticado para asegurar sus claims.');
    }
    const uid = context.auth.uid;
    const dbAdmin = (0, firestore_1.getFirestore)();
    const authAdmin = (0, auth_1.getAuth)();
    const userDocSnap = await dbAdmin.collection('users').doc(uid).get();
    if (!userDocSnap.exists) {
        throw new functions.https.HttpsError('not-found', `No se encontró el documento de usuario en /users/${uid}`);
    }
    const userData = userDocSnap.data() || {};
    const orgId = userData.orgId;
    const role = userData.role;
    if (!orgId || !role) {
        throw new functions.https.HttpsError('failed-precondition', 'El documento de usuario no posee orgId o role válidos.');
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
//# sourceMappingURL=index.js.map