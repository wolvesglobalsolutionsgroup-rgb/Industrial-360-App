import * as functions from 'firebase-functions/v1';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from './logger';
import { authorizeServerSideRequest } from './middleware/authorizer';

export const issueRegulatoryCode = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  const { orgId, projectId, series } = data || {};
  if (!series) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Falta parámetro requerido: series.'
    );
  }

  // Autorización server-side reusable (S14.2)
  const authRes = await authorizeServerSideRequest(context.auth, {
    orgId,
    projectId,
    requireProject: true,
    allowedRoles: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
  });

  const callerUid = authRes.uid;
  const dbAdmin = getFirestore();
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
    } else {
      nextCount = 1;
    }
    transaction.set(counterDocRef, {
      count: nextCount,
      series: seriesUpper,
      year,
      updatedAt: FieldValue.serverTimestamp(),
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
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (auditErr) {
    logger.warn('Error al registrar audit log para código regulatorio:', auditErr);
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
