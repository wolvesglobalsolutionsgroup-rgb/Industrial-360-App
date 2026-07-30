# 🗺️ PLAN MAESTRO CORREGIDO DE SPRINTS — RUTA A PRODUCCIÓN VERIFICABLE (S0 → S14)
## Industrial Control 360 — Ejecución con Google AI Studio (GAIS)

**Código del Documento:** `DOC-GOV-2026-011` (v5.1 — Completo S0 a S14)  
**Ubicación:** `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`  
**Fecha:** 30 de Julio de 2026  
**HEAD de Referencia:** `main @ 932643f`  
**Panel de Auditoría:** ChatGPT 5.6 Terra + Claude 5 Sonnet + Qwen 3.8 Max (MCP GitHub Real-Time)  
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

## 📊 1. MAPA DE SPRINTS Y ESTADO DE EJECUCIÓN (S0 → S14)

| Sprint | Nombre | Prioridad | Depende de | Estado Actual |
|---|---|---|---|---|
| **S0** | Fundación de pruebas: Emulator real + scripts CI mínimos | P0 | — | ✅ **COMPLETADO POR GAIS** (`sprint/IC360-S0-test-foundation`) |
| **S1** | Zero-Trust: Membership admin + Custom Claims + `firestore.rules` (19 colecciones) | P0 | S0 | 🟡 **LISTO PARA GAIS (PARCHEADO)** |
| **S2** | RBAC real en cliente (JWT como única fuente) | P0 | S1 | 🟢 Listo |
| **S3** | Backend único + API Auth + Rate-limit persistente + `storage.rules` + `firebase.json` | P0 | S1 | 🟡 **PARCHEADO** |
| **S4** | Autenticación endurecida (sin demo silencioso) | P0 | S2 | 🟢 Listo |
| **S5** | CI/CD bloqueante + alineación de versiones `firebase-admin/functions` | P1 | S0, S3 | 🟡 **PARCHEADO** |
| **S6** | Multi-tenant 13/13 + repositorios + IDs regulatorios server-side | P1 | S1, S3 | 🟢 Listo |
| **S7** | Sanitización XSS + Error Boundaries + eliminación de mocks | P1 | S2 | 🟢 Listo |
| **S8** | Consolidador normativo (B31G/API 570/API 1163) + golden tests | P1 | S5 | 🟡 **PARCHEADO** |
| **S9** | Portal Cliente seguro (token hasheado) + sello documental SHA-256 | P1 | S3, S6 | 🟢 Listo |
| **S10**| Motor offline unificado: outbox + idempotencia + conflictos | P1 | S6 | 🟢 Listo |
| **S11**| Observabilidad y datos sensibles (Sentry/logger) | P2 | S5 | 🟢 Listo |
| **S12**| Rendimiento (code-splitting) y auditoría de dependencias (`xlsx`) | P2 | S11 | 🟢 Listo |
| **S13**| **PILOTO PROINTECA END-TO-END (Propanoducto Cardón-Amuay)** | P0 comercial | S6, S8, S9, S10 | 🟢 Listo |
| **S14**| Auditoría final y dictamen de producción | — | Todos | 🟢 Listo (Modelos Auditores contra `main`) |

---

# 🚀 2. PROMPTS LISTOS PARA COPIAR Y PEGAR EN GOOGLE AI STUDIO (S1 → S14)

---

