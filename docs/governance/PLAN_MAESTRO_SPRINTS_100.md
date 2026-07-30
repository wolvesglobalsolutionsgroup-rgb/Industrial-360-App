# 🗺️ PLAN MAESTRO CORREGIDO DE SPRINTS — RUTA A PRODUCCIÓN VERIFICABLE (S0 → S14)
## Industrial Control 360 — Ejecución con Google AI Studio (GAIS)

**Código del Documento:** `DOC-GOV-2026-011` (v4 — Corregida y Consolidada)  
**Ubicación:** `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`  
**Fecha:** 29 de Julio de 2026  
**Panel de Auditoría:** ChatGPT 5.6 Terra Thinking + Claude 5 Sonnet Thinking + Qwen 3.8 Max (MCP GitHub)  
**Director de Operaciones & Síntesis:** Antigravity (DeepMind)  
**Implementador Exclusivo:** Google AI Studio (GAIS) via Pull Requests (NUNCA push directo a `main`)  

---

## 📐 0. REGLAS TRANSVERSALES DE EJECUCIÓN (APLICA A TODOS LOS SPRINTS)

```text
⚠️ REGLAS INQUEBRANTABLES — GAIS:
1. Eres GAIS, el ÚNICO desarrollador autorizado a escribir código en este repo.
2. Trabajas SOLO en ramas sprint/IC360-SXX-<nombre>. PROHIBIDO push directo a main.
3. PROHIBIDO: firebase deploy no autorizado, rotar secretos, cambiar fórmulas en src/lib/norms/ sin ticket específico, o crear wildcards permisivos.
4. Aislamiento multi-tenant estricto: toda entidad vive bajo /organizations/{orgId}/projects/{projId}/...
5. Ningún secreto, token o clave se incluye en src/ ni en el bundle cliente.
6. Ningún dato mostrado puede ser Math.random(), mock o simulación presentada como real, salvo que esté explícitamente gateado y marcado.
7. Todo ID oficial regulatorio (PTW, ART, LOTO, RASDA, MAT, WBS) se emite por Cloud Function con Admin SDK, nunca por el cliente.
8. Al terminar, responde el Auto-Checklist Obligatorio de 12 Preguntas de Claude y abre PR sin mergear.
```

### ❓ Auto-Checklist Obligatorio de 12 Preguntas (Cierre de cada Sprint):
```text
1. ¿Qué archivos se modificaron, por qué y qué ticket lo autoriza?
2. ¿Qué archivos deliberadamente NO se modificaron?
3. ¿npm ci, lint, tsc --noEmit, build y tests relevantes están verdes?
4. Si toca Firebase, ¿los tests Emulator pasan y fallan cuando deben fallar?
5. Si se tocaron roles, reglas, Storage, tokens o Functions, ¿qué prueba demuestra que Org A no accede a Org B?
6. ¿Se expuso algún secreto, token, URL firmada o dato PII nuevo?
7. ¿Se agregó código temporal, mock o demo? ¿Está gateado y fuera de producción?
8. ¿Qué migración de datos, índice o cambio de compatibilidad existe?
9. ¿Cuál es el rollback exacto?
10. ¿Qué estados vacío, error, offline y permiso denegado se probaron?
11. ¿Qué evidencia (CLI/capturas) acompaña el PR?
12. ¿Qué quedó fuera de alcance y qué riesgo residual permanece?
```

---

## 📊 1. MAPA DE SPRINTS CORREGIDO (S0 → S14)

