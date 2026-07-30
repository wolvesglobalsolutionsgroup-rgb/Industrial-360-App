# 🗺️ PLAN MAESTRO UNIFICADO DE SPRINTS — RUTA A 100/100 (S1 → S13)
## Industrial Control 360 — Hoja de Ruta de Cierre de Brechas P0 → P3

**Código del Documento:** `DOC-GOV-2026-010` (v3 Completa)  
**Ubicación:** `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`  
**Fecha:** 29 de Julio de 2026  
**Panel de Auditoría:** ChatGPT 5.6 Terra Thinking + Claude 5 Sonnet Thinking + Qwen 3.8 Max (MCP GitHub)  
**Director de Operaciones & Síntesis:** Antigravity (DeepMind)  
**Implementador Exclusivo:** Google AI Studio (GAIS) via Pull Requests (NUNCA push directo a `main`)  

---

## 📐 0. REGLAS TRANSVERSALES DE EJECUCIÓN (APLICA A TODOS LOS SPRINTS)

```text
⚠️ REGLAS INQUEBRANTABLES (Aplica a cada prompt de GAIS):
1. Eres GAIS, el ÚNICO desarrollador autorizado a escribir código en el repo.
2. Trabajas SOLO en ramas de feature: sprint/IC360-SXX-<nombre>. PROHIBIDO push directo a main.
3. PROHIBIDO: firebase deploy no autorizado, rotar secretos o cambiar fórmulas en src/lib/norms/.
4. Aislamiento Multi-Tenant Estricto: Toda entidad vive bajo /organizations/{orgId}/projects/{projId}/...
5. Ninguna clave o secreto se incluye en src/ ni en el bundle de cliente.
6. Al terminar cada tarea, responde el Auto-Checklist Obligatorio de 7 Preguntas de Claude y abre PR sin mergear.
```

### ❓ Auto-Checklist Obligatorio de Cierre de Claude (7 Preguntas al final de cada Sprint):
```text
1. ¿Qué archivos se modificaron y por qué?
2. ¿npx tsc --noEmit pasa 100% con 0 errores?
3. ¿Se probó el estado vacío y el estado de error de cada función tocada?
4. ¿Algún dato mostrado sigue siendo Math.random(), array hardcodeado o simulación?
5. ¿Se expone alguna clave o secreto nuevo en src/ o en el bundle de cliente?
6. ¿Los cambios respetan /organizations/{orgId}/projects/{projId}/... sin excepción?
7. ¿Qué quedó explícitamente FUERA de alcance de este sprint y por qué?
```

---

## 📊 1. MAPA COMPLETO DE SPRINTS (S1 → S13)

| Sprint | Nombre | Prioridad | Cierra Brecha | Estado |
|---|---|---|---|---|
| **S1** | Zero-Trust: Custom Claims en Backend + Refresco Token + `firestore.rules` | P0 | Base de datos pública (`signedIn() { return true; }`) | 🟡 Siguiente |
| **S2** | RBAC Real en Cliente + Redirección de Rutas Alias | P0 | Eliminación del `<select>` superadmin y `localStorage` | ⬜ Pendiente |
| **S3** | Endpoints `/api/*` Auth + Rate-Limit + CORS Estricto + `storage.rules` | P0 | Abuso de cuota Gemini/Resend y aislamiento de fotos | ⬜ Pendiente |
| **S4** | Autenticación Endurecida (Sin Cuentas Automáticas ni Demo Silencioso) | P0 | Requiere registro explícito por administrador | ⬜ Pendiente |
| **S5** | CI/CD Bloqueante + Desacople de `server.ts` / `functions/` + Secret Scan | P1 | Reparación de tipos `tsc` en `server.ts` y pipeline bloqueante | ⬜ Pendiente |
| **S6** | Migración Multi-Tenant Completa (13/13) + Repositorios + IDs Secuenciales | P1 | Adiós `Math.random()`, contadores atómicos `runTransaction` | ⬜ Pendiente |
| **S7** | Sanitización XSS (DOMPurify) + Error Boundaries + Eliminación Mocks | P1 | Sanitización SVG/HTML e higienización de `PlatformOwnerConsole` | ⬜ Pendiente |
| **S8** | Motor Normativo Modular (ASME B31.3/B31G/API 570/API 1163) + Golden Tests | P1 | Calculadoras puras tipadas y testeables | ⬜ Pendiente |
| **S9** | **PILOTO PROINTECA END-TO-END (Propanoducto Cardón-Amuay)** | P0 (Comercial) | **Valor Tangible YA:** Flujo completo WBS→PTW→Campo→QA/QC→Dossier | ⬜ Pendiente |
| **S10**| Portal Cliente Seguro (Token Opaco/Revocable) + Sello Server-Side SHA-256 | P1 | Dossier inviolable con verificación QR en tiempo real | ⬜ Pendiente |
| **S11**| Motor Offline Unificado en `DexieDB` con Outbox & Deduplicación | P1 | Cero duplicados en sync y resolución de conflictos | ⬜ Pendiente |
| **S12**| Observabilidad (Sentry) + Rendimiento (Code-Splitting) + Migración `exceljs` | P2 | Sustitución de `xlsx` vulnerable y monitoreo en producción | ⬜ Pendiente |
| **S13**| Auditoría Final y Re-Scoring de Producción | — | Verificación de cierre total (Puntaje Objetivo: ≥93-95/100) | ⬜ Pendiente |

