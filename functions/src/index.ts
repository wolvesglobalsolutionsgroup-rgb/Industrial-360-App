import { GoogleGenAI } from '@google/genai';
import * as functions from 'firebase-functions';
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

// ===============================================================
// BOOTSTRAP: TRANSACCIÓN ATÓMICA — EL PRIMERO EN LLEGAR GANA
// ===============================================================

export const onFirstUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const email = snap.data().email || '';
    const orgId = `org-${userId}`;
    const bootstrapRef = db.collection('settings').doc('bootstrap');

    try {
      await db.runTransaction(async (transaction) => {
        const bootstrapDoc = await transaction.get(bootstrapRef);

        if (bootstrapDoc.exists) {
          functions.logger.info(`Bootstrap ya completado. Usuario ${userId} queda pendiente de asignación.`);
          return;
        }

        // Cerrar el candado + crear superadmin + crear org — TODO atómico
        transaction.set(bootstrapRef, {
          initiatedBy: userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        transaction.set(snap.ref, {
          role: 'superadmin',
          orgId: orgId,
          status: 'active',
        }, { merge: true });

        transaction.set(db.collection('organizations').doc(orgId), {
          name: 'Mi Empresa',
          ownerId: userId,
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          members: [userId],
        });
      });

      // Asignar Custom Claims
      await admin.auth().setCustomUserClaims(userId, {
        role: 'superadmin',
        orgId: orgId,
        status: 'active',
      });

      functions.logger.info(`✅ Primer usuario ${userId} es superadmin de ${orgId}`);
    } catch (error: any) {
      functions.logger.error(`Error en bootstrap para ${userId}:`, error.message);
    }
  });

// ===============================================================
// ASIGNACIÓN DE ROLES — CON CUSTOM CLAIMS + AUDIT LOG CORREGIDO
// ===============================================================

export const assignUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debes iniciar sesión.');

  const callerUid = context.auth.uid;
  const { targetUserId, newRole } = data;

  if (!targetUserId || !newRole)
    throw new functions.https.HttpsError('invalid-argument', 'Se requieren targetUserId y newRole.');

  const validRoles = ['campo', 'inspector', 'supervisor', 'gerente', 'superadmin'];
  if (!validRoles.includes(newRole))
    throw new functions.https.HttpsError('invalid-argument', `Rol inválido. Válidos: ${validRoles.join(', ')}`);

  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists)
    throw new functions.https.HttpsError('permission-denied', 'No tienes perfil.');

  const callerData = callerDoc.data()!;
  const callerRole = callerData.role;
  const targetDoc = await db.collection('users').doc(targetUserId).get();
  if (!targetDoc.exists)
    throw new functions.https.HttpsError('not-found', 'Usuario destino no existe.');

  const targetData = targetDoc.data()!;

  // Validar permisos
  if (callerRole !== 'superadmin' && callerRole !== 'gerente')
    throw new functions.https.HttpsError('permission-denied', 'Solo gerentes y superadmins pueden asignar roles.');

  if (targetData.orgId !== callerData.orgId && callerRole !== 'superadmin')
    throw new functions.https.HttpsError('permission-denied', 'El usuario destino no pertenece a tu organización.');

  if (newRole === 'superadmin' && callerRole !== 'superadmin')
    throw new functions.https.HttpsError('permission-denied', 'Solo un superadmin puede asignar superadmin.');

  // Actualizar Firestore
  await db.collection('users').doc(targetUserId).update({
    role: newRole,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Actualizar Custom Claims (SINCRONIZACIÓN)
  await admin.auth().setCustomUserClaims(targetUserId, {
    role: newRole,
    orgId: targetData.orgId,
    status: targetData.status || 'active',
  });

  // AUDIT LOG: siempre en la org del USUARIO DESTINO, no del caller
  const auditOrgId = targetData.orgId || callerData.orgId;
  await db.collection('organizations').doc(auditOrgId).collection('audit_logs').add({
    action: 'user.role_assigned',
    actor: {
      uid: callerUid,
      email: callerData.email,
      role: callerRole,
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers['user-agent'] || 'unknown',
    },
    changes: {
      before: { role: targetData.role || null },
      after: { role: newRole },
    },
    targetUser: targetUserId,
    severity: 'info',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: `Rol ${newRole} asignado a ${targetUserId}.` };
});

// ===============================================================
// CREAR USUARIO CON ROL — CON CUSTOM CLAIMS
// ===============================================================

export const createUserWithRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debes iniciar sesión.');

  const callerUid = context.auth.uid;
  const { email, displayName, role, orgId } = data;

  if (!email || !role)
    throw new functions.https.HttpsError('invalid-argument', 'Se requieren email y role.');

  const callerDoc = await db.collection('users').doc(callerUid).get();
  const callerData = callerDoc.data();
  if (!callerData || (callerData.role !== 'superadmin' && callerData.role !== 'gerente'))
    throw new functions.https.HttpsError('permission-denied', 'No tienes permiso.');

  const targetOrgId = orgId || callerData.orgId;

  if (targetOrgId !== callerData.orgId && callerData.role !== 'superadmin')
    throw new functions.https.HttpsError('permission-denied', 'No puedes crear usuarios fuera de tu organización.');

  const validRoles = ['campo', 'inspector', 'supervisor', 'gerente'];
  if (callerData.role !== 'superadmin' && role === 'superadmin')
    throw new functions.https.HttpsError('permission-denied', 'Solo superadmin puede crear superadmin.');
  if (!validRoles.includes(role) && role !== 'superadmin')
    throw new functions.https.HttpsError('invalid-argument', `Rol inválido: ${role}`);

  let userRecord;
  try {
    userRecord = await admin.auth().createUser({ email, displayName: displayName || email });
  } catch {
    throw new functions.https.HttpsError('already-exists', `El email ${email} ya está registrado.`);
  }

  const newUid = userRecord.uid;

  await db.collection('users').doc(newUid).set({
    email,
    displayName: displayName || email,
    role,
    orgId: targetOrgId,
    status: 'active',
    createdBy: callerUid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Custom Claims desde el inicio
  await admin.auth().setCustomUserClaims(newUid, {
    role,
    orgId: targetOrgId,
    status: 'active',
  });

  // Audit log
  await db.collection('organizations').doc(targetOrgId).collection('audit_logs').add({
    action: 'user.created',
    actor: {
      uid: callerUid,
      email: callerData.email,
      role: callerData.role,
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers['user-agent'] || 'unknown',
    },
    targetUser: newUid,
    email,
    role,
    severity: 'info',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

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
  if (['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'].includes(requestedModel))
    requestedModel = 'gemini-3.6-flash';
  else if (requestedModel === 'gemini-2.5-flash-preview-tts')
    requestedModel = 'gemini-3.1-flash-tts-preview';

  const candidateModels = [requestedModel, 'gemini-3.6-flash', 'gemini-3.1-flash-lite']
    .filter((m, i, a) => a.indexOf(m) === i);

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
  try {
    const result = await handleGeminiProxy(req.body || {});
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Gemini Proxy Error:', error);
    res.status(500).json({ error: error?.message || 'Error ejecutando Gemini.' });
  }
};