| Sprint | Nombre | Prioridad | Depende de | Cierra Brecha / Objetivo |
|---|---|---|---|---|
| **S0** | Fundación de pruebas: Emulator real + scripts CI mínimos | P0 | — | Pruebas de reglas en emulador obligatorias (sin pasadas en silencio) |
| **S1** | Zero-Trust: Membership admin + Custom Claims + `firestore.rules` explícito | P0 | S0 | Base de datos pública (`signedIn() { return true; }`) |
| **S2** | RBAC real en cliente (JWT como única fuente) | P0 | S1 | Eliminación del `<select>` superadmin y `localStorage` |
| **S3** | Backend único + API Auth + Rate-limit persistente + `storage.rules` | P0 | S1 | Abuso de cuota Gemini/Resend y aislamiento de fotos |
| **S4** | Autenticación endurecida (sin demo silencioso) | P0 | S2 | Registro explícito por administrador |
| **S5** | CI/CD bloqueante + desacople `server.ts` / `functions/` | P1 | S0, S3 | Reparación de tipos `tsc` en `server.ts` y pipeline bloqueante |
| **S6** | Multi-tenant 13/13 + repositorios + IDs regulatorios server-side | P1 | S1, S3 | Adiós `Math.random()`, emisión por Cloud Function con Admin SDK |
| **S7** | Sanitización XSS + Error Boundaries + eliminación de mocks | P1 | S2 | Sanitización SVG/HTML e higienización de `PlatformOwnerConsole` |
| **S8** | Motor normativo modular (B31G/API 570/API 1163) + golden tests | P1 | S5 | Calculadoras puras tipadas y testeables con referencias normativas |
| **S9** | Portal Cliente seguro (token hasheado) + sello documental SHA-256 | P1 | S3, S6 | Dossier inviolable con verificación QR en tiempo real |
| **S10**| Motor offline unificado: outbox + idempotencia + conflictos | P1 | S6 | Cero duplicados en sync y resolución de conflictos |
| **S11**| Observabilidad y datos sensibles (Sentry/logger) | P2 | S5 | Redacción de PII y monitoreo de errores en producción |
| **S12**| Rendimiento (code-splitting) y auditoría de dependencias | P2 | S11 | Sustitución de `xlsx` si aplica y división de chunks de JS |
| **S13**| **PILOTO PROINTECA END-TO-END (Propanoducto Cardón-Amuay)** | P0 comercial | S6, S8, S9, S10 | **Valor Tangible YA:** Flujo completo WBS→PTW→Campo→QA/QC→Dossier |
| **S14**| Auditoría final y dictamen de producción | — | Todos | Verificación de cierre total con rúbrica enterprise (≥93-95/100) |

---

# 🚀 2. PROMPTS LISTOS PARA COPIAR Y PEGAR EN GOOGLE AI STUDIO (S0 → S13)

---

### 📋 PROMPT GAIS — SPRINT S0 (Fundación de Pruebas: Emulator Real & Harness)
```text
Actúa como Senior Test Infrastructure Engineer (Firebase Emulator Suite). 
Trabajas SOLO en la rama `sprint/IC360-S0-test-foundation`. 
PROHIBIDO: Push a main, firebase deploy, modificar firestore.rules, modificar lógica de negocio.

CONTEXTO: securityRules.test.ts contiene casos con `if (!testEnv) return;`, lo que hace que los tests pasen en silencio sin validar nada si el emulador no está corriendo. Antes de escribir ninguna regla nueva, necesitamos una fundación de pruebas que falle ruidosamente si no hay emulador real.

TAREA 1 — SCRIPTS DE TEST EXPLÍCITOS (package.json):
{
  "test:unit": "vitest run",
  "test:rules": "firebase emulators:exec --only firestore \"vitest run tests/rules\"",
  "test:storage-rules": "firebase emulators:exec --only storage \"vitest run tests/storage\"",
  "test:all": "npm run test:unit && npm run test:rules && npm run test:storage-rules"
}

TAREA 2 — ELIMINAR EL TEST SILENCIOSO:
- En securityRules.test.ts, reemplaza cada `if (!testEnv) return;` por un beforeAll() que use initializeTestEnvironment() de @firebase/rules-unit-testing y haga throw si el emulador no responde en localhost:8080. La suite debe ABORTAR, no pasar en silencio.
- Usa authenticatedContext(uid, claims) para simular usuarios con distintos role/orgId en los claims (no en Firestore).

TAREA 3 — HARNESS REUTILIZABLE (tests/rules/setup.ts):
- Exporta getTestEnv(), getAuthedDb(uid, claims), getUnauthedDb().
- Exporta helpers assertDenied() y assertAllowed() que envuelven assertFails/assertSucceeds con mensajes descriptivos.

TAREA 4 — CI MÍNIMO (.github/workflows/ci.yml):
- Job test: instala Firebase CLI, corre `npm run test:all` con el emulador.
- Si no hay workflow, créalo. Si existe, NO rompas jobs existentes, añade este como job nuevo obligatorio (required check).

VERIFICACIÓN Y ENTREGA:
- Corre npm run test:rules localmente (documenta el comando exacto).
- Sin emulador corriendo: el comando debe fallar visiblemente, no pasar.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S0-test-foundation. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S1 (Zero-Trust: Membership Admin + Custom Claims + Rules)
```text
Actúa como Lead Firebase Security Engineer. Trabajas SOLO en la rama `sprint/IC360-S1-zero-trust`. 
PROHIBIDO: Push a main, firebase deploy no autorizado, tocar src/lib/norms/. Depende de S0 mergeado.