### 📋 PROMPT GAIS — SPRINT S1 (Zero-Trust: 19 Colecciones + Reuso `setUserCustomClaims`)
```text
Actúa como Lead Firebase Security Engineer. Trabajas SOLO en la rama `sprint/IC360-S1-zero-trust`. 
PROHIBIDO: Push a main, firebase deploy no autorizado, tocar src/lib/norms/. Depende de S0 mergeado (`tests/rules/` harness disponible).

⚠️ REGLAS INQUEBRANTABLES DE ARCHIVO:
1. El fallback de TODA función helper es DENEGAR (false), nunca permitir.
2. Catch-all final: match /{document=**} { allow read, write: if false; }
3. PROHIBIDO wildcard de escritura tipo /organizations/{org}/{path=**}.
4. El rol y la organización de un usuario NUNCA se derivan de un documento editable por el propio usuario.
5. NO hagas firebase deploy. Solo commitea.

TAREA 1 — CUSTOM CLAIMS (REUSA LO EXISTENTE EN functions/src/index.ts):
- YA existe `setUserCustomClaims` en `functions/src/index.ts` (asigna claims a terceros con autorización de gerente/superadmin + audit log). NO LA DUPLIQUES NI LA BORRES.
- AÑADE una función hermana `ensureOwnClaims`: callable Cloud Function que (a) exige context.auth; (b) lee /users/{context.auth.uid} del PROPIO usuario; (c) fija claims {orgId, role} en Auth; (d) NUNCA acepta role/orgId desde el payload del cliente; (e) llama admin.auth().revokeRefreshTokens(uid).
- src/firebase.ts: tras login exitoso invocar `ensureOwnClaims` y `await user.getIdTokenResult(true)` ANTES de redirigir al dashboard.

TAREA 2 — REESCRIBIR firestore.rules (COBERTURA TOTAL 19 COLECCIONES - ANTI-BLACKOUT):
Las reglas actuales contienen 19 colecciones. Tu reescritura DEBE cubrir TODAS estas colecciones (raíz Y collection group) para evitar un blackout de módulos:
  1. tasks, 2. expenses, 3. valuations, 4. siho_ptw, 5. weld_joints, 6. field_reports, 7. documents, 8. inventory, 9. routes, 10. engineering_calcs, 11. client_portals, 12. client_portal_access_logs, 13. hot_tap_interventions, 14. procurement, 15. apus, 16. quantity_takeoffs, 17. workers, 18. worker_attendance, 19. settings.

- Helpers: isAuthenticated(), tokenOrgId(), tokenRole(), belongsToOrg(orgId), hasAnyRole(roles).
- /organizations/{orgId}/memberships/{uid}: lectura solo del propio uid o superadmin; escritura SIEMPRE false desde cliente (solo Admin SDK).
- Para las 19 colecciones: read si belongsToOrg(orgId). create/update exige belongsToOrg(orgId) + hasAnyRole([...]) + request.resource.data.orgId == orgId + request.resource.data.projectId == projectId. orgId, projectId, createdBy, createdAt son inmutables en update.
- /organizations/{orgId}/audit_logs/{id}: create solo desde Functions; read solo superadmin/gerente de esa org.
- /organizations/{orgId}/counters/{id}: allow read, write: if false (solo Admin SDK).
- Catch-all final: match /{document=**} { allow read, write: if false; }

TAREA 3 — TESTS REALES (Usando el harness de S0 en tests/rules/):
- Caso 1: Usuario sin membership no lee nada.
- Caso 2: Usuario Org A no lee/escribe Org B.
- Caso 3: Rol 'campo' no puede aprobar ni borrar documentos.
- Caso 4: Usuario no puede escribir su propia membership ni counters.
- Caso 5: Pruebas de lectura/escritura en las colecciones.

VERIFICACIÓN Y ENTREGA:
- npm run test:rules → pega salida completa con los tests pasando contra el emulador.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S1-zero-trust. NO merges.
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
   - Si claims.role u orgId son undefined tras login exitoso, expón estado 'pending-membership'.
   - NO leer rol desde Firestore ni localStorage.

2. REFACTOR ProjectContext.tsx:
   - Elimina ic360_userRole de localStorage.
   - userRole deriva de useAuthClaims(). Elimina setUserRole del contexto.

3. REFACTOR ProtectedRoute.tsx:
   - Usa useAuthClaims() en lugar de useProject().userRole.
   - Maneja 3 estados: loading, pending-membership, y denied (rol real insuficiente).
   - ELIMINA el <select> "Cambiar rol / Entorno de Pruebas". Si se necesita para desarrollo, envuélvelo en {import.meta.env.DEV && (...)}.

4. AUTORIZACIÓN EN DOS CAPAS:
   - Audita Command Palette, menús de acción rápida y botones sensibles. Cada uno debe verificar useAuthClaims().role.

5. RUTAS SIN FUGAS (src/App.tsx):
   - Alias existentes se convierten en <Navigate replace /> hacia la ruta canónica. PlatformOwnerConsole excluido para no-superadmin.

VERIFICACIÓN Y ENTREGA:
- npm run build → grep en dist/ buscando "Cambiar a:" → no debe aparecer.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S2-rbac-cliente. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S3 (Backend Único, API Auth, Rate Limit & Storage Rules + Config)
```text
Actúa como Senior Backend Engineer (Firebase Functions) y Cloud Security Engineer. Trabajas SOLO en la rama `sprint/IC360-S3-api-storage`. 
PROHIBIDO: Merge a main, firebase deploy, rotar secretos, imprimir API keys.

