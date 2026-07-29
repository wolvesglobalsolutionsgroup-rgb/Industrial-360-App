import { GoogleGenAI } from '@google/genai';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

export interface GeminiProxyRequest {
  prompt?: string;
  model?: string;
  systemInstruction?: string;
  contents?: any;
  config?: any;
}

const getClientIp = (rawRequest: any): string => {
  if (!rawRequest) return 'unknown';
  const xForwarded = rawRequest.headers['x-forwarded-for'];
  if (xForwarded) return xForwarded.split(',')[0].trim();
  return rawRequest.headers['fastly-client-ip']
    || rawRequest.headers['x-real-ip']
    || rawRequest.ip
    || rawRequest.socket?.remoteAddress
    || 'unknown';
};

// ===============================================================
// BOOTSTRAP V2: onDocumentCreated
// ===============================================================
export const onFirstUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userId = event.params.userId;
  if (!event.data) return;

  const email = event.data.data().email || '';
  const orgId = `org-${userId}`;
  const bootstrapRef = db.collection('settings').doc('bootstrap');

  try {
    await db.runTransaction(async (transaction) => {
      const bootstrapDoc = await transaction.get(bootstrapRef);
      if (bootstrapDoc.exists) return;

      transaction.set(bootstrapRef, {
        initiatedBy: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      transaction.set(event.data.ref, {
        role: 'superadmin', orgId, status: 'active',
      }, { merge: true });
      transaction.set(db.collection('organizations').doc(orgId), {
        name: 'Mi Empresa', ownerId: userId, status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(), members: [userId],
      });
    });

    await admin.auth().setCustomUserClaims(userId, { role: 'superadmin', orgId, status: 'active' });
    logger.info(`Primer usuario ${userId} es superadmin de ${orgId}`);
  } catch (error: any) {
    logger.error(`Error en bootstrap:`, error.message);
  }
});