---

# 🚀 2. PROMPTS LISTOS PARA COPIAR Y PEGAR EN GOOGLE AI STUDIO (S1 → S12)

---

### 📋 PROMPT GAIS — SPRINT S1 (Zero-Trust & Custom Claims)
```text
Actúa como Lead Firebase Security Engineer. Trabajas SOLO en la rama `sprint/IC360-S1-zero-trust`. 
PROHIBIDO: Push a main, firebase deploy no autorizado, borrar datos o tocar src/lib/norms/.

CONTEXTO VERIFICADO (Auditoría Qwen #20 sobre HEAD 11c6bb4):
- firestore.rules tiene `signedIn() { return true; }` → DB 100% pública.
- securityRules.test.ts tiene 4 casos correctos PERO cada uno arranca con `if (!testEnv) return;` → pasan en silencio.

⚠️ REGLAS INQUEBRANTABLES:
1. El fallback de TODA función helper es DENEGAR (false), nunca permitir.
2. Catch-all final: match /{document=**} { allow read, write: if false; }
3. NO modifiques las aserciones de securityRules.test.ts (ya están bien). Tu trabajo es hacer que pasen DE VERDAD contra reglas reales.
4. NO hagas firebase deploy. Solo commitea.

TAREA 1 — CUSTOM CLAIMS REALES (PRIMERO PARA EVITAR BLACKOUT):
- functions/src/index.ts: callable `ensureUserClaims` que (a) exige context.auth; (b) lee /users/{uid} del PROPIO usuario; (c) fija claims {orgId, role} desde ese documento SI es válido, o rol mínimo 'campo' + su orgId; (d) NUNCA acepta role/orgId desde el payload del cliente; (e) llama revokeRefreshTokens(uid).
- src/firebase.ts: tras login exitoso invocar ensureUserClaims y await user.getIdTokenResult(true) ANTES de redirigir al dashboard.

TAREA 2 — REESCRIBIR firestore.rules (Zero-Trust con Custom Claims):
- Helpers: isAuthenticated() (request.auth != null), tokenOrgId() (request.auth.token.get('orgId','')), tokenRole(), belongsToOrg(org), hasAnyRole(roles).
- /users/{userId}: solo el dueño o superadmin lee; el usuario NUNCA escribe role/orgId/approvedBy/createdBy.
- /organizations/{org}/** : read si belongsToOrg; write si belongsToOrg + hasAnyRole. orgId y projectId del payload DEBEN coincidir con la ruta.
- CollectionGroups (valuations, siho_ptw, weld_joints, tasks, field_reports, documents, inventory): validar resource.data.orgId == tokenOrgId en lectura y request.resource.data.orgId == tokenOrgId en escritura.
- CERO wildcards permisivos. CERO if true.

TAREA 3 — MATAR EL TEST SILENCIOSO:
- En securityRules.test.ts reemplaza cada `if (!testEnv) return;` por un beforeAll que haga `throw new Error('Firestore emulator no disponible — el test no puede validar nada sin él')` y aborte la suite completa.
- Añade 2 casos nuevos: (a) rol 'campo' NO puede borrar documentos; (b) usuario de otra org NO puede escribir en counters ajenos.

VERIFICACIÓN Y ENTREGA:
- firebase emulators:exec --only firestore "npm test" → pega la salida COMPLETA.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S1-zero-trust describiendo antes/después de cada regla. NO merges. Responde el Auto-Checklist de 7 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S2 (RBAC Real en Cliente)
```text
Actúa como Senior React 19 / TypeScript Security Engineer. Trabajas SOLO en la rama `sprint/IC360-S2-rbac-cliente`. 
PROHIBIDO: Merge a main, firebase deploy, tocar firestore.rules (cerrado en S1).
Depende de S1 mergeado (claims ya se emiten server-side).