CONTEXTO VERIFICADO:
- firestore.rules tiene un helper signedIn() que retorna true incondicional → base de datos efectivamente pública.
- No se debe usar /users/{uid} como fuente de claims si ese documento es editable por el propio usuario: eso permitiría auto-escalar rol.

⚠️ REGLAS INQUEBRANTABLES:
1. El fallback de TODA función helper es DENEGAR (false), nunca permitir.
2. Catch-all final: match /{document=**} { allow read, write: if false; }
3. PROHIBIDO wildcard de escritura tipo /organizations/{org}/{path=**}. Cada colección se declara explícitamente.
4. El rol y la organización de un usuario NUNCA se derivan de un documento que el propio usuario puede escribir.
5. NO modifiques las aserciones ya correctas de securityRules.test.ts.
6. NO hagas firebase deploy. Solo commitea.

TAREA 1 — MEMBERSHIP ADMINISTRADO (functions/src/membership.ts):
- Colección backend-only /organizations/{orgId}/memberships/{uid} con { role, status, invitedBy, createdAt }. El cliente NUNCA escribe esta colección (ni siquiera con reglas "solo lectura del propio uid").
- Callable assignMembership(targetUid, orgId, role): (a) exige context.auth; (b) verifica que el actor sea superadmin o gerente de esa misma orgId; (c) valida que el rol solicitado esté permitido para el actor; (d) escribe membership; (e) llama admin.auth().setCustomUserClaims(uid, { orgId, role, claimsVersion: Date.now() }); (f) escribe audit log append-only en /organizations/{orgId}/audit_logs.
- Callable revokeMembership(targetUid, orgId): solo superadmin o gerente de esa org; limpia claims; NO borra el historial de membership, marca status: 'revoked'.
- src/firebase.ts: tras login, invoca user.getIdTokenResult(true) y lee claims.role/claims.orgId. NO leas rol desde Firestore.

TAREA 2 — REESCRIBIR firestore.rules (Zero-Trust explícito por colección):
- Helpers: isAuthenticated(), tokenOrgId(), tokenRole(), belongsToOrg(orgId), hasAnyRole(roles).
- /organizations/{orgId}/memberships/{uid}: lectura solo del propio uid o superadmin; escritura SIEMPRE false desde cliente.
- /organizations/{orgId}/projects/{projectId}/tasks/{id}, /field_reports/{id}, /siho_ptw/{id}, /weld_joints/{id}, /expenses/{id}, /valuations/{id}, /documents/{id}, /inventory/{id}: declara cada una individualmente. read si belongsToOrg(orgId). create/update exige belongsToOrg(orgId) + hasAnyRole([...]) + request.resource.data.orgId == orgId + request.resource.data.projectId == projectId. orgId, projectId, createdBy, createdAt son inmutables en update.
- /organizations/{orgId}/audit_logs/{id}: create solo desde Functions; read solo superadmin/gerente de esa org.
- /organizations/{orgId}/counters/{id}: allow read, write: if false (solo Admin SDK).
- CERO wildcards permisivos. CERO "if true".

TAREA 3 — TESTS REALES (usando el harness de S0):
- Caso: usuario sin membership no lee ningún dato de la org.
- Caso: usuario Org A no lee/escribe Org B.
- Caso: rol 'campo' no puede aprobar ni borrar documentos.
- Caso: usuario no puede escribir su propia membership ni counters.
- Caso: gerente no puede crear otro gerente/superadmin vía la Function.

