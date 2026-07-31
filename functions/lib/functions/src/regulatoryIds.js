"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueRegulatoryCode = void 0;
const functions = require("firebase-functions/v1");
const firestore_1 = require("firebase-admin/firestore");
const logger_1 = require("./logger");
const authorizer_1 = require("./middleware/authorizer");
exports.issueRegulatoryCode = functions.https.onCall(async (data, context) => {
    const { orgId, projectId, series } = data || {};
    if (!series) {
        throw new functions.https.HttpsError('invalid-argument', 'Falta parámetro requerido: series.');
    }
    // Autorización server-side reusable (S14.2)
    const authRes = await (0, authorizer_1.authorizeServerSideRequest)(context.auth, {
        orgId,
        projectId,
        requireProject: true,
        allowedRoles: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
    });
    const callerUid = authRes.uid;
    const dbAdmin = (0, firestore_1.getFirestore)();
    const year = new Date().getFullYear();
    const seriesUpper = String(series).trim().toUpperCase();
    const counterDocRef = dbAdmin.doc(`organizations/${authRes.orgId}/counters/${seriesUpper}-${year}`);
    // (c) runTransaction en admin SDK sobre /organizations/{orgId}/counters/{series}-{year}
    let nextCount = 1;
    await dbAdmin.runTransaction(async (transaction) => {
        const docSnap = await transaction.get(counterDocRef);
        if (docSnap.exists) {
            const current = docSnap.data()?.count || 0;
            nextCount = current + 1;
        }
        else {
            nextCount = 1;
        }
        transaction.set(counterDocRef, {
            count: nextCount,
            series: seriesUpper,
            year,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            updatedBy: callerUid,
        }, { merge: true });
    });
    const formattedCount = String(nextCount).padStart(5, '0');
    const officialCode = `${seriesUpper}-${year}-${formattedCount}`;
    // (e) Registra audit log
    try {
        const auditRef = dbAdmin.collection(`organizations/${orgId}/audit_logs`);
        await auditRef.add({
            action: 'REGULATORY_CODE_ISSUED',
            callerUid,
            projectId,
            series: seriesUpper,
            year,
            count: nextCount,
            code: officialCode,
            timestamp: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    catch (auditErr) {
        logger_1.logger.warn('Error al registrar audit log para código regulatorio:', auditErr);
    }
    // (d) Retorna código oficial
    return {
        success: true,
        code: officialCode,
        series: seriesUpper,
        year,
        count: nextCount,
    };
});
//# sourceMappingURL=regulatoryIds.js.map