⚠️ REGLAS INQUEBRANTABLES:
- El rol de usuario JAMÁS vuelve a escribirse en localStorage como fuente de verdad.
- El token JWT verificado es la ÚNICA fuente de verdad del rol.

1. NUEVO HOOK src/hooks/useAuthClaims.ts:
   - Usa auth.onIdTokenChanged + user.getIdTokenResult() para exponer { role, orgId, loading } leídos del JWT verificado.
   - NO leer rol desde Firestore /users/{uid} ni desde localStorage.

2. REFACTOR ProjectContext.tsx:
   - Elimina ic360_userRole de localStorage (lectura y escritura) y el estado local de rol. userRole deriva de useAuthClaims(). Elimina setUserRole del contexto (nadie cambia su rol desde la UI).

3. REFACTOR ProtectedRoute.tsx:
   - Usa useAuthClaims() en lugar de useProject().userRole.
   - ELIMINA por completo el bloque del <select> "¿Entorno de Pruebas / Demo?" que permite cambiar de rol. Si quieres conservar un selector de desarrollo, envuélvelo en {import.meta.env.DEV && (...)} para que desaparezca del bundle de producción.
   - Muestra pantalla de acceso denegado con el rol REAL del token.

4. RUTAS SIN FUGAS (src/App.tsx):
   - Para cada módulo sensible deja UNA sola ruta protegida y convierte los alias en redirecciones: /master-console → /platform-owner-console, /loto → /loto-isolation, /apu → /apu-estimation, /instrumentation → /instrumentation-control, /civil → /civil-engineering.
   - PlatformOwnerConsole queda excluido para cualquier rol distinto de superadmin.