VERIFICACIÓN Y ENTREGA:
- npm run test:rules → pega salida completa.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S1-zero-trust describiendo antes/después de cada regla y de la emisión de claims. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S2 (RBAC Real en Cliente)
```text
Actúa como Senior React 19 / TypeScript Security Engineer. Trabajas SOLO en la rama `sprint/IC360-S2-rbac-cliente`. 
PROHIBIDO: Merge a main, firebase deploy, tocar firestore.rules. Depende de S1 mergeado.

⚠️ REGLAS INQUEBRANTABLES:
- El rol JAMÁS vuelve a escribirse en localStorage como fuente de verdad.
- El JWT verificado (claims) es la ÚNICA fuente de autorización.

1. NUEVO HOOK src/hooks/useAuthClaims.ts:
   - auth.onIdTokenChanged + user.getIdTokenResult() expone { role, orgId, claimsVersion, loading, error }.
   - Si claims.role u orgId son undefined tras login exitoso, expón estado 'pending-membership' (el usuario existe en Auth pero aún no tiene membresía asignada).
   - NO leer rol desde Firestore ni localStorage.

2. REFACTOR ProjectContext.tsx:
   - Elimina ic360_userRole de localStorage (lectura y escritura).
   - userRole deriva de useAuthClaims(). Elimina setUserRole del contexto.
   - Perfil (displayName, photoURL, preferencias) sigue leyendo Firestore normalmente.

3. REFACTOR ProtectedRoute.tsx:
   - Usa useAuthClaims() en lugar de useProject().userRole.
   - Maneja 3 estados: loading, pending-membership (pantalla "Su cuenta está pendiente de asignación de rol"), y denied (rol real insuficiente).
   - ELIMINA el <select> "Cambiar rol / Entorno de Pruebas". Si se necesita para desarrollo, envuélvelo en {import.meta.env.DEV && (...)} para que no exista en el bundle de producción.

4. AUTORIZACIÓN EN DOS CAPAS:
   - Audita Command Palette, menús de acción rápida y botones sensibles. Cada uno debe verificar useAuthClaims().role.

5. RUTAS SIN FUGAS (src/App.tsx):
   - Alias existentes se convierten en <Navigate replace /> hacia la ruta canónica: /master-console → /platform-owner-console, /loto → /loto-isolation, /apu → /apu-estimation, /instrumentation → /instrumentation-control, /civil → /civil-engineering.
   - PlatformOwnerConsole excluido para cualquier rol distinto de superadmin.

VERIFICACIÓN Y ENTREGA:
- npm run build → grep en dist/ buscando "Cambiar a:" → no debe aparecer.
- npx tsc --noEmit sin errores.
- Prueba manual documentada: sin claims → pantalla pending-membership; con rol insuficiente → denegado; con rol correcto → renderiza.
- Abre PR a sprint/IC360-S2-rbac-cliente. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S3 (Backend Único, API Auth, Rate Limit Persistente & Storage Rules)
```text
Actúa como Senior Backend Engineer (Firebase Functions) y Cloud Security Engineer. Trabajas SOLO en la rama `sprint/IC360-S3-api-storage`. 
PROHIBIDO: Merge a main, firebase deploy, rotar secretos, imprimir valores de API keys, mantener dos backends para la misma responsabilidad.

DECISIÓN DE ARQUITECTURA:
Firebase Cloud Functions es el backend único para Auth, Gemini proxy, correo, PDFs y auditoría. Si server.ts duplica alguna de estas responsabilidades, se retira de server.ts y queda solo en functions/.

⚠️ REGLAS INQUEBRANTABLES:
- GEMINI_API_KEY y RESEND_API_KEY solo en variables de entorno de Functions.
- Sin fallback CORS wildcard (*): solo orígenes explícitos en lista blanca.
- Rate limiting debe sobrevivir a múltiples instancias (no memoria local en proceso).

1. MIDDLEWARE requireAuth (functions/src/middleware/requireAuth.ts):
   - Verifica Authorization: Bearer <idToken> con admin.auth().verifyIdToken(idToken, true).
   - 401 si falta/inválido; 403 si no hay claims.orgId.
   - Adjunta { uid, orgId, role } al contexto.

2. RATE LIMITING PERSISTENTE (functions/src/middleware/rateLimit.ts):
   - Usa colección Firestore /rate_limits/{uid}_{operation}_{windowKey} con TTL lógico o transacción.
   - Límites: callGeminiProxy 20/min por uid + 200/día por orgId; sendEmail 5/min por uid + 100/día por orgId. 429 con { error, retryAfterSeconds }.

3. CORS ESTRICTO:
   - Lista blanca explícita de orígenes de producción + localhost SOLO si process.env.NODE_ENV !== 'production'. Header Vary: Origin.

4. VALIDACIÓN DE PAYLOAD:
   - callGeminiProxy: exige prompt (string ≤30000 chars) o contents estructurado; 400 si no cumple.
   - sendEmail: valida destinatario, subject ≤200 chars, html ≤100KB. Si RESEND_API_KEY no está configurada → 503 con error honesto (JAMÁS { success: true, simulated: true }).

5. ELIMINAR ENDPOINT DUPLICADO:
   - Deja solo un endpoint /api/callGeminiProxy. Revisa todo el repo.

6. CLIENTE CON TOKEN:
   - src/lib/geminiProxy.ts y emailService.ts obtienen auth.currentUser?.getIdToken() y lo envían en Authorization.

7. STORAGE RULES (storage.rules):
   - Denegación por defecto: match /{allPaths=**} { allow read, write: if false; }
   - /organizations/{orgId}/{allPaths=**}: read/write solo si request.auth != null y (request.auth.token.orgId == orgId o superadmin).
   - request.resource.size < 20MB y contentType de imagen o PDF.
   - /organizations/{orgId}/brandkit_public/{allPaths=**}: read público permitido SOLO para esta subcarpeta (max 2MB, png/jpeg/svg).
   - Registra "storage": { "rules": "storage.rules" } en firebase.json.

