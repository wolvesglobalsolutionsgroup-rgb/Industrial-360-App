import { GoogleGenAI } from '@google/genai';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// ===============================================================
// INTERFACES
// ===============================================================

export interface GeminiProxyRequest {
  prompt?: string;
  model?: string;
  systemInstruction?: string;
  contents?: any;
  config?: any;
}

// ===============================================================
// BOOTSTRAP: PRIMER USUARIO = SUPERADMIN
// ===============================================================
// Se dispara cuando se crea un documento en /users/{userId}.
// Si es el PRIMER usuario del sistema, le asigna rol superadmin
// y crea su organización por defecto.
// ===============================================================

export const onFirstUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;

    // Contar cuántos usuarios existen
    const countSnapshot = await db.collection('users').count().get();
    const totalUsers = countSnapshot.data().count;

    // Si es el primer usuario, es superadmin
    if (totalUsers === 1) {
      const orgId = `org-${userId}`;

      // Asignar superadmin + orgId
      await snap.ref.set({
        role: 'superadmin',
        orgId: orgId,
      }, { merge: true });

      // Crear organización por defecto
      await db.collection('organizations').doc(orgId).set({
        name: 'Mi Empresa',
        ownerId: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        members: [userId],
      });

      functions.logger.info(`✅ Primer usuario creado: ${userId} → superadmin de org ${orgId}`);
    } else {
      // Usuarios subsequentes: asignar orgId del usuario que los invitó
      // (requiere lógica adicional de邀请)
      functions.logger.info(`Usuario ${userId} creado. No es el primero, esperar asignación de rol.`);
    }
  });

// ===============================================================
// ASIGNACIÓN DE ROLES (LLAMABLE HTTPS)
// ===============================================================
// El Gerente o Superadmin llama a esta función para cambiar el rol
// de un miembro de su organización.
//
// Uso desde frontend:
//   const result = await callFirebaseFunction('assignUserRole', {
//     targetUserId: 'abc123',
//     newRole: 'supervisor'
//   });
// ===============================================================