VERIFICACIÓN Y ENTREGA:
- npm run build → busca en dist/ el texto "Cambiar a:" → NO debe aparecer.
- npx tsc --noEmit sin errores.
- Prueba manual documentada: sin claims → acceso denegado; con rol correcto → renderiza.
- Abre PR a sprint/IC360-S2-rbac-cliente. NO merges. Responde el Auto-Checklist de 7 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S3 (Endpoints API, Rate Limit & Storage Rules)
```text
Actúa como Senior Backend Engineer (Node/Express + Firebase Admin) y Cloud Security Engineer. 
Trabajas SOLO en la rama `sprint/IC360-S3-api-storage`.
PROHIBIDO: Merge a main, firebase deploy, rotar secretos, imprimir valores de API keys.

⚠️ REGLAS INQUEBRANTABLES:
- GEMINI_API_KEY y RESEND_API_KEY solo en servidor (process.env).
- Sin fallback CORS wildcard (*): solo orígenes explícitos.
- El proxy de Gemini NUNCA devuelve "datos de contingencia" disfrazados de respuesta de IA: los errores se propagan con código y mensaje honestos.

1. MIDDLEWARE requireAuth (server.ts + functions/src/index.ts):
   - Extrae Authorization: Bearer <idToken>, verifica con admin.auth().verifyIdToken(). 401 si falta/inválido; 403 si no hay claim orgId.
   - Inicializa firebase-admin en server.ts (credenciales de entorno).

2. RATE LIMITING:
   - Añade express-rate-limit. /api/callGeminiProxy: máx 20 req/min por uid (fallback IP). /api/send-email: máx 10 req/min por uid. 429 con { error, retryAfterSeconds }.

3. CORS ESTRICTO:
   - Elimina la rama `else if (!origin) { '*' }`. Orígenes vía lista blanca explícita (producción + localhost solo si NODE_ENV !== 'production'). Añade Vary: Origin.

4. VALIDACIÓN DE PAYLOAD:
   - /api/callGeminiProxy: exige prompt (string ≤30.000 chars) o contents; rechaza lo demás con 400.
   - /api/send-email: valida formato de to, subject ≤200 chars, html ≤100KB. Si RESEND_API_KEY no está configurada → 503 con error honesto (NUNCA { success: true, simulated: true }).

5. ENDPOINT DUPLICADO: elimina /api/gemini/proxy; deja solo /api/callGeminiProxy. Verifica con búsqueda global que ningún cliente llama al duplicado.

6. CLIENTE CON TOKEN:
   - src/lib/geminiProxy.ts y emailService.ts: obtén ID token con auth.currentUser?.getIdToken() y envíalo en Authorization. Sin sesión → error visible.

7. STORAGE RULES (storage.rules, nuevo):
   - Denegación por defecto: match /{allPaths=**} { allow read, write: if false; }
   - Ruta /organizations/{orgId}/{allPaths=**}: read/write solo si request.auth != null y (request.auth.token.orgId == orgId o superadmin).
   - Límite request.resource.size < 20MB y validación de contentType.
   - Lectura pública SOLO para /organizations/{orgId}/brandkit/... (logos PDF/portal).
   - Registra "storage": { "rules": "storage.rules" } en firebase.json.

VERIFICACIÓN Y ENTREGA:
- Prueba manual documentada: sin token → 401; con token → 200; ráfaga 25 → 429.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S3-api-storage. NO merges. Responde el Auto-Checklist de 7 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S4 (Autenticación Endurecida sin Demo Silencioso)
```text
Actúa como Senior React 19 / TypeScript Security Engineer. Trabajas SOLO en la rama `sprint/IC360-S4-auth-hardening`. 
PROHIBIDO: Merge a main, firebase deploy. Depende de S2 mergeado.

⚠️ REGLAS INQUEBRANTABLES:
- El comportamiento por defecto (sin variables de entorno) es el SEGURO: ningún acceso anónimo ni demo.
- No elimines el modo demo: gatéalo tras flag explícito para desarrollo.

1. FLAG DE ENTORNO:
   - Añade a .env.example: VITE_ENABLE_DEMO_AUTH= con comentario: "SOLO desarrollo/demos. En producción debe estar ausente o en false."
   - Crea src/config.ts exportando const DEMO_AUTH_ENABLED = import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true'.

2. loginWithEmail (src/firebase.ts):
   - Elimina la rama que crea la cuenta ante auth/user-not-found. Lanza: "Cuenta no registrada. Contacte al administrador de su organización."
   - Elimina el fallback silencioso a usuario local ante errores de API key/dominio.

3. AUTO-SIGNIN ANÓNIMO:
   - En useAppAuthState elimina signInAnonymously(auth) automático salvo que DEMO_AUTH_ENABLED sea true. Sin flag: user = null → App muestra Landing/Login.

4. MODO DEMO GATEADO:
   - loginAnonymously() y el botón "Acceso Demo" de Login.tsx solo se renderizan/ejecutan si DEMO_AUTH_ENABLED. Con modo demo activo muestra banner persistente: "MODO DEMOSTRACIÓN — los datos no son reales".

5. GATEAR SEEDS:
   - seedDemoData (ProjectContext.tsx) solo puede invocarse con el flag activo. Elimina el auto-seed silencioso en producción.