VERIFICACIÓN Y ENTREGA:
- Prueba manual documentada: sin token → 401; token revocado → 401; ráfaga 25 → 429.
- npm run test:storage-rules en verde.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S3-api-storage. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S4 (Autenticación Endurecida sin Demo Silencioso)
```text
Actúa como Senior React 19 / TypeScript Security Engineer. Trabajas SOLO en la rama `sprint/IC360-S4-auth-hardening`. 
PROHIBIDO: Merge a main, firebase deploy. Depende de S2 mergeado.

⚠️ REGLAS INQUEBRANTABLES:
- El comportamiento por defecto es el SEGURO: ningún acceso anónimo, ninguna cuenta creada automáticamente.
- NO elimines el modo demo: gatéalo tras un flag explícito solo para desarrollo.

1. FLAG DE ENTORNO:
   - .env.example: VITE_ENABLE_DEMO_AUTH= con comentario "SOLO desarrollo/demos. Ausente o false en producción."
   - src/config.ts: export const DEMO_AUTH_ENABLED = import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true';

2. loginWithEmail (src/firebase.ts):
   - Elimina la rama que crea cuenta automáticamente ante auth/user-not-found. Lanza error: "Cuenta no registrada. Contacte al administrador."
   - Elimina cualquier fallback silencioso a usuario local si la API key o el dominio fallan.

3. AUTO-SIGNIN ANÓNIMO:
   - En useAppAuthState, elimina signInAnonymously(auth) automático salvo que DEMO_AUTH_ENABLED sea true. Sin flag: user = null → App muestra Landing/Login.

4. MODO DEMO GATEADO Y VISIBLE:
   - loginAnonymously() y el botón "Acceso Demo" solo se renderizan si DEMO_AUTH_ENABLED. Con modo demo activo, banner persistente no descartable: "MODO DEMOSTRACIÓN — los datos no son reales."

5. GATEAR SEEDS:
   - seedDemoData solo se invoca con el flag activo.

VERIFICACIÓN Y ENTREGA:
- Verificación manual: build sin flag → visitante solo ve Login; build con flag → demo con banner visible.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S4-auth-hardening. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S5 (CI/CD Bloqueante & Desacople Server/Functions)
```text
Actúa como Senior DevSecOps Engineer (GitHub Actions) y TypeScript Build Engineer. 
Trabajas SOLO en la rama `sprint/IC360-S5-ci-hardening`. PROHIBIDO: Merge a main, firebase deploy. Depende de S0 y S3 mergeados.

CONTEXTO: server.ts importaba handleGeminiProxy desde ./functions/src/index → tsc incluyía functions/ en el programa de la raíz ignorando el exclude.

1. EXTRAER MÓDULO COMPARTIDO:
   - src/server/geminiProxyHandler.ts con la lógica compartida si server.ts necesita coexistir con functions/.
   - Si S3 concluyó que Functions es el único backend, retira de server.ts toda lógica redundante.
   - Alinea firebase-admin a la misma versión mayor en raíz y functions/package.json.
   - npx tsc --noEmit en la raíz → 0 errores.

2. PIPELINE ENDURECIDO (.github/workflows/ci.yml):
   - Job security: npm audit --audit-level=high + gitleaks.
   - Job rules-check: usa npm run test:rules y test:storage-rules del harness de S0 (bloqueante).
   - Job build: npm ci, lint, tsc --noEmit, build, test:unit.

