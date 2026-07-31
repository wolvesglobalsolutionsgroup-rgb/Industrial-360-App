import type { Request, Response } from 'express';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicializar firebase-admin en el servidor Express
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export async function handleProvisionQaAccess(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Se requiere token de autenticación (Bearer)' });
    }

    const idToken = authHeader.split('Bearer ')[1].trim();
    if (!idToken) {
      return res.status(401).json({ error: 'Token de autenticación vacío' });
    }

    const authAdmin = getAuth();

    // 1. Verificar ID token con Firebase Admin SDK
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email || '';

    const body = req.body || {};
    const action = (body.action as string) || 'provision';
    const targetOrgId = (body.targetOrgId as string)?.trim() || 'prointeca-demo';
    const requestedRole = (body.role as string)?.trim() || 'gerente';
    const reason = (body.reason as string)?.trim() || 'Provisionamiento de acceso QA/Preview para evaluación de producto';

    // 2. Validar que targetOrgId sea un tenant de QA / datos sintéticos
    const isQaTenant =
      targetOrgId === 'prointeca-demo' ||
      targetOrgId === 'qa-preview-tenant' ||
      targetOrgId.startsWith('qa-') ||
      targetOrgId.endsWith('-qa') ||
      targetOrgId.endsWith('-demo');

    if (!isQaTenant) {
      return res.status(403).json({
        error: `Acceso denegado: El tenant '${targetOrgId}' no está clasificado como un entorno QA con datos sintéticos.`,
      });
    }

    // 3. Validar rol solicitado (no permite platformAdmin)
    const allowedQaRoles = ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'];
    if (!allowedQaRoles.includes(requestedRole)) {
      return res.status(400).json({
        error: `Rol no válido para entorno QA: '${requestedRole}'. Roles permitidos: ${allowedQaRoles.join(', ')}`,
      });
    }

    const db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(firebaseConfig.firestoreDatabaseId)
      : getFirestore();

    const membershipRef = db.doc(`organizations/${targetOrgId}/memberships/${uid}`);
    const userRef = db.doc(`users/${uid}`);
    const auditLogRef = db.collection(`organizations/${targetOrgId}/audit_logs`).doc();

    if (action === 'provision') {
      // A. Provisionar membresía activa
      await membershipRef.set(
        {
          uid,
          email,
          orgId: targetOrgId,
          role: requestedRole,
          status: 'active',
          isQaAccess: true,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: uid,
        },
        { merge: true }
      );

      // B. Actualizar documento de usuario
      await userRef.set(
        {
          uid,
          email,
          orgId: targetOrgId,
          role: requestedRole,
          status: 'active',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // C. Asignar Custom Claims
      await authAdmin.setCustomUserClaims(uid, {
        orgId: targetOrgId,
        role: requestedRole,
      });

      // D. Revocar tokens de refresco para forzar actualización
      await authAdmin.revokeRefreshTokens(uid);

      // E. Registrar Audit Log
      await auditLogRef.set({
        action: 'qa_membership_provisioned',
        actorUid: uid,
        actorEmail: email,
        targetOrgId,
        assignedRole: requestedRole,
        reason,
        timestamp: FieldValue.serverTimestamp(),
        result: 'SUCCESS',
        isSyntheticDataOnly: true,
        ip: req.ip || 'N/A',
      });

      console.log(`[QA PROVISIONER] Acceso QA provisionado: uid=${uid}, orgId=${targetOrgId}, role=${requestedRole}`);

      return res.json({
        success: true,
        action: 'provision',
        orgId: targetOrgId,
        role: requestedRole,
        claimsUpdated: true,
        message: `Acceso QA provisionado con éxito para ${uid} en el tenant '${targetOrgId}' con rol '${requestedRole}'.`,
      });
    } else if (action === 'revoke') {
      // A. Revocar membresía
      await membershipRef.set(
        {
          status: 'suspended',
          isQaAccess: false,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: uid,
        },
        { merge: true }
      );

      // B. Limpiar Custom Claims
      await authAdmin.setCustomUserClaims(uid, {
        orgId: '',
        role: '',
      });

      // C. Revocar tokens de refresco
      await authAdmin.revokeRefreshTokens(uid);

      // D. Registrar Audit Log
      await auditLogRef.set({
        action: 'qa_membership_revoked',
        actorUid: uid,
        actorEmail: email,
        targetOrgId,
        reason,
        timestamp: FieldValue.serverTimestamp(),
        result: 'SUCCESS',
        isSyntheticDataOnly: true,
        ip: req.ip || 'N/A',
      });

      console.log(`[QA PROVISIONER] Acceso QA revocado: uid=${uid}, orgId=${targetOrgId}`);

      return res.json({
        success: true,
        action: 'revoke',
        orgId: targetOrgId,
        role: 'none',
        claimsUpdated: true,
        message: `Acceso QA revocado exitosamente para ${uid} en el tenant '${targetOrgId}'.`,
      });
    } else {
      return res.status(400).json({
        error: `Acción no válida: '${action}'. Las acciones soportadas son 'provision' y 'revoke'.`,
      });
    }
  } catch (error: any) {
    console.error('[QA PROVISIONER ERROR]', error);
    return res.status(500).json({
      error: error?.message || 'Error al procesar la solicitud de acceso QA en el servidor.',
    });
  }
}