VERIFICACIÓN Y ENTREGA:
- Verificación manual: sin flag → visitante solo ve Login; con flag → demo con banner.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S4-auth-hardening. NO merges. Responde el Auto-Checklist de 7 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S5 (CI/CD Bloqueante & Desacople de Server/Functions)
```text
Actúa como Senior DevSecOps Engineer (GitHub Actions) y TypeScript Build Engineer. 
Trabajas SOLO en la rama `sprint/IC360-S5-ci-hardening`. PROHIBIDO: Merge a main, firebase deploy.

CONTEXTO (Auditoría Qwen #9): server.ts importa handleGeminiProxy desde ./functions/src/index → TypeScript mete functions/ en el programa de la raíz ignorando el exclude → 14 errores de tsc. Hay que separarlo.

⚠️ REGLAS INQUEBRANTABLES:
- Ningún secreto en el YAML: todo vía GitHub Secrets.
- El deploy de reglas SOLO ocurre desde CI en main con approval manual.

1. EXTRAER MÓDULO COMPARTIDO:
   - Crea src/server/geminiProxyHandler.ts con la lógica de handleGeminiProxy.
   - functions/src/index.ts y server.ts importan desde ese módulo compartido.
   - functions/ queda con solo lo que se despliega como Cloud Function.
   - Alinea firebase-admin a la misma major en raíz y functions/package.json.
   - Confirma: npx tsc --noEmit en la raíz → 0 errores.

2. PIPELINE ENDURECIDO (.github/workflows/ci.yml):
   - Job security: npm audit --audit-level=high + escaneo de secretos con gitleaks.
   - Job rules-check: despliega reglas al emulador y corre securityRules.test.ts (bloqueante).
   - Job build: npm ci, lint, tsc --noEmit, build, tests unitarios.

VERIFICACIÓN Y ENTREGA:
- Provoca un fallo deliberado de lint en un commit de prueba y confirma que el check falla.
- npx tsc --noEmit en verde.
- Abre PR a sprint/IC360-S5-ci-hardening. NO merges. Responde el Auto-Checklist de 7 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S6 (Migración Multi-Tenant 13/13 & IDs Secuenciales)
```text
Actúa como Principal Full Stack Architect y Firebase Transaction Engineer. 
Trabajas SOLO en la rama `sprint/IC360-S6-multitenant-ids`. PROHIBIDO: Merge a main, firebase deploy, tocar firestore.rules o src/lib/norms/.

⚠️ REGLAS INQUEBRANTABLES:
- TODO dato de proyecto bajo /organizations/{orgId}/projects/{projId}/...
- Todo documento escrito incluye orgId y projectId en el payload.
- Cero Math.random() para IDs oficiales (PTW, LOTO, AST, RASDA, WBS, MAT, tags).

1. CAPA REPOSITORIO (src/lib/repositories/):
   - Un módulo por dominio (tasksRepo, valuationsRepo, weldJointsRepo, fieldReportsRepo, documentsRepo, inventoryRepo, routesRepo, sihoPtwRepo, apusRepo, workersRepo).
   - Tipos de dominio explícitos en src/lib/repositories/types.ts (sin any).

2. MIGRACIÓN DE CALL-SITES:
   - ClientPortalView, Valuations, FieldReports, LogisticsMap, QaQcWelding, Documents, Inventory, Expenses, SihoPtw.

3. IDs SECUENCIALES (src/lib/documents/sequentialId.ts):
   - nextSequentialId(orgId, series): Promise<string> usando runTransaction sobre doc(db,'organizations',orgId,'counters',`${series}-${year}`).
   - Formato: `${series}-${year}-${String(next).padStart(4,'0')}`.
   - Reemplaza los 10 usos de Math.random(): SihoPtw (PTS), LotoIsolation (LOCK/PTW), AstForm (AST), EnvironmentalManagement (RASDA), TaskModal (WBS), ProcurementInventory (MAT), InstrumentationControl (LOOP).