VERIFICACIÓN Y ENTREGA:
- Provoca un fallo deliberado de lint en un commit de prueba dentro de la rama del sprint y confirma que el check falla.
- npx tsc --noEmit en verde.
- Abre PR a sprint/IC360-S5-ci-hardening. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S6 (Multi-tenant 13/13 & IDs Regulatorios Server-Side)
```text
Actúa como Principal Full Stack Architect y Firebase Backend Engineer. 
Trabajas SOLO en la rama `sprint/IC360-S6-multitenant-ids`. PROHIBIDO: Merge a main, firebase deploy, tocar firestore.rules o src/lib/norms/. Depende de S1 y S3 mergeados.

⚠️ REGLAS INQUEBRANTABLES:
- TODO dato de proyecto bajo /organizations/{orgId}/projects/{projId}/...
- CERO Math.random() para IDs oficiales (PTW, LOTO, AST, RASDA, WBS, MAT, tags).
- Los IDs oficiales se emiten por Cloud Function con Admin SDK, NUNCA por transacción del cliente sobre un counter.

1. CAPA REPOSITORIO (src/lib/repositories/):
   - Un módulo por dominio: tasksRepo, valuationsRepo, weldJointsRepo, fieldReportsRepo, documentsRepo, inventoryRepo, routesRepo, sihoPtwRepo, apusRepo, workersRepo.
   - Tipos de dominio explícitos en src/lib/repositories/types.ts (sin any).
   - Cada método de escritura exige orgId y projectId como parámetros obligatorios.

2. MIGRACIÓN DE CALL-SITES:
   - ClientPortalView, Valuations, FieldReports, LogisticsMap, QaQcWelding, Documents, Inventory, Expenses, SihoPtw.

3. IDs REGULATORIOS SERVER-SIDE (functions/src/regulatoryIds.ts):
   - Callable issueRegulatoryCode(orgId, projectId, series): (a) requireAuth; (b) valida rol autorizado; (c) runTransaction en admin SDK sobre /organizations/{orgId}/counters/{series}-{year}; (d) retorna código formato `${series}-${year}-${String(next).padStart(4,'0')}`; (e) registra emisión en audit log.
   - src/lib/documents/regulatoryId.ts (cliente): función requestRegulatoryCode() que llama la Callable, NUNCA genera el código localmente. Para trabajo offline, el borrador usa un tempId local (UUID) y solicita el código oficial al sincronizar.
   - Reemplaza los usos de Math.random() en: SihoPtw (PTS), LotoIsolation (LOCK/PTW), AstForm (AST), EnvironmentalManagement (RASDA), TaskModal (WBS), ProcurementInventory (MAT), InstrumentationControl (LOOP).

VERIFICACIÓN Y ENTREGA:
- rg "Math.random" src/pages src/components → cero resultados en contextos de generación de ID oficial.
- npm run test:rules sigue en verde.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S6-multitenant-ids. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S7 (Sanitización XSS & Error Boundaries)
```text
Actúa como Senior Frontend Security Engineer y React 19/TypeScript Developer. 
Trabajas SOLO en la rama `sprint/IC360-S7-xss-resilience`. PROHIBIDO: Merge a main, firebase deploy. Depende de S2 mergeado.

⚠️ REGLAS INQUEBRANTABLES:
- Ningún dangerouslySetInnerHTML sin DOMPurify antes.
- Ninguna simulación puede presentarse como funcionalidad real.

1. SANITIZACIÓN:
   - Instala dompurify y @types/dompurify.
   - IsometricViewer.tsx: aplica DOMPurify.sanitize(content, { USE_PROFILES: { svg: true } }) SIN svgFilters, prohíbe foreignObject y scripts. Rechaza >2MB.
   - DossierCompiler.tsx: sanitiza el HTML generado antes de dangerouslySetInnerHTML.

2. ELIMINAR SIMULACIONES:
   - FleetEquipment.tsx: elimina handleSimulateOCRScan. Sustituye por upload real a Storage + estado "Extracción OCR pendiente".
   - PlatformOwnerConsole.tsx: conecta tenants a /organizations y audit logs a /{org}/audit_logs reales. Métrica no implementada → badge "DEMO".

3. ERROR BOUNDARIES:
   - src/components/ErrorBoundary.tsx con fallback UI institucional. Envuelve cada ruta lazy() en App.tsx con su propio boundary.

VERIFICACIÓN Y ENTREGA:
- Prueba documentada: subir SVG con <script>alert(1)</script> → no se ejecuta ni se renderiza.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S7-xss-resilience. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S8 (Motor Normativo Modular ASME/API)
```text
Actúa como Senior TypeScript Engineer con prácticas de software de ingeniería verificable. 
Trabajas SOLO en la rama `sprint/IC360-S8-norm-engine-phase1`. PROHIBIDO: Merge a main, firebase deploy, cambiar fórmulas sin evidencia. Depende de S5.

1. INVENTARIO PRIMERO:
   - Lista en el PR qué archivos/funciones implementan B31G, API 570 y API 1163 actualmente.

2. EXTRAER CALCULADORAS (EngineeringTools.tsx → src/lib/norms/):
   - src/lib/norms/types.ts: interfaz NormCalculator<TInput, TResult> con { id, standard, edition, reference, validate(input), calculate(input) }.
   - src/lib/norms/b31g.ts, api570.ts, api1163.ts: funciones puras, sin dependencias de React, completamente tipadas.
   - Cada resultado incluye disclaimer: "Apoyo técnico sujeto a revisión/aprobación del ingeniero responsable."
   - EngineeringTools.tsx pasa a IMPORTAR estas funciones en vez de contener la lógica inline.

3. GOLDEN TESTS:
   - Un test por calculadora. El valor esperado debe provenir de un ejemplo publicado en la norma citada.

VERIFICACIÓN Y ENTREGA:
- npm run test:unit en verde.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S8-norm-engine-phase1. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S9 (Portal Cliente Seguro & Sello SHA-256)
```text
Actúa como Lead Security Engineer (Firebase) y Backend Engineer de trazabilidad documental. 
Trabajas SOLO en la rama `sprint/IC360-S9-portal-dossier`. PROHIBIDO: Merge a main, firebase deploy. Depende de S3 y S6.