1. CONFIGURACIÓN EN firebase.json:
   - Registra explícitamente ambas secciones en firebase.json:
     "storage": { "rules": "storage.rules" },
     "functions": { "source": "functions" }

2. MIDDLEWARE requireAuth (functions/src/middleware/requireAuth.ts):
   - Verifica Authorization: Bearer <idToken> con admin.auth().verifyIdToken(idToken, true).
   - 401 si falta/inválido; 403 si no hay claims.orgId.

3. RATE LIMITING PERSISTENTE (functions/src/middleware/rateLimit.ts):
   - Usa colección Firestore /rate_limits/{uid}_{operation}_{windowKey} con TTL o transacción.
   - Límites: callGeminiProxy 20/min por uid; sendEmail 5/min por uid.

4. STORAGE RULES (storage.rules):
   - Denegación por defecto: match /{allPaths=**} { allow read, write: if false; }
   - /organizations/{orgId}/{allPaths=**}: read/write solo si request.auth != null y (request.auth.token.orgId == orgId o superadmin). Max 20MB, imagen o PDF.
   - /organizations/{orgId}/brandkit_public/{allPaths=**}: read público permitido solo para esta carpeta (max 2MB, png/jpeg/svg).

VERIFICACIÓN Y ENTREGA:
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
   - Elimina la rama que crea cuenta automáticamente ante auth/user-not-found. Lanza error: "Cuenta no registrada. Contacte al administrador de su organización."
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

### 📋 PROMPT GAIS — SPRINT S5 (CI/CD Bloqueante & Alineación de Versiones Firebase-Admin)
```text
Actúa como Senior DevSecOps Engineer (GitHub Actions) y TypeScript Build Engineer. 
Trabajas SOLO en la rama `sprint/IC360-S5-ci-hardening`. PROHIBIDO: Merge a main, firebase deploy.

TAREA 0 (DIAGNÓSTICO DE COMPILACIÓN EN TIEMPO REAL):
- Ejecuta `npx tsc --noEmit` en la raíz y dentro de functions/ y PEGA la salida real con el conteo de errores exacto.
- Si `server.ts` ya importa de `./src/lib/geminiServer`, NO MUEVAS EL ARCHIVO. Limítate a desacoplar cualquier import cruzado directo desde functions/src hacia src/.

TAREA 1 — ALINEACIÓN DE DEPENDENCIAS FIREBASE:
- Alinea las versiones de `firebase-admin` (^14.2.0 en raíz y ^14.2.0 en functions/package.json).
- Alinea las versiones de `firebase-functions` (^7.3.2 en raíz y ^7.3.2 en functions/package.json).

TAREA 2 — PIPELINE ENDURECIDO (.github/workflows/ci.yml):
- Job security: `npm audit --audit-level=high` + `gitleaks`.
- Job rules-check: usa `npm run test:rules` y `test:storage-rules` (bloqueantes con emulador).
- Job build: `npm ci`, `lint`, `tsc --noEmit`, `build`, `test:unit`.

VERIFICACIÓN Y ENTREGA:
- Provoca fallo deliberado de lint y confirma rechazo de CI; revierte el commit de prueba.
- npx tsc --noEmit en verde.
- Abre PR a sprint/IC360-S5-ci-hardening. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S6 (Multi-tenant 13/13 & IDs Regulatorios Server-Side)
```text
Actúa como Principal Full Stack Architect y Firebase Backend Engineer. 
Trabajas SOLO en la rama `sprint/IC360-S6-multitenant-ids`. PROHIBIDO: Merge a main, firebase deploy. Depende de S1 y S3.

1. CAPA REPOSITORIO (src/lib/repositories/):
   - Un módulo por dominio: tasksRepo, valuationsRepo, weldJointsRepo, fieldReportsRepo, documentsRepo, inventoryRepo, routesRepo, sihoPtwRepo, apusRepo, workersRepo. Tipos explícitos en src/lib/repositories/types.ts. Cada método exige orgId y projectId obligatorios.

2. MIGRACIÓN DE CALL-SITES:
   - ClientPortalView, Valuations, FieldReports, LogisticsMap, QaQcWelding, Documents, Inventory, Expenses, SihoPtw.