VERIFICACIÓN Y ENTREGA:
- rg "Math.random" src/pages src/components → cero en IDs oficiales.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S6-multitenant-ids. NO merges. Responde el Auto-Checklist de 7 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S7 (Sanitización XSS & Error Boundaries)
```text
Actúa como Senior Frontend Security Engineer y React 19 / TypeScript Developer. 
Trabajas SOLO en la rama `sprint/IC360-S7-xss-resilience`. PROHIBIDO: Merge a main, firebase deploy.

⚠️ REGLAS INQUEBRANTABLES:
- Ningún dangerouslySetInnerHTML sin DOMPurify antes.
- Ninguna simulación puede presentarse como funcionalidad real (AGENTS.md §1).

1. SANITIZACIÓN:
   - Instala dompurify y @types/dompurify.
   - IsometricViewer.tsx: aplica DOMPurify.sanitize(content, { USE_PROFILES: { svg: true, svgFilters: true } }). Rechaza >2MB.
   - DossierCompiler.tsx: sanitiza el HTML generado antes de dangerouslySetInnerHTML.

2. ELIMINAR SIMULACIONES:
   - FleetEquipment.tsx: elimina handleSimulateOCRScan. Sustitúyelo por upload real a Storage + estado "Extracción OCR pendiente".
   - PlatformOwnerConsole.tsx: conecta tenants a /organizations y audit logs a /{org}/audit_logs reales. Métrica no implementada → badge "DEMO".

3. ERROR BOUNDARIES:
   - Crea src/components/ErrorBoundary.tsx con fallback UI institucional. Envuelve cada ruta lazy() en App.tsx.

VERIFICACIÓN Y ENTREGA:
- Prueba documentada: subir SVG con <script>alert(1)</script> → no ejecuta.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S7-xss-resilience. NO merges. Responde el Auto-Checklist de 7 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S8 (Motor Normativo Modular ASME/API)
```text
Actúa como Senior TypeScript Engineer con prácticas de software de ingeniería verificable. 
Trabajas SOLO en la rama `sprint/IC360-S8-norm-engine`. PROHIBIDO: Merge a main, firebase deploy, cambiar fórmulas sin evidencia.

1. CONSOLIDAR JERARQUÍA:
   - Elimina duplicados en raíz dejando UNA jerarquía: src/lib/norms/{api,asme,pdvsa,core}.
   - npm test en verde tras la consolidación.

2. EXTRAER CALCULADORAS (EngineeringTools.tsx → src/lib/norms/):
   - B31G, API 570, API 1163 como calculadoras puras tipadas con interfaz NormCalculator: { id, standard, edition, reference, validate(), calculate() }.
   - Incluye disclaimer: "Apoyo técnico sujeto a revisión/aprobación del ingeniero responsable".

3. GOLDEN TESTS:
   - Un test por calculadora fijando el resultado esperado contra casos de referencia por norma citada.

VERIFICACIÓN Y ENTREGA:
- npm test en verde.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S8-norm-engine. NO merges. Responde el Auto-Checklist de 7 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S9 (Piloto PROINTECA End-to-End: Propanoducto Cardón-Amuay)
```text
Actúa como QA Lead y Product Engineer para software industrial. 
Trabajas SOLO en la rama `sprint/IC360-S9-pilot-prointeca`. PROHIBIDO: Merge a main, firebase deploy, usar datos reales en producción.

OBJETIVO DEL PILOTO (Flujo del contratista PROINTECA):
Proyecto → WBS/tarea → PTW/ART → reporte de campo offline → fotos/GPS/evidencia → QA/QC/NDT → avance físico → valuación ROE → dossier.

DATOS DEL PILOTO (Tenant prointeca, proyecto Propanoducto Cardón-Amuay):
- Ducto 6" SCH 40, 17.0 km, MAOP 2126 psi.
- 3 defectos ILI para alimentar el motor B31G/API 570.
- Roles reales: gerente, supervisor, inspector, campo, cliente.

1. SEED SEGURO:
   - Crea scripts/seed-prointeca-pilot.ts que puebla el tenant prointeca SOLO en entorno local/emulador (NUNCA producción).

2. CHECKLIST OPERATIVO Y TESTS SMOKE:
   - Documenta en docs/pilot/PILOT_ACCEPTANCE.md qué hace cada rol y qué evidencia deja.
   - Tests que recorran: Proyecto → Tarea → PTW → Field Report → QA/QC → Valuación → Dossier.

VERIFICACIÓN Y ENTREGA:
- Evidencia de prueba del flujo completo.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S9-pilot-prointeca. NO merges. Responde el Auto-Checklist de 7 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S10 (Portal Cliente Seguro & Sello Server-Side SHA-256)
```text
Actúa como Lead Security Engineer (Firebase) y Backend Engineer de trazabilidad documental. 
Trabajas SOLO en la rama `sprint/IC360-S10-portal-dossier`. PROHIBIDO: Merge a main, firebase deploy.