// ===============================================================
// ASIGNACIÓN DE ROLES V2
// ===============================================================
export const assignUserRole = onCall({ minInstances: 1 }, async (req) => {
  if (!req.auth) throw new Error('Unauthenticated');

  const callerUid = req.auth.uid;
  const data = req.data as any;
  const { targetUserId, newRole } = data;

  if (!targetUserId || !newRole) throw new Error('Se requieren targetUserId y newRole.');

  const validRoles = ['campo', 'inspector', 'supervisor', 'gerente', 'superadmin'];
  if (!validRoles.includes(newRole)) throw new Error('Rol inválido.');

  const [callerSnap, targetSnap] = await Promise.all([
    db.collection('users').doc(callerUid).get(),
    db.collection('users').doc(targetUserId).get(),
  ]);

  if (!callerSnap.exists) throw new Error('No tienes perfil.');
  if (!targetSnap.exists) throw new Error('Usuario destino no existe.');

  const callerData = callerSnap.data()!;
  const targetData = targetSnap.data()!;

  if (callerData.role !== 'superadmin' && callerData.role !== 'gerente')
    throw new Error('Solo gerentes y superadmins pueden asignar roles.');

  if (targetData.orgId !== callerData.orgId && callerData.role !== 'superadmin')
    throw new Error('El usuario destino no pertenece a tu organización.');

  if (newRole === 'superadmin' && callerData.role !== 'superadmin')
    throw new Error('Solo un superadmin puede asignar superadmin.');

  await db.collection('users').doc(targetUserId).update({
    role: newRole,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await admin.auth().setCustomUserClaims(targetUserId, {
    role: newRole, orgId: targetData.orgId, status: targetData.status || 'active',
  });
  await admin.auth().revokeRefreshTokens(targetUserId);

  const auditOrgId = targetData.orgId || callerData.orgId || 'system-platform';
  await db.collection('organizations').doc(auditOrgId).collection('audit_logs').add({
    action: 'user.role_assigned',
    actor: {
      uid: callerUid, email: callerData.email, role: callerData.role,
      ipAddress: getClientIp(req.rawRequest),
      userAgent: req.rawRequest?.headers['user-agent'] || 'unknown',
    },
    changes: { before: { role: targetData.role || null }, after: { role: newRole } },
    targetUser: targetUserId,
    severity: 'info',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: `Rol ${newRole} asignado a ${targetUserId}.` };
});

// ===============================================================
// CREAR USUARIO CON ROL V2
// ===============================================================
export const createUserWithRole = onCall({ minInstances: 1 }, async (req) => {
  if (!req.auth) throw new Error('Unauthenticated');

  const callerUid = req.auth.uid;
  const data = req.data as any;
  const { email, displayName, role, orgId } = data;

  if (!email || !role) throw new Error('Se requieren email y role.');

  const callerDoc = await db.collection('users').doc(callerUid).get();
  const callerData = callerDoc.data();
  if (!callerData || (callerData.role !== 'superadmin' && callerData.role !== 'gerente'))
    throw new Error('No tienes permiso.');

  const targetOrgId = orgId || callerData.orgId;
  if (targetOrgId !== callerData.orgId && callerData.role !== 'superadmin')
    throw new Error('No puedes crear usuarios fuera de tu organización.');

  const validRoles = ['campo', 'inspector', 'supervisor', 'gerente'];
  if (callerData.role !== 'superadmin' && role === 'superadmin')
    throw new Error('Solo superadmin puede crear superadmin.');
  if (!validRoles.includes(role) && role !== 'superadmin')
    throw new Error('Rol inválido.');

  let userRecord;
  try {
    userRecord = await admin.auth().createUser({ email, displayName: displayName || email });
  } catch {
    throw new Error(`El email ${email} ya está registrado.`);
  }

  const newUid = userRecord.uid;

  try {
    const batch = db.batch();
    batch.set(db.collection('users').doc(newUid), {
      email, displayName: displayName || email, role, orgId: targetOrgId, status: 'active',
      createdBy: callerUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const auditOrgId = targetOrgId || 'system-platform';
    batch.set(db.collection('organizations').doc(auditOrgId).collection('audit_logs').doc(), {
      action: 'user.created',
      actor: {
        uid: callerUid, email: callerData.email, role: callerData.role,
        ipAddress: getClientIp(req.rawRequest),
        userAgent: req.rawRequest?.headers['user-agent'] || 'unknown',
      },
      targetUser: newUid, email, role, severity: 'info',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    await batch.commit();
    await admin.auth().setCustomUserClaims(newUid, { role, orgId: targetOrgId, status: 'active' });
  } catch (dbError: any) {
    await admin.auth().deleteUser(newUid);
    logger.error(`Rollback: usuario ${newUid} eliminado por fallo en BD`);
    throw new Error('Error de consistencia. Creación revertida.');
  }

  return { success: true, uid: newUid, email, role };
});

// ===============================================================
// GEMINI PROXY (sin cambios)
// ===============================================================
export async function handleGeminiProxy(reqBody: GeminiProxyRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada.');
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  let requestedModel = reqBody.model || 'gemini-3.6-flash';
  if (['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'].includes(requestedModel)) requestedModel = 'gemini-3.6-flash';
  else if (requestedModel === 'gemini-2.5-flash-preview-tts') requestedModel = 'gemini-3.1-flash-tts-preview';
  const candidateModels = [requestedModel, 'gemini-3.6-flash', 'gemini-3.1-flash-lite'].filter((m, i, a) => a.indexOf(m) === i);
  let contents = reqBody.contents || reqBody.prompt;
  const config: any = reqBody.config || {};
  if (reqBody.systemInstruction) config.systemInstruction = reqBody.systemInstruction;
  let lastError: any = null;
  for (const modelName of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({ model: modelName, contents, ...(Object.keys(config).length ? { config } : {}) });
        return { text: response.text || '', candidates: response.candidates, raw: response };
      } catch (err: any) {
        lastError = err;
        const isTransient = err?.status === 503 || err?.status === 429 || err?.message?.includes('Quota exceeded');
        if (isTransient && attempt === 0) { await new Promise(r => setTimeout(r, 800)); continue; }
        if (isTransient) break;
        throw err;
      }
    }
  }
  throw lastError || new Error('Error al generar respuesta.');
}

export const callGeminiProxy = async (req: any, res: any) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  try { const result = await handleGeminiProxy(req.body || {}); res.status(200).json(result); }
  catch (error: any) { console.error('Gemini Proxy Error:', error); res.status(500).json({ error: error?.message || 'Error ejecutando Gemini.' }); }
};