export const assignUserRole = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Debes iniciar sesión para asignar roles.'
    );
  }

  const callerUid = context.auth.uid;
  const { targetUserId, newRole } = data;

  // Validar parámetros
  if (!targetUserId || !newRole) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Se requieren targetUserId y newRole.'
    );
  }

  const validRoles = ['campo', 'inspector', 'supervisor', 'gerente', 'superadmin'];
  if (!validRoles.includes(newRole)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Rol inválido. Válidos: ${validRoles.join(', ')}`
    );
  }

  // Obtener datos del solicitante
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'No tienes perfil de usuario.'
    );
  }

  const callerData = callerDoc.data()!;
  const callerRole = callerData.role;
  const callerOrgId = callerData.orgId;

  // Solo superadmin o gerente pueden asignar roles
  if (callerRole !== 'superadmin' && callerRole !== 'gerente') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo gerentes y superadmins pueden asignar roles.'
    );
  }

  // Obtener datos del usuario destino
  const targetDoc = await db.collection('users').doc(targetUserId).get();
  if (!targetDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'El usuario destino no existe.'
    );
  }

  const targetData = targetDoc.data()!;

  // Verificar que el usuario destino pertenezca a la misma organización
  if (targetData.orgId !== callerOrgId && callerRole !== 'superadmin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'El usuario destino no pertenece a tu organización.'
    );
  }

  // Un gerente no puede asignar superadmin
  if (newRole === 'superadmin' && callerRole !== 'superadmin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo un superadmin puede asignar el rol superadmin.'
    );
  }

  // Asignar el rol
  await db.collection('users').doc(targetUserId).update({
    role: newRole,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Registrar en audit_logs
  await db.collection('organizations').doc(callerOrgId).collection('audit_logs').add({
    action: 'assign_role',
    performedBy: callerUid,
    targetUser: targetUserId,
    previousRole: targetData.role || null,
    newRole: newRole,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  functions.logger.info(`✅ Rol asignado: ${callerUid} → ${targetUserId} = ${newRole}`);

  return {
    success: true,
    message: `Rol ${newRole} asignado a usuario ${targetUserId}.`,
  };
});

// ===============================================================
// CREAR USUARIO CON ROL (LLAMABLE HTTPS)
// ===============================================================
// El Gerente o Superadmin crea un nuevo usuario con rol específico.
// Útil para invitaciones: el admin crea la cuenta y asigna el rol
// en un solo paso.
// ===============================================================

export const createUserWithRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const callerUid = context.auth.uid;
  const { email, displayName, role, orgId } = data;

  if (!email || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Se requieren email y role.');
  }

  // Verificar que el solicitante es superadmin o gerente
  const callerDoc = await db.collection('users').doc(callerUid).get();
  const callerData = callerDoc.data();
  if (!callerData || (callerData.role !== 'superadmin' && callerData.role !== 'gerente')) {
    throw new functions.https.HttpsError('permission-denied', 'No tienes permiso para crear usuarios.');
  }

  // Determinar orgId
  const targetOrgId = orgId || callerData.orgId;

  // Solo superadmin puede crear usuarios en otra org
  if (targetOrgId !== callerData.orgId && callerData.role !== 'superadmin') {
    throw new functions.https.HttpsError('permission-denied', 'No puedes crear usuarios fuera de tu organización.');
  }

  // Validar rol
  const validRoles = ['campo', 'inspector', 'supervisor', 'gerente'];
  if (callerData.role !== 'superadmin' && role === 'superadmin') {
    throw new functions.https.HttpsError('permission-denied', 'Solo un superadmin puede crear otro superadmin.');
  }
  if (!validRoles.includes(role) && role !== 'superadmin') {
    throw new functions.https.HttpsError('invalid-argument', `Rol inválido: ${role}`);
  }

  // Crear usuario en Firebase Auth
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email,
      displayName: displayName || email,
      emailVerified: false,
      disabled: false,
    });
  } catch (error: any) {
    throw new functions.https.HttpsError('already-exists', `El email ${email} ya está registrado.`);
  }

  const newUid = userRecord.uid;

  // Crear documento de usuario con rol y orgId
  await db.collection('users').doc(newUid).set({
    email,
    displayName: displayName || email,
    role: role,
    orgId: targetOrgId,
    createdBy: callerUid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Audit log
  await db.collection('organizations').doc(targetOrgId).collection('audit_logs').add({
    action: 'user_created',
    performedBy: callerUid,
    targetUser: newUid,
    email,
    role,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  functions.logger.info(`✅ Usuario creado: ${email} → ${newUid} con rol ${role} en org ${targetOrgId}`);

  return {
    success: true,
    uid: newUid,
    email,
    role,
  };
});

// ===============================================================
// PROXY EXISTENTE DE GEMINI (sin cambios)
// ===============================================================

export async function handleGeminiProxy(reqBody: GeminiProxyRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  let requestedModel = reqBody.model || 'gemini-3.6-flash';
  if (requestedModel === 'gemini-2.5-flash' || requestedModel === 'gemini-1.5-flash' || requestedModel === 'gemini-2.0-flash') {
    requestedModel = 'gemini-3.6-flash';
  } else if (requestedModel === 'gemini-2.5-flash-preview-tts') {
    requestedModel = 'gemini-3.1-flash-tts-preview';
  }

  const candidateModels = [
    requestedModel,
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
  ].filter((m, i, self) => self.indexOf(m) === i);

  let contents = reqBody.contents;
  if (!contents && reqBody.prompt) {
    contents = reqBody.prompt;
  }

  const config: any = reqBody.config || {};
  if (reqBody.systemInstruction) {
    config.systemInstruction = reqBody.systemInstruction;
  }

  let lastError: any = null;

  for (const modelName of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          ...(Object.keys(config).length > 0 ? { config } : {}),
        });

        return {
          text: response.text || '',
          candidates: response.candidates,
          raw: response,
        };
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.code;
        const msg = err?.message || '';
        const isTransient = status === 503 || status === 429 || msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('Quota exceeded');

        if (isTransient && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }
        if (isTransient) {
          break;
        }
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini API models.');
}

export const callGeminiProxy = async (req: any, res: any) => {
  res.set('Access-Control-Allow-Origin', '*');
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