1. MODELO DE PORTAL SEGURO (ClientPortalBuilder.tsx):
   - Al crear portal escribe en /organizations/{orgId}/client_portals/{portalId} con: accessToken (crypto.randomUUID()), accessEnabled: true, expiresAt, revokedAt: null.
   - URL pública: ${APP_URL}/portal/{portalId}?k={accessToken}.

2. LECTURA PÚBLICA CONTROLADA (ClientPortalView.tsx):
   - Token inválido/expirado/revocado → "Acceso no válido o revocado". Access log en /organizations/{orgId}/client_portal_access_logs.

3. HASH SERVER-SIDE (Cloud Function sealDocument):
   - Modelo DocumentVerification: { documentId, orgId, projectId, version, sha256, status, issuedBy, issuedAt, storagePath }.
   - Callable autenticada que calcula SHA-256 server-side sobre los bytes del PDF y registra en log append-only.
   - Endpoint de verificación por QR: respuesta mínima. UI de estado: Borrador, Emitido, Aprobado, Reemplazado, Anulado.

VERIFICACIÓN Y ENTREGA:
- Prueba manual: URL sin k → denegado; con k válido → portal; tras revocar → denegado.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S10-portal-dossier. NO merges. Responde el Auto-Checklist de 7 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S11 (Motor Offline Unificado DexieDB con Outbox)
```text
Actúa como Principal Offline-First Engineer (PWA) y Concurrencia Transaccional. 
Trabajas SOLO en la rama `sprint/IC360-S11-offline-unified`. PROHIBIDO: Merge a main, firebase deploy.

1. CONSOLIDACIÓN:
   - src/lib/offline/ queda como única implementación: dexieDb.ts, syncEngine.ts, outbox.ts.
   - offlineSync.ts y offlineStore.ts: migra sus call-sites y elimínalos.

2. DEDUPLICACIÓN Y CONFLICTOS:
   - Cada operación lleva tempId determinístico (uuid v4).
   - syncEngine: consulta si existe documento con ese tempId; si existe → marca sincronizada sin duplicar.
   - Conflictos en PTW/QA/QC/valuaciones = conflicto BLOQUEANTE.
   - Reintentos con backoff exponencial.

3. SERVICE WORKER:
   - Alinea public/sw.js con la DB Dexie real.

VERIFICACIÓN Y ENTREGA:
- Prueba documentada: encolar 3 reportes offline → reconectar → 3 documentos sin duplicar.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S11-offline-unified. NO merges. Responde el Auto-Checklist de 7 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S12 (Observabilidad, Code-Splitting & ExcelJS)
```text
Actúa como Senior DevSecOps + Performance + DX Engineer. 
Trabajas SOLO en la rama `sprint/IC360-S12-observability-perf`. PROHIBIDO: Merge a main, firebase deploy.

1. MIGRACIÓN EXCELJS:
   - Migra xlsx → exceljs en src/lib/excelExporter.ts y todo import. Conserva hojas múltiples, formatos y anchos.
   - vite → última 6.x parcheada.

2. LOGGER Y SENTRY:
   - Crea src/lib/logger.ts (sanitiza emails/UIDs, sin PII).
   - Integra Sentry con VITE_SENTRY_DSN en .env.example.

3. PERFORMANCE (vite.config.ts):
   - build.rollupOptions.output.manualChunks separando: 3d, maps, charts, pdf, excel.