1. MODELO DE PORTAL SEGURO (ClientPortalBuilder.tsx + Function):
   - Callable createClientPortal(orgId, projectId, config): genera token aleatorio de 32 bytes con crypto; guarda en Firestore SOLO el hash SHA-256 del token junto con expiresAt, revokedAt: null, publishedWidgets; retorna el token en texto plano UNA sola vez.

2. ACCESO PÚBLICO CONTROLADO (Function HTTPS getClientPortal):
   - Recibe portalId y token por query/body. Calcula hash del token recibido y lo compara con el hash guardado. Aplica rate limiting. Retorna únicamente los widgets marcados como publicados. Registra acceso server-side en /organizations/{orgId}/client_portal_access_logs.

3. SELLO DOCUMENTAL SERVER-SIDE (Callable sealDocument):
   - Modelo DocumentVerification: { documentId, orgId, projectId, version, sha256, status, issuedBy, issuedAt, storagePath }.
   - Function descarga bytes del PDF desde Storage, calcula SHA-256 server-side, y escribe en colección append-only.
   - Function de verificación por QR (HTTPS, pública): retorna { status, version, issuedAt } sin exponer contenido.
   - UI de estado: Borrador, Emitido, Aprobado, Reemplazado, Anulado.

VERIFICACIÓN Y ENTREGA:
- Prueba manual: URL de portal sin token → denegado; token válido → muestra widgets; tras revocar → denegado.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S9-portal-dossier. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S10 (Motor Offline Unificado DexieDB con Outbox)
```text
Actúa como Principal Offline-First Engineer (PWA) especializado en sistemas de cola idempotentes. 
Trabajas SOLO en la rama `sprint/IC360-S10-offline-unified`. PROHIBIDO: Merge a main, firebase deploy. Depende de S6.

1. CONSOLIDACIÓN:
   - src/lib/offline/ queda como única implementación: dexieDb.ts, syncEngine.ts, outbox.ts, conflictPolicy.ts. Migra call-sites y elimina offlineSync.ts u offlineStore.ts viejos.

2. IDENTIFICADORES DE OPERACIÓN (Idempotencia):
   - Cada operación en cola genera operationId = uuid v4 UNA sola vez al crearse localmente.
   - El backend (Function o repositorio) verifica en /idempotency_keys/{operationId} si ya fue procesado; si existe, retorna el resultado previo sin duplicar.

3. RESOLUCIÓN DE CONFLICTOS:
   - Fotos/evidencia: append-only. Reportes de campo no críticos: conflicto visible. PTW, QA/QC, valuaciones, aprobaciones: conflicto BLOQUEANTE.

4. UI SYNC CENTER & SERVICE WORKER:
   - UI que muestra operaciones pending/syncing/synced/failed/conflict. SW alineado con la estructura real de Dexie.

VERIFICACIÓN Y ENTREGA:
- Prueba documentada: encolar 3 reportes offline → reconectar → exactamente 3 documentos remotos.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S10-offline-unified. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S11 (Observabilidad & Redacción de PII)
```text
Actúa como Senior DevSecOps + Observability Engineer. 
Trabajas SOLO en la rama `sprint/IC360-S11-observability`. PROHIBIDO: Merge a main, firebase deploy. Depende de S5.

1. LOGGER SANITIZADO (src/lib/logger.ts):
   - Wrapper único de logging que redacta automáticamente: emails, UIDs completos, tokens, coordenadas GPS precisas. Reemplaza console.log/console.error dispersos en Auth, Functions y sync engine.

2. INTEGRACIÓN SENTRY & CLOUD FUNCTIONS:
   - VITE_SENTRY_DSN en .env.example. Configura scrub de PII por defecto y separación de entorno (dev/staging/prod).
   - Captura errores no controlados en Cloud Functions con logging estructurado.

