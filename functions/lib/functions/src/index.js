"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDocument = exports.sealDocument = exports.getClientPortal = exports.createClientPortal = exports.issueRegulatoryCode = exports.ensureOwnClaims = exports.setUserCustomClaims = exports.sendEmail = exports.callGeminiProxy = exports.authorizeServerSideRequest = exports.checkRateLimit = exports.rateLimit = exports.requireAuth = void 0;
const functions = require("firebase-functions/v1");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const crypto = require("crypto");
const geminiServer_1 = require("../../src/lib/geminiServer");
const requireAuth_1 = require("./middleware/requireAuth");
const rateLimit_1 = require("./middleware/rateLimit");
const authorizer_1 = require("./middleware/authorizer");
const logger_1 = require("./logger");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
var requireAuth_2 = require("./middleware/requireAuth");
Object.defineProperty(exports, "requireAuth", { enumerable: true, get: function () { return requireAuth_2.requireAuth; } });
var rateLimit_2 = require("./middleware/rateLimit");
Object.defineProperty(exports, "rateLimit", { enumerable: true, get: function () { return rateLimit_2.rateLimit; } });
Object.defineProperty(exports, "checkRateLimit", { enumerable: true, get: function () { return rateLimit_2.checkRateLimit; } });
var authorizer_2 = require("./middleware/authorizer");
Object.defineProperty(exports, "authorizeServerSideRequest", { enumerable: true, get: function () { return authorizer_2.authorizeServerSideRequest; } });
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
    // 1. Middleware de Autenticación requireAuth
    await new Promise((resolve, reject) => {
        (0, requireAuth_1.requireAuth)(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    if (res.headersSent)
        return;
    // 2. Rate limiting (20/min por uid para callGeminiProxy)
    const geminiRateLimiter = (0, rateLimit_1.rateLimit)({ operation: 'callGeminiProxy', maxRequests: 20 });
    await new Promise((resolve, reject) => {
        geminiRateLimiter(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    if (res.headersSent)
        return;
    try {
        const result = await (0, geminiServer_1.handleGeminiProxy)(req.body || {});
        res.status(200).json(result);
    }
    catch (error) {
        const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded');
        if (is429) {
            logger_1.logger.warn('Gemini Proxy Quota Limit Exceeded:', error?.message);
            res.status(429).json({ error: error?.message || 'Quota exceeded for Gemini API.' });
        }
        else {
            logger_1.logger.error('Gemini Proxy Error:', error);
            res.status(500).json({ error: error?.message || 'Error executing Gemini request on server.' });
        }
    }
};
exports.callGeminiProxy = callGeminiProxy;
/**
 * HTTPS Cloud Function para envío de emails con rate limit de 5/min por uid.
 */
const sendEmail = async (req, res) => {
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
    await new Promise((resolve, reject) => {
        (0, requireAuth_1.requireAuth)(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    if (res.headersSent)
        return;
    // 2. Rate Limit (5/min por uid para sendEmail)
    const emailRateLimiter = (0, rateLimit_1.rateLimit)({ operation: 'sendEmail', maxRequests: 5 });
    await new Promise((resolve, reject) => {
        emailRateLimiter(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    if (res.headersSent)
        return;
    try {
        const { to, subject, html, event, portalLink } = req.body || {};
        if (!to || (!html && !subject)) {
            res.status(400).json({ error: 'Faltan parámetros requeridos: to, subject, html' });
            return;
        }
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
            const { Resend } = await Promise.resolve().then(() => require('resend'));
            const resend = new Resend(resendApiKey);
            const emailResult = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'Industrial Control 360 <notificaciones@industrialcontrol360.com>',
                to: Array.isArray(to) ? to : [to],
                subject: subject || 'Notificación Operativa Industrial Control 360',
                html: html || `<p>Tiene una nueva actualización de su proyecto.</p><p><a href="${portalLink || '#'}">Acceder al Portal Cliente</a></p>`
            });
            res.status(200).json({ success: true, data: emailResult });
        }
        else {
            res.status(200).json({
                success: true,
                simulated: true,
                message: 'Notificación registrada exitosamente (simulado sin RESEND_API_KEY).',
                details: { to, subject, event }
            });
        }
    }
    catch (err) {
        res.status(500).json({ error: err?.message || 'Error al procesar envío de correo.' });
    }
};
exports.sendEmail = sendEmail;
/**
 * Callable Cloud Function para establecer Custom Claims a un usuario.
 * Exige autenticación y que el solicitante sea 'superadmin' o 'gerente' de la orgId objetivo.
 */
exports.setUserCustomClaims = functions.https.onCall(async (data, context) => {
    const { targetUid, role, orgId } = data || {};
    if (!targetUid || !role || !orgId) {
        throw new functions.https.HttpsError('invalid-argument', 'Faltan parámetros requeridos: targetUid, role y orgId.');
    }
    // Autorización server-side reusable (S14.2)
    const authRes = await (0, authorizer_1.authorizeServerSideRequest)(context.auth, {
        orgId,
        allowedRoles: ['superadmin', 'gerente'],
    });
    const callerUid = authRes.uid;
    const authAdmin = (0, auth_1.getAuth)();
    const dbAdmin = (0, firestore_1.getFirestore)();
    // 1. Asignar Custom Claims
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
 * Callable Cloud Function para asegurar que el usuario tenga Custom Claims asignados
 * a partir de su membresía autoritativa en /organizations/{orgId}/memberships/{uid}.
 * (S14.2):
 * - NUNCA lee datos del cliente o de documentos editables por usuario (/users/{uid}).
 * - Ausencia de membresía retorna estado explícito ('failed-precondition', 'NO_MEMBERSHIP').
 * - Solo revoca refresh tokens si los claims cambian.
 */
exports.ensureOwnClaims = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'El usuario debe estar autenticado para asegurar sus claims.');
    }
    const uid = context.auth.uid;
    const dbAdmin = (0, firestore_1.getFirestore)();
    const authAdmin = (0, auth_1.getAuth)();
    const requestedOrgId = data?.orgId;
    let membershipSnap = null;
    let targetOrgId = '';
    if (requestedOrgId && typeof requestedOrgId === 'string' && requestedOrgId.trim()) {
        const docRef = dbAdmin.doc(`organizations/${requestedOrgId.trim()}/memberships/${uid}`);
        const snap = await docRef.get();
        if (snap.exists) {
            membershipSnap = snap;
            targetOrgId = requestedOrgId.trim();
        }
    }
    if (!membershipSnap) {
        const docQuerySnap = await dbAdmin
            .collectionGroup('memberships')
            .where(firestore_1.FieldPath.documentId(), '==', uid)
            .limit(1)
            .get();
        if (!docQuerySnap.empty) {
            membershipSnap = docQuerySnap.docs[0];
            targetOrgId = membershipSnap.data().orgId || membershipSnap.ref.parent?.parent?.id;
        }
        else {
            const fieldQuerySnap = await dbAdmin
                .collectionGroup('memberships')
                .where('uid', '==', uid)
                .limit(1)
                .get();
            if (!fieldQuerySnap.empty) {
                membershipSnap = fieldQuerySnap.docs[0];
                targetOrgId = membershipSnap.data().orgId || membershipSnap.ref.parent?.parent?.id;
            }
        }
    }
    if (!membershipSnap || !membershipSnap.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'NO_MEMBERSHIP: No se encontró una membresía activa asignada para este usuario.');
    }
    const membershipData = membershipSnap.data() || {};
    const status = membershipData.status || 'active';
    const activeStatuses = ['approved', 'aprobado', 'active'];
    if (!activeStatuses.includes(status.toLowerCase())) {
        throw new functions.https.HttpsError('failed-precondition', `MEMBERSHIP_INACTIVE: La membresía del usuario se encuentra en estado '${status}'.`);
    }
    const authoritativeRole = membershipData.role || 'campo';
    const authoritativeOrgId = membershipData.orgId || targetOrgId;
    if (!authoritativeOrgId || !authoritativeRole) {
        throw new functions.https.HttpsError('failed-precondition', 'INVALID_MEMBERSHIP_DATA: La membresía autoritativa no posee un orgId o role válidos.');
    }
    const currentClaims = context.auth.token || {};
    const claimsAlreadyMatch = currentClaims.role === authoritativeRole &&
        currentClaims.orgId === authoritativeOrgId;
    if (!claimsAlreadyMatch) {
        await authAdmin.setCustomUserClaims(uid, {
            orgId: authoritativeOrgId,
            role: authoritativeRole,
        });
        await authAdmin.revokeRefreshTokens(uid);
    }
    return {
        success: true,
        orgId: authoritativeOrgId,
        role: authoritativeRole,
        claimsUpdated: !claimsAlreadyMatch,
        message: `Claims asegurados exitosamente para ${uid}: orgId=${authoritativeOrgId}, role=${authoritativeRole}`,
    };
});
var regulatoryIds_1 = require("./regulatoryIds");
Object.defineProperty(exports, "issueRegulatoryCode", { enumerable: true, get: function () { return regulatoryIds_1.issueRegulatoryCode; } });
/**
 * Sprint 9 - MODELO DE PORTAL SEGURO
 * Callable Cloud Function: createClientPortal
 * - Genera token 32 bytes crypto (64 chars hex)
 * - Guarda en Firestore SOLO el hash SHA-256 (tokenHash)
 * - Retorna el token en texto plano UNA SOLA VEZ al llamador
 */
exports.createClientPortal = functions.https.onCall(async (data, context) => {
    const { id, name, clientName, orgId, linkedProjectIds, branding, visibilityMatrix, expiresAtOption, isRevoked } = data || {};
    if (!name || !orgId) {
        throw new functions.https.HttpsError('invalid-argument', 'Faltan parámetros obligatorios: name u orgId.');
    }
    // Autorización server-side reusable (S14.2)
    const authRes = await (0, authorizer_1.authorizeServerSideRequest)(context.auth, {
        orgId,
        allowedRoles: ['superadmin', 'gerente'],
    });
    const callerUid = authRes.uid;
    const dbAdmin = (0, firestore_1.getFirestore)();
    const portalId = id || `portal_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    // 1. Generar token criptográfico de 32 bytes (64 caracteres hexadecimales)
    const rawToken = crypto.randomBytes(32).toString('hex');
    // 2. Calcular Hash SHA-256
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    // 3. Calcular Expiración
    let expiresAt = null;
    if (expiresAtOption === '30days') {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        expiresAt = d.toISOString();
    }
    else if (expiresAtOption === '90days' || !expiresAtOption) {
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
        timestamp: firestore_1.FieldValue.serverTimestamp(),
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
const getClientPortal = async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    // Rate limit por IP (30 solicitudes / min por IP)
    const portalRateLimiter = (0, rateLimit_1.rateLimit)({ operation: 'getClientPortal', maxRequests: 30 });
    await new Promise((resolve, reject) => {
        portalRateLimiter(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    if (res.headersSent)
        return;
    try {
        const portalId = req.query.portalId || req.body?.portalId;
        const token = req.query.token || req.body?.token;
        if (!portalId || !token) {
            res.status(400).json({ error: 'Acceso Denegado: Faltan parámetros portalId o token de seguridad.' });
            return;
        }
        const dbAdmin = (0, firestore_1.getFirestore)();
        const portalSnap = await dbAdmin.collection('client_portals').doc(portalId).get();
        if (!portalSnap.exists) {
            res.status(404).json({ error: 'Acceso Denegado: Portal de cliente no encontrado.' });
            return;
        }
        const portalData = portalSnap.data();
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
        }
        catch (logErr) {
            logger_1.logger.warn('Error registrando log de acceso:', logErr);
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
    }
    catch (err) {
        logger_1.logger.error('Error en getClientPortal:', err);
        res.status(500).json({ error: err?.message || 'Error al validar portal de cliente.' });
    }
};
exports.getClientPortal = getClientPortal;
/**
 * Sprint 9 - SELLO DOCUMENTAL SERVER-SIDE
 * Callable Cloud Function: sealDocument
 * - Modela DocumentVerification
 * - Calcula SHA-256 server-side
 * - Escribe en colección append-only
 */
exports.sealDocument = functions.https.onCall(async (data, context) => {
    const { docId, orgId, projId, pdfBytesBase64, version, metadata } = data || {};
    if (!docId || !orgId) {
        throw new functions.https.HttpsError('invalid-argument', 'Faltan parámetros requeridos: docId y orgId.');
    }
    // Autorización server-side reusable (S14.2)
    const authRes = await (0, authorizer_1.authorizeServerSideRequest)(context.auth, {
        orgId,
        projectId: projId,
        requireProject: Boolean(projId),
        allowedRoles: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
    });
    const callerUid = authRes.uid;
    // 1. Calcular Hash SHA-256 Server-Side
    let sha256 = '';
    if (pdfBytesBase64) {
        const pdfBuffer = Buffer.from(pdfBytesBase64, 'base64');
        sha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    }
    else {
        // Generar hash server-side basado en metadatos + timestamp inmutable
        const payload = `DOC:${docId}|ORG:${orgId}|PROJ:${projId || 'N/A'}|TS:${new Date().toISOString()}|BY:${callerUid}`;
        sha256 = crypto.createHash('sha256').update(payload).digest('hex');
    }
    const issuedAt = new Date().toISOString();
    const dbAdmin = (0, firestore_1.getFirestore)();
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
        timestamp: firestore_1.FieldValue.serverTimestamp(),
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
const verifyDocument = async (req, res) => {
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
        const dbAdmin = (0, firestore_1.getFirestore)();
        let record = null;
        if (sha256) {
            const snap = await dbAdmin.collection('document_verifications').doc(sha256).get();
            if (snap.exists)
                record = snap.data();
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
    }
    catch (err) {
        logger_1.logger.error('Error en verifyDocument:', err);
        res.status(500).json({ error: err?.message || 'Error al verificar documento.' });
    }
};
exports.verifyDocument = verifyDocument;
//# sourceMappingURL=index.js.map