VERIFICACIÓN Y ENTREGA:
- npm audit --omit=dev → 0 críticas/0 altas.
- npx tsc --noEmit y tests en verde.
- Abre PR a sprint/IC360-S12-observability-perf. NO merges. Responde el Auto-Checklist de 7 preguntas.
```

---

### 📋 PROMPT DE AUDITORÍA Y CERTIFICACIÓN FINAL — SPRINT S13 (Para Modelos Auditores)
```text
Actúa como Auditor Principal de Seguridad, DevSecOps y Arquitectura de Software Enterprise.

OBJETIVO: Realizar la Re-Auditoría Final y Certificación de Producción de la plataforma Industrial Control 360 (IC360) sobre el HEAD de la rama `main` en GitHub, evaluando la resolución total de los hallazgos identificados en las auditorías de origen (ChatGPT 5.6, Claude 5, Kimi K3 y Qwen 3.8).

1. AUDITORÍA DE SEGURIDAD Y EXPLOTACIÓN CONTROLADA (Pruebas de Penetración):
   - Prueba A (Zero-Trust Firestore): Verifica firestore.rules. ¿El catch-all final es `allow read, write: if false;`? ¿Se exige `belongsToOrg(orgId)` en todas las subcolecciones? ¿Existen wildcards o `if true` permisivos?
   - Prueba B (Escalación RBAC UI): Revisa ProtectedRoute.tsx y ProjectContext.tsx. ¿El rol de usuario se lee estrictamente del JWT token verificado (`getIdTokenResult().claims.role`)? ¿El `<select>` de cambio de rol desapareció de producción?
   - Prueba C (Servidor y API Proxies): Revisa server.ts y functions/src/index.ts. ¿Los endpoints `/api/callGeminiProxy` y `/api/send-email` cuentan con middleware `requireAuth`, validación de `orgId` y rate-limiting `express-rate-limit`? ¿Se eliminó cualquier fallback CORS `*`?
   - Prueba D (Sanitización XSS): Revisa IsometricViewer.tsx y DossierCompiler.tsx. ¿Todo SVG u HTML inyectado pasa obligatoriamente por `DOMPurify.sanitize()`?

2. VERIFICACIÓN DE INTEGRIDAD DE DATOS Y OPERACIÓN:
   - Cobertura Multi-Tenant (13/13 pantallas): ¿Toda consulta e inclusión de datos utiliza la jerarquía `/organizations/{orgId}/projects/{projId}/...`?
   - IDs Secuenciales: ¿Cero `Math.random()` en códigos oficiales de PTW, ART, LOTO, RASDA, MAT y WBS? ¿Los correlativos son atómicos vía `runTransaction`?
   - Motor Offline Outbox: ¿DexieDB previene la duplicación de registros al reconectar mediante `tempId` determinístico?
   - Trazabilidad Documental: ¿El sello de inmutabilidad del Dossier (Hash SHA-256) se calcula server-side en Cloud Functions con registro append-only y código QR funcional?

3. AUDITORÍA DE CALIDAD Y SUMINISTRO (Supply Chain):
   - Dependencias: Ejecuta `npm audit --omit=dev`. ¿Existen vulnerabilidades de severidad Alta o Crítica (incluyendo `xlsx`)?
   - Salud del Compilador: Ejecuta `npx tsc --noEmit`. ¿La salida arroja 0 errores de tipo?
   - Cobertura de Pruebas: Ejecuta `npm test`. ¿Los tests de reglas y de normas de ingeniería pasan con aserciones reales (sin `if (!testEnv) return;`)?

4. DICTAMEN DE RE-SCORING FINAL (Rúbrica Enterprise):
   - Asigna la calificación final por categoría (1-100):
     • Seguridad y DevSecOps (Peso 35%)
     • Arquitectura y Multi-Tenancy (Peso 20%)
     • Mantenibilidad y DX (Peso 15%)
     • Cobertura de Pruebas y Calidad (Peso 15%)
     • Rendimiento y Bundle (Peso 15%)
   - Emite el Dictamen Final: `APTO PARA PRODUCCIÓN INDUSTRIAL / PILOTO PROINTECA` o `RECHAZADO POR RIESGO RESIDUAL`.
```

---

© 2026 **Industrial Control 360**. Todos los derechos reservados.