VERIFICACIÓN Y ENTREGA:
- Prueba: forzar error intencional → confirmar que log/Sentry no contiene email completo ni token.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S11-observability. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S12 (Rendimiento, Code-Splitting & Auditoría de Dependencias)
```text
Actúa como Senior Performance + Supply Chain Security Engineer. 
Trabajas SOLO en la rama `sprint/IC360-S12-perf-dependencies`. PROHIBIDO: Merge a main, firebase deploy. Depende de S11.

1. AUDITORÍA PRIMERO:
   - Ejecuta npm audit --omit=dev y documenta cada vulnerabilidad Alta/Crítica. Solo si xlsx aparece confirmada, procede con la migración a exceljs en src/lib/excelExporter.ts.

2. PERFORMANCE (vite.config.ts):
   - build.rollupOptions.output.manualChunks separando por dominio: chunk '3d', 'maps', 'charts', 'pdf', 'excel'.

VERIFICACIÓN Y ENTREGA:
- npm audit --omit=dev → adjunta salida completa.
- npx tsc --noEmit y npm run test:unit en verde.
- Abre PR a sprint/IC360-S12-perf-dependencies. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S13 (Piloto PROINTECA End-to-End: Propanoducto Cardón-Amuay)
```text
Actúa como QA Lead y Product Engineer para software industrial. 
Trabajas SOLO en la rama `sprint/IC360-S13-pilot-prointeca`. PROHIBIDO: Merge a main, firebase deploy, usar datos reales de producción. Depende de S6, S8, S9 y S10 mergeados.

OBJETIVO DEL PILOTO: Proyecto → WBS/tarea → PTW/ART → reporte de campo offline → fotos/GPS/evidencia → QA/QC/NDT → avance físico → valuación ROE → dossier → portal cliente.

DATOS DEL PILOTO (Tenant "prointeca-demo"):
- Ducto 6" SCH 40, 17.0 km, MAOP 2126 psi. 3 defectos ILI sintéticos para ejercitar B31G/API 570 (S8). Roles reales: gerente, supervisor, inspector, campo, cliente.

1. SEED SEGURO:
   - scripts/seed-prointeca-pilot.ts puebla el tenant SOLO si process.env.NODE_ENV !== 'production' y contra el emulador. Usa la Function assignMembership de S1 para crear usuarios.

2. CHECKLIST OPERATIVO Y TESTS SMOKE:
   - docs/pilot/PILOT_ACCEPTANCE.md documenta qué hace cada rol y qué evidencia deja.
   - Smoke tests que recorran todo el ciclo. Confirma que el PTW usó el código regulatorio emitido por Function (S6).

VERIFICACIÓN Y ENTREGA:
- Evidencia del flujo completo.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S13-pilot-prointeca. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT DE AUDITORÍA Y CERTIFICACIÓN FINAL — SPRINT S14 (Para Modelos Auditores)
```text
Actúa como Auditor Principal de Seguridad, DevSecOps y Arquitectura de Software Enterprise.

OBJETIVO: Re-auditar el HEAD de la rama `main` en GitHub tras los Sprints S0 a S13 y emitir un dictamen honesto y fundamentado.

1. PRUEBAS DE PENETRACIÓN CONTROLADA:
   - Zero-Trust Firestore: confirma catch-all if false, ausencia de wildcards de escritura, reglas explícitas.
   - RBAC: confirma que el rol se lee de getIdTokenResult().claims, que membership es backend-only y que el <select> no existe en build de producción.
   - Backend: confirma requireAuth + rate limiting persistente + CORS sin wildcard en Functions.
   - XSS: confirma DOMPurify en todo dangerouslySetInnerHTML.
   - Portal: confirma que el token se compara por hash y que Firestore permanece privado.

2. INTEGRIDAD DE DATOS:
   - Multi-tenant 13/13, IDs regulatorios emitidos por Function con Admin SDK, motor offline Dexie con idempotencia por operationId, y sello documental SHA-256 server-side con QR.

3. CALIDAD Y SUPPLY CHAIN:
   - npm audit --omit=dev sin vulnerabilidades críticas; npx tsc --noEmit en 0 errores; npm run test:all en verde con aserciones reales.

4. DICTAMEN FINAL (Rúbrica Enterprise 1-100):
   - Asigna calificación final en Seguridad (35%), Arquitectura (20%), Mantenibilidad (15%), Cobertura (15%) y Rendimiento (15%).
   - Emite dictamen: APTO PARA PILOTO PROINTECA, APTO PARA PRODUCCIÓN LIMITADA MULTI-TENANT, o RECHAZADO POR RIESGO RESIDUAL.
```

---

© 2026 **Industrial Control 360**. Todos los derechos reservados.