3. IDs REGULATORIOS SERVER-SIDE (functions/src/regulatoryIds.ts):
   - Callable issueRegulatoryCode(orgId, projectId, series): (a) requireAuth; (b) valida rol; (c) runTransaction en admin SDK sobre /organizations/{orgId}/counters/{series}-{year}; (d) retorna código oficial; (e) registra audit log.
   - Reemplaza usos de Math.random() en: SihoPtw (PTS), LotoIsolation (LOCK/PTW), AstForm (AST), EnvironmentalManagement (RASDA), TaskModal (WBS), ProcurementInventory (MAT), InstrumentationControl (LOOP).

VERIFICACIÓN Y ENTREGA:
- rg "Math.random" src/pages src/components → cero resultados en IDs oficiales.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S6-multitenant-ids. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S7 (Sanitización XSS & Error Boundaries)
```text
Actúa como Senior Frontend Security Engineer y React 19/TypeScript Developer. 
Trabajas SOLO en la rama `sprint/IC360-S7-xss-resilience`. PROHIBIDO: Merge a main, firebase deploy. Depende de S2.

1. SANITIZACIÓN:
   - Instala dompurify y @types/dompurify.
   - IsometricViewer.tsx: aplica DOMPurify.sanitize(content, { USE_PROFILES: { svg: true } }) SIN svgFilters, prohíbe foreignObject y scripts.
   - DossierCompiler.tsx: sanitiza el HTML generado antes de dangerouslySetInnerHTML.

2. ELIMINAR SIMULACIONES:
   - FleetEquipment.tsx: elimina handleSimulateOCRScan. Sustituye por upload real a Storage + estado "OCR pendiente".
   - PlatformOwnerConsole.tsx: conecta tenants a /organizations reales. Métrica no implementada → badge "DEMO".

3. ERROR BOUNDARIES:
   - src/components/ErrorBoundary.tsx con fallback UI institucional. Envuelve cada ruta lazy() en App.tsx.

VERIFICACIÓN Y ENTREGA:
- Prueba: subir SVG con <script>alert(1)</script> → no se ejecuta ni se renderiza.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S7-xss-resilience. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S8 (Motor Normativo Modular ASME/API)
```text
Actúa como Senior TypeScript Engineer con prácticas de software de ingeniería verificable. 
Trabajas SOLO en la rama `sprint/IC360-S8-norm-engine-phase1`. PROHIBIDO: Merge a main, firebase deploy. Depende de S5.

1. CONSOLIDAR CALCULADORAS DUPLICADAS:
   - Revisa duplicados (`api570.ts` raíz vs `api/`; `b165.ts` raíz vs `asme/`). Consolida en `src/lib/norms/`.

2. EXTRAER/NORMALIZAR EN src/lib/norms/:
   - src/lib/norms/types.ts: interfaz NormCalculator<TInput, TResult> con { id, standard, edition, reference, validate(input), calculate(input) }.
   - src/lib/norms/b31g.ts, api570.ts, api1163.ts: funciones puras completamente tipadas.
   - Disclaimer obligatorio: "Apoyo técnico sujeto a revisión/aprobación del ingeniero responsable."

3. GOLDEN TESTS:
   - Un test por calculadora con valores de referencia oficial de la norma.

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
   - Callable createClientPortal: genera token 32 bytes crypto; guarda en Firestore SOLO hash SHA-256; retorna token en texto plano UNA sola vez.

2. ACCESO PÚBLICO CONTROLADO (Function HTTPS getClientPortal):
   - Recibe portalId y token por query/body. Compara hash del token recibido. Rate limiting por IP. Retorna solo widgets publicados. Audit log server-side.

3. SELLO DOCUMENTAL SERVER-SIDE (Callable sealDocument):
   - Model DocumentVerification. Function descarga PDF de Storage, calcula SHA-256 server-side, escribe en colección append-only.
   - Function de verificación por QR (HTTPS, pública): retorna { status, version, issuedAt }.

VERIFICACIÓN Y ENTREGA:
- URL de portal sin token → denegado; token válido → muestra widgets.
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
   - src/lib/offline/ queda como única implementación: dexieDb.ts, syncEngine.ts, outbox.ts, conflictPolicy.ts. Elimina offlineSync.ts u offlineStore.ts viejos.

2. IDEMPOTENCIA POR operationId:
   - Cada operación genera operationId = uuid v4. Backend verifica en /idempotency_keys/{operationId} si fue procesado.

3. RESOLUCIÓN DE CONFLICTOS:
   - Evidencia: append-only. Reportes campo: conflicto visible. PTW, QA/QC, valuaciones: conflicto BLOQUEANTE.

VERIFICACIÓN Y ENTREGA:
- Prueba: encolar 3 reportes offline → reconectar → exactamente 3 documentos remotos.
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
   - Wrapper único que redacta emails, UIDs, tokens, GPS precisos. Reemplaza console.log/console.error en Auth, Functions y sync engine.

2. SENTRY & CLOUD FUNCTIONS:
   - VITE_SENTRY_DSN en .env.example. Scrub de PII por defecto. Logging estructurado en Functions.

VERIFICACIÓN Y ENTREGA:
- Error intencional → log/Sentry no contiene email ni token.
- npx tsc --noEmit sin errores.
- Abre PR a sprint/IC360-S11-observability. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S12 (Rendimiento, Code-Splitting & Auditoría `xlsx`)
```text
Actúa como Senior Performance + Supply Chain Security Engineer. 
Trabajas SOLO en la rama `sprint/IC360-S12-perf-dependencies`. PROHIBIDO: Merge a main, firebase deploy. Depende de S11.

1. AUDITORÍA `xlsx`:
   - npm audit --omit=dev. Si xlsx se confirma vulnerable, migra a exceljs en src/lib/excelExporter.ts. Limpia vite duplicado en package.json.

2. PERFORMANCE (vite.config.ts):
   - build.rollupOptions.output.manualChunks: chunks '3d', 'maps', 'charts', 'pdf', 'excel'.

VERIFICACIÓN Y ENTREGA:
- npm audit --omit=dev salida limpia.
- npx tsc --noEmit y npm run test:unit en verde.
- Abre PR a sprint/IC360-S12-perf-dependencies. NO merges.
- Responde el Auto-Checklist Obligatorio de 12 preguntas.
```

---

### 📋 PROMPT GAIS — SPRINT S13 (Piloto PROINTECA End-to-End: Propanoducto Cardón-Amuay)
```text
Actúa como QA Lead y Product Engineer para software industrial. 
Trabajas SOLO en la rama `sprint/IC360-S13-pilot-prointeca`. PROHIBIDO: Merge a main, firebase deploy, datos reales. Depende de S6, S8, S9 y S10.

OBJETIVO DEL PILOTO: Proyecto → WBS/tarea → PTW/ART → reporte campo offline → fotos/GPS → QA/QC/NDT → avance físico → valuación → dossier → portal cliente.
DATOS (Tenant "prointeca-demo"): Ducto 6" SCH 40, 17.0 km, MAOP 2126 psi. 3 defectos ILI. Roles: gerente, supervisor, inspector, campo, cliente.

1. SEED SEGURO:
   - scripts/seed-prointeca-pilot.ts puebla el tenant SOLO en no-producción contra emulador. Usa assignMembership de S1.

2. CHECKLIST OPERATIVO Y TESTS SMOKE:
   - docs/pilot/PILOT_ACCEPTANCE.md documenta el flujo. Smoke tests completos.

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
   - Zero-Trust Firestore, RBAC JWT, Backend Auth + Rate Limiting, Sanitización XSS con DOMPurify, Portal con hash.

2. INTEGRIDAD DE DATOS:
   - Multi-tenant 13/13, IDs regulatorios por Function con Admin SDK, motor offline Dexie con idempotencia, y sello SHA-256 server-side con QR.

3. CALIDAD Y SUPPLY CHAIN:
   - npm audit --omit=dev, npx tsc --noEmit (0 errores), npm run test:all (en verde con emulador).

4. DICTAMEN FINAL (Rúbrica Enterprise 1-100):
   - Seguridad (35%), Arquitectura (20%), Mantenibilidad (15%), Cobertura (15%), Rendimiento (15%).
   - Dictamen: APTO PARA PILOTO PROINTECA, APTO PARA PRODUCCIÓN LIMITADA MULTI-TENANT, o RECHAZADO POR RIESGO RESIDUAL.
```

---

© 2026 **Industrial Control 360**. Todos los derechos reservados.
