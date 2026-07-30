# 🗺️ PLAN MAESTRO DE SPRINTS — Ruta a 100/100 (PLAYBOOK EJECUTABLE)
## Industrial Control 360 — Hoja de Ruta de Cierre de Brechas (P0 → P3)

**Código del Documento:** `DOC-GOV-2026-010` (v2 — Playbook completo con prompts)
**Ubicación:** `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`
**Fecha:** 29 de Julio de 2026
**Basado en:** Auditoría técnica integral (`INFORME.MD`, score 32/100) + `PLAN_DE_ACCION_Y_ENDURECIMIENTO_CONSOLIDADO.md` (DOC-GOV-2026-009, síntesis ChatGPT/Claude/Kimi)
**Rol de ejecución:** Antigravity (director de operaciones / redactor de prompts) → Google AI Studio (agente de código)
**Estado:** Sprint 14 en curso. Este documento define **Sprint 15 → Sprint 31** hasta cierre total de brechas.

---

## 0. Cómo usar este documento

Cada sprint tiene cuatro bloques:
1. **Objetivo y trazabilidad** (qué hallazgo del `INFORME.MD` cierra).
2. **Alcance técnico** — qué archivos toca, qué NO toca.
3. **Criterio de aceptación** — cómo se verifica que el sprint está cerrado de verdad (no solo "se ve bien").
4. **Prompt listo para pegar en Google AI Studio** — copiar tal cual, completo.

**Reglas de operación del pipeline:**
- **Un sprint a la vez.** No pegues el prompt del Sprint N+1 hasta que AI Studio haya respondido el Checklist de Cierre (Sección 2) del Sprint N.
- **AI Studio nunca ejecuta `firebase deploy`.** Todo despliegue de reglas, índices o functions es un 🧍 `PASO MANUAL` ejecutado por un humano desde una máquina segura.
- **Rama por sprint:** `sprint/15-rbac-claims`, `sprint/17-rules-zero-trust`, etc. Si hoy trabajas directo en `main`, a partir del Sprint 27 (CI endurecido) será obligatorio por branch protection.
- Si AI Studio pregunta "¿rápido para demo o bien para producción?" (AGENTS.md §6), la respuesta es siempre: **producción**.

---

## 1. Por qué este orden (dependencias técnicas, no preferencia)

```
S15 Claims/RBAC cliente ─┐
S16 Auth endurecida      ─┴─► S17 Rules Zero Trust (deploy) ─► S18 API auth ─► resto
                                 ▲
                                 └── Las reglas exigen claims; si el cliente no los
                                     lee y los usuarios no los tienen, el deploy rompe
                                     la app. Por eso S15 y S16 van ANTES de S17.
```

| Sprint | Nombre | Fase | Hallazgo que cierra | Score impactado |
|---|---|---|---|---|
| 14 | PDF de Calidad, Evidencia Fotográfica y BrandKit | P0 | Consolidado ChatGPT/Claude/Kimi | Cumplimiento | 🟡 En curso |
| 15 | Custom Claims end-to-end + RBAC real en cliente | P0 | INFORME §1.3#2, §3.2 | Seguridad +++ |
| 16 | Autenticación endurecida (sin auto-cuentas ni demo silencioso) | P0 | INFORME §1.3#4 | Seguridad ++ |
| 17 | `firestore.rules` Zero Trust + tests IC360-008 verdes | P0 | INFORME §1.3#1, §1.3#5 | Seguridad ++++ |
| 18 | Auth + rate-limiting en endpoints `/api/*` | P0 | INFORME §1.3#3 | Seguridad ++ |
| 19 | Reglas de Storage + Portal Cliente con token opaco | P0/P1 | INFORME §3.2 (portal) | Seguridad + |
| 20 | IDs regulatorios secuenciales (eliminar `Math.random()`) | P1 | INFORME §4.2 | Cumplimiento |
| 21 | Saneamiento XSS + honestidad funcional (mocks/simulaciones) | P1 | INFORME §3.3-A03, §4.2 | Seguridad, Mantenibilidad |
| 22 | Motor offline unificado (Dexie único + dedupe) | P1 | INFORME §2.2, §4.2 | Arquitectura |
| 23 | Migración de datos raíz → jerarquía + capa repositorio | P1 | INFORME §2.2, §5 | Arquitectura +++ |
| 24 | Supply chain: dependencias, lockfile único, `firebase-admin` alineado | P1 | INFORME §3.5 | Seguridad + |
| 25 | TS `strict` + ESLint + Prettier | P2 | INFORME §4.1 | Calidad |
| 26 | Rendimiento: paginación, virtualización, `manualChunks` | P2 | INFORME §4.4 | Rendimiento ++ |
| 27 | CI/CD + gobernanza (branch protection, gitleaks, dependabot) | P2 | INFORME §6 | Calidad/Cobertura |
| 28 | Higiene: normas duplicadas, `package.json` real, mojibake, LICENSE | P2/P3 | INFORME §4.1, §4.2 | Mantenibilidad |
| 29 | Observabilidad: Error Boundaries, logging sin PII, cabeceras HTTP | P3 | INFORME §3.3-A09, §4.3 | Resiliencia |
| 30 | Tests de negocio + E2E flujo PTW | P3 | INFORME §6 | Cobertura ++ |
| 31 | Auditoría final y re-scoring → 100/100 | — | Verificación global | Global |

---

## 2. Checklist de Cierre de Sprint (obligatorio al final de cada uno)

Antes de marcar cualquier sprint como cerrado, Antigravity debe pedirle a Google AI Studio que responda explícitamente:

```
1. ¿Qué archivos se modificaron y por qué?
2. ¿tsc --noEmit pasa sin errores?
3. ¿Se probó el estado vacío y el estado de error de cada función tocada?
4. ¿Algún dato mostrado sigue siendo Math.random(), array hardcodeado o simulación?
5. ¿Se expone alguna clave o secreto nuevo en src/ o en el bundle de cliente?
6. ¿Los cambios respetan /organizations/{orgId}/projects/{projId}/... sin excepción?
7. ¿Qué quedó explícitamente FUERA de alcance de este sprint y por qué?
```

---

## 3. 🧍 TAREAS MANUALES FUERA DE AI STUDIO (hacer en paralelo a S15–S18)

Estas acciones no son código; ejecútalas tú o tu equipo de plataforma:

- [ ] **M1 (hoy):** Rotar `RESEND_API_KEY` en Resend y actualizar el secreto en el entorno del servidor/Functions.
- [ ] **M2 (hoy):** Restringir la Firebase API key en Google Cloud Console → Credentials → HTTP referrers (solo tu dominio productivo) + API allowlist (Identity Toolkit, Firestore, Storage).
- [ ] **M3 (hoy):** Revisar en GCP los logs de uso de Gemini API y Resend de los últimos 30 días para cuantificar abuso durante la ventana de reglas públicas.
- [ ] **M4 (tras S17):** `firebase deploy --only firestore:rules` desde máquina segura. Verificar en consola que las reglas activas son las del repo.
- [ ] **M5 (tras S17):** Ejecutar `npx tsx scripts/set-custom-claims.ts <UID> <ROLE> <ORG_ID>` para cada usuario real existente (bootstrap de claims).
- [ ] **M6 (tras S27):** Activar branch protection en `main` (require PR + status checks verdes).

---

# FASE P0 — SEGURIDAD (Sprints 15 → 19)

---

## 4. SPRINT 15 — Custom Claims end-to-end + RBAC real en cliente

### Objetivo
Cerrar INFORME §1.3#2 (RBAC ficticio). Hoy el rol vive en `localStorage` y `ProtectedRoute` ofrece un selector para auto-escalarse a `superadmin`. Al terminar este sprint, el rol se leerá **exclusivamente** del JWT verificado (`getIdTokenResult()`), y las rutas alias sin guard quedarán eliminadas. **No se tocan las reglas de Firestore todavía** (eso es S17): este sprint deja al cliente listo para convivir con reglas estrictas.

### Alcance técnico
- TOCA: `src/firebase.ts`, `src/ProjectContext.tsx`, `src/components/ProtectedRoute.tsx`, `src/App.tsx`, `functions/src/index.ts` (nueva callable `ensureUserClaims`), `scripts/set-custom-claims.ts` (solo documentación de uso).
- NO TOCA: `firestore.rules`, páginas de negocio, `server.ts`.

### Criterio de aceptación
- No existe ninguna lectura de rol desde `localStorage` (`ic360_userRole` eliminado del código).
- `ProtectedRoute` no renderiza ningún selector de rol; muestra solo "Acceso Denegado" con el rol real del token.
- En `App.tsx` no queda ninguna ruta que renderice un módulo sensible sin `ProtectedRoute` (`/master-console`, `/loto`, `/apu`, `/instrumentation`, `/civil` redirigen a su ruta protegida).
- `ensureUserClaims` (callable) asigna por defecto el rol **más bajo** (`campo`) leyendo `/users/{uid}` — nunca acepta un rol enviado por el cliente.

### 📋 PROMPT — SPRINT 15

```
Actúa como Desarrollador Senior React 19 / TypeScript y Security Engineer.

Antes de escribir código, sincroniza y lee los archivos de arquitectura actualizados en la carpeta `docs/` de la rama `main`, incluyendo `docs/governance/PLAN_MAESTRO_SPRINTS_100.md` y `AGENTS.md`.

Ejecutamos el Sprint 15: Custom Claims end-to-end + RBAC real en cliente (IC360-024).

⚠️ REGLAS INQUEBRANTABLES:
- NO tocar `firestore.rules` en este sprint.
- NO ejecutar `firebase deploy`.
- Mantener aislamiento multi-tenant bajo `/organizations/{orgId}/projects/{projId}/...`.
- Ninguna clave o secreto en `src/`.
- El rol de usuario JAMÁS vuelve a escribirse en `localStorage`.

1. NUEVO HOOK DE CLAIMS (`src/hooks/useAuthClaims.ts`):
   - Crea un hook que use `auth.onIdTokenChanged` y `user.getIdTokenResult()` para exponer `{ role, orgId, loading }` leídos del JWT verificado.
   - No leer el rol desde Firestore `/users/{uid}` ni desde `localStorage`: el token es la única fuente de verdad.

2. CLOUD FUNCTION `ensureUserClaims` (`functions/src/index.ts`):
   - Callable que: (a) exige `context.auth`; (b) lee `/users/{uid}` del propio usuario; (c) si el token no tiene `role`/`orgId`, fija como claims el rol almacenado en ese documento SI es válido, o el rol mínimo `campo` + su `orgId` registrada; (d) NUNCA acepta `role` u `orgId` desde el payload del cliente; (e) llama `admin.auth().revokeRefreshTokens(uid)` tras fijar claims.
   - El cliente la invoca una sola vez tras el login (en `src/firebase.ts`) y después fuerza `getIdTokenResult(true)` para refrescar el token.

3. REFACTOR `ProjectContext.tsx`:
   - Elimina `ic360_userRole` de `localStorage` (lectura y escritura) y el estado local de rol.
   - `userRole` pasa a derivarse de `useAuthClaims()`. Elimina `setUserRole` del contexto (nadie puede cambiar su rol desde la UI).
   - Elimina el `getDoc(doc(db,'users',uid))` como fuente del rol (puede quedar solo para datos de perfil no sensibles).

4. REFACTOR `ProtectedRoute.tsx`:
   - Usa `useAuthClaims()` en lugar de `useProject().userRole`.
   - Elimina por completo el bloque del `<select>` "¿Entorno de Pruebas / Demo?" que permite cambiar de rol.
   - Muestra la pantalla de acceso denegado con el rol real del token (o "sin rol asignado" si no tiene claims).

5. RUTAS SIN FUGAS (`src/App.tsx`):
   - Para cada módulo sensible, deja UNA sola ruta protegida y convierte los alias en redirecciones: `/master-console` → `/platform-owner-console`, `/loto` → `/loto-isolation`, `/apu` → `/apu-estimation`, `/instrumentation` → `/instrumentation-control`, `/civil` → `/civil-engineering`.
   - `PlatformOwnerConsole` queda excluido para cualquier rol distinto de `superadmin` (hoy admite `gerente`: corrígelo).

6. LIMPIEZA DE FALLBACKS DE IDENTIDAD (`src/firebase.ts`):
   - `getAuthUser()` deja de retornar usuarios demo de `localStorage` como si fueran sesión real para propósitos de autorización (puede conservarse solo para pre-llenar UI en modo demo explícito, ver Sprint 16).
   - Documenta con comentario qué partes quedan pendientes del Sprint 16.

7. VERIFICACIÓN Y SUBIDA:
   - Ejecuta `tsc --noEmit` y confirma cero errores.
   - Responde el Checklist de Cierre de Sprint (7 preguntas de `docs/governance/PLAN_MAESTRO_SPRINTS_100.md` §2).
   - Sube los cambios a la rama `main` en GitHub.
```

---

## 5. SPRINT 16 — Autenticación endurecida (sin auto-cuentas ni demo silencioso)

### Objetivo
Cerrar INFORME §1.3#4. Hoy: el login crea cuentas automáticamente ante `user-not-found`, la app auto-inicia sesión anónima al cargar, y cualquier fallo de auth degrada a un usuario demo hardcodeado. Al terminar, el acceso requiere una cuenta real creada por un administrador, y el modo demo/anónimo solo existe detrás de un flag de entorno explícito para desarrollo.

### Alcance técnico
- TOCA: `src/firebase.ts`, `src/pages/Login.tsx`, `vite.config.ts` (solo si hace falta el flag), `.env.example`.
- NO TOCA: `firestore.rules`, `server.ts`, `functions/`.

### Criterio de aceptación
- `loginWithEmail` ya no llama `createUserWithEmailAndPassword`: muestra "Cuenta no registrada. Contacte al administrador."
- No hay `signInAnonymously` automático al cargar la app salvo que `VITE_ENABLE_DEMO_AUTH=true`.
- Sin flag, un visitante sin sesión ve SIEMPRE `Landing`/`Login` (no entra a la app como demo).
- El `DEMO_USER_DEFAULT` y los fallbacks de `localStorage` (`ic360_user`) solo se activan con el flag activo.

### 📋 PROMPT — SPRINT 16

```
Actúa como Desarrollador Senior React 19 / TypeScript y Security Engineer.

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`, `AGENTS.md` y el estado actual de `src/firebase.ts` tras el Sprint 15.

Ejecutamos el Sprint 16: Autenticación endurecida (IC360-025).

⚠️ REGLAS INQUEBRANTABLES:
- NO tocar `firestore.rules`. NO ejecutar `firebase deploy`.
- El comportamiento por defecto (sin variables de entorno) debe ser el SEGURO: ningún acceso anónimo ni demo.
- No elimines el modo demo: gateado tras flag explícito para desarrollo/demos controladas.

1. FLAG DE ENTORNO:
   - Añade a `.env.example`: `VITE_ENABLE_DEMO_AUTH=` con comentario explicando que SOLO se usa en desarrollo/demos y que en producción debe estar ausente o en `false`.
   - Crea `src/config.ts` (o extiende uno existente) exportando `export const DEMO_AUTH_ENABLED = import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true'`.

2. `loginWithEmail` (`src/firebase.ts`):
   - Elimina la rama que crea la cuenta ante `auth/user-not-found`. En su lugar lanza: "Cuenta no registrada. Contacte al administrador de su organización para ser dado de alta."
   - Elimina el fallback silencioso a usuario local ante errores de API key/dominio: propaga el error con mensaje claro.

3. AUTO-SIGNIN ANÓNIMO:
   - En `useAppAuthState`, elimina el `signInAnonymously(auth)` automático salvo que `DEMO_AUTH_ENABLED` sea `true`.
   - Sin flag: si no hay usuario de Firebase, el estado es `user = null` y la app muestra `Landing`/`Login` (eso ya lo hace `App.tsx`).

4. MODO DEMO GATEADO:
   - `loginAnonymously()` y el botón "Acceso Demo" de `Login.tsx` solo se renderizan/ejecutan si `DEMO_AUTH_ENABLED`.
   - Cuando el modo demo esté activo, muestra un banner persistente en la app: "MODO DEMOSTRACIÓN — los datos no son reales" (componente visible, no un console.log).

5. REGISTRO DE USUARIOS NUEVOS:
   - Documenta en `README.md` el flujo soportado: el administrador crea la cuenta (Firebase Console o script) y asigna claims con `scripts/set-custom-claims.ts`. No existe auto-registro.

6. VERIFICACIÓN Y SUBIDA:
   - `tsc --noEmit` sin errores.
   - Verifica manualmente: sin flag → visitante solo ve Login; con flag → entra el demo con banner.
   - Responde el Checklist de Cierre de Sprint.
   - Sube los cambios a `main`.
```

---

## 6. SPRINT 17 — `firestore.rules` Zero Trust + tests IC360-008 verdes

### Objetivo
Cerrar INFORME §1.3#1 y §1.3#5 — el hallazgo más grave del proyecto. Reescritura completa de las reglas con denegación por defecto, validación de custom claims y cobertura de todas las colecciones. **El deploy es un paso manual posterior (M4/M5).**

### Alcance técnico
- TOCA: `firestore.rules` (reescritura total), `src/__tests__/securityRules.test.ts` (solo para añadir casos, nunca para debilitar aserciones), `firebase.json` (registrar `firestore.indexes.json` si se crea), `firestore.indexes.json` (nuevo).
- NO TOCA: código de páginas, `server.ts`, `functions/`.

### Criterio de aceptación
- `firebase emulators:exec --only firestore "npm test"` → los 4 casos de IC360-008 pasan de verdad.
- El catch-all final es `allow read, write: if false;`.
- Toda función helper tiene fallback de DENEGACIÓN (nunca de concesión).
- Las colecciones raíz legacy quedan denegadas (fuerza la migración del Sprint 23).

### 📋 PROMPT — SPRINT 17

```
Actúa como Lead Security Engineer especializado en Firebase / Firestore Security Rules.

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`, `AGENTS.md` (§2 y §5), `docs/architecture/ARCHITECTURE.md` y `src/__tests__/securityRules.test.ts`.

Ejecutamos el Sprint 17: Reescritura Zero Trust de `firestore.rules` (IC360-026).

⚠️ REGLAS INQUEBRANTABLES:
- El fallback de TODA función helper es DENEGAR, nunca conceder.
- El catch-all final es `allow read, write: if false;` sin excepciones.
- NO debilitar aserciones existentes de `securityRules.test.ts`: las reglas se adaptan a los tests, no al revés.
- NO ejecutar `firebase deploy` (el deploy es un paso manual posterior).
- NO crear reglas para colecciones raíz nuevas: todo dato de proyecto vive bajo `/organizations/{orgId}/projects/{projId}/...`.

1. HELPERS (base):
   - `signedIn()`: `request.auth != null`.
   - `isSuperadmin()`: rol `superadmin` en `request.auth.token`.
   - `userOrg()`: `request.auth.token.get('orgId', '')` (cadena vacía nunca matchea una org real).
   - `belongsToOrg(org)`: `userOrg() == org || isSuperadmin()`.
   - `hasRole(roles)`: rol del token dentro de la lista, o superadmin.

2. COLECCIONES:
   - `/users/{userId}`: lectura solo al propio usuario o superadmin; create/update solo al propio usuario y PROHIBIDO que se modifique a sí mismo los campos `role`/`orgId` (usa `diff().affectedKeys()`); delete solo superadmin.
   - `/organizations/{org}` + `/projects/{proj}` + subcolecciones: lectura `belongsToOrg(org)`; escritura por rol (`gerente`/`supervisor` crean/actualizan, `inspector`/`campo` solo crean en colecciones operativas, delete solo `gerente`).
   - Collection groups (`/{path=**}/valuations/{id}`, `/siho_ptw`, `/weld_joints`, `/tasks`, `/expenses`, `/field_reports`, `/documents`, `/apus`, `/quantity_takeoffs`, `/procurement`, `/hot_tap_interventions`, `/workers`, `/worker_attendance`): lectura validando `belongsToOrg(resource.data.orgId)`; escritura validando `belongsToOrg(request.resource.data.orgId)` + rol.
   - `/organizations/{org}/counters/{id}`: escritura solo en transacción por roles `['gerente','supervisor','inspector']` de la org (lo usará el Sprint 20).
   - `/organizations/{org}/client_portal_access_logs/{id}`: create autenticado de la org; read solo `gerente`/`superadmin`.

3. COLECCIONES RAÍZ LEGACY (`/tasks`, `/valuations`, `/weld_joints`, `/field_reports`, `/documents`, `/inventory`, `/routes`, `/client_portals`, `/settings`, `/projects`, etc.):
   - DENEGADAS explícitamente (la migración a la jerarquía es el Sprint 23). Documenta con comentario que quedan bloqueadas a propósito.

4. TESTS:
   - Ejecuta `firebase emulators:exec --only firestore "npm test"` y haz pasar los 4 casos de IC360-008 sin tocar sus aserciones.
   - Añade 2 casos nuevos: (a) rol `campo` NO puede borrar documentos; (b) usuario de otra org NO puede escribir en `counters` de una org ajena.
   - Si alguna página del cliente deja de funcionar con estas reglas, NO relajes la regla: documéntalo en tu respuesta como trabajo del Sprint 23.

5. ÍNDICES:
   - Genera `firestore.indexes.json` con los índices de collection group necesarios para las queries filtradas por `orgId` que usa el cliente (revisa `Dashboard.tsx`, `ClientPortalView.tsx`). Regístralo en `firebase.json`.

6. VERIFICACIÓN Y SUBIDA:
   - Tests del emulador en verde, `tsc --noEmit` sin errores.
   - Responde el Checklist de Cierre de Sprint e indica qué módulos quedan temporalmente bloqueados hasta el Sprint 23.
   - Sube los cambios a `main` (las reglas se despliegan manualmente después, NO desde AI Studio).
```

> 🧍 **PASOS MANUALES tras cerrar S17 (en este orden):** M4 (`firebase deploy --only firestore:rules,firestore:indexes`) → M5 (bootstrap de claims a usuarios reales) → verificación en Firebase Console de que las reglas activas son las del repo.

---

## 7. SPRINT 18 — Auth + rate-limiting en endpoints `/api/*`

### Objetivo
Cerrar INFORME §1.3#3. Los endpoints `/api/callGeminiProxy`, `/api/gemini/proxy` y `/api/send-email` no verifican identidad: robo de cuota Gemini y relay abierto de correo. Se protegen con verificación de ID token, rate limiting y CORS estricto, tanto en Express (`server.ts`) como en la Cloud Function espejo.

### Alcance técnico
- TOCA: `server.ts`, `functions/src/index.ts`, `src/lib/geminiProxy.ts` (adjuntar token), `src/lib/emailService.ts` (adjuntar token), `package.json` (nueva dep `express-rate-limit`).
- NO TOCA: `firestore.rules`, páginas de negocio.

### Criterio de aceptación
- Llamada a `/api/callGeminiProxy` sin `Authorization: Bearer <token>` → 401.
- Token inválido/expirado → 401; token válido sin `orgId` → 403.
- Rate limit: >20 req/min por usuario → 429 con mensaje claro.
- CORS: sin fallback wildcard; solo orígenes explícitos.
- El cliente adjunta automáticamente el ID token en `callGeminiProxy` y `sendNotificationEmail`.
- `/api/gemini/proxy` (duplicado) eliminado; queda solo `/api/callGeminiProxy`.

### 📋 PROMPT — SPRINT 18

```
Actúa como Senior Backend Engineer (Node/Express + Firebase) y Security Engineer.

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`, `AGENTS.md`, `server.ts`, `functions/src/index.ts`, `src/lib/geminiProxy.ts` y `src/lib/emailService.ts`.

Ejecutamos el Sprint 18: Autenticación y rate-limiting en endpoints de servidor (IC360-027).

⚠️ REGLAS INQUEBRANTABLES:
- Ninguna clave de API en `src/`; `GEMINI_API_KEY` y `RESEND_API_KEY` solo en el servidor.
- Sin fallback CORS wildcard (`*`): solo orígenes explícitos.
- El proxy de Gemini nunca devuelve "datos de contingencia" disfrazados de respuesta de IA: los errores se propagan con código y mensaje honestos.
- NO tocar `firestore.rules`. NO ejecutar `firebase deploy`.

1. MIDDLEWARE `requireAuth` (en `server.ts` y replicado en `functions/src/index.ts`):
   - Extrae `Authorization: Bearer <idToken>`, verifica con `admin.auth().verifyIdToken()`.
   - 401 si falta o es inválido; 403 si el token no tiene claim `orgId`.
   - Inicializa `firebase-admin` en `server.ts` (credenciales de entorno, nunca en código).

2. RATE LIMITING:
   - Añade `express-rate-limit` a dependencias.
   - `/api/callGeminiProxy`: máximo 20 req/min por `uid` (fallback a IP si no hay uid).
   - `/api/send-email`: máximo 10 req/min por `uid`.
   - Respuesta 429 con JSON `{ error, retryAfterSeconds }`.

3. CORS ESTRICTO:
   - Elimina la rama `else if (!origin) { '*' }`. Orígenes permitidos vía lista blanca explícita (producción + localhost solo si `NODE_ENV !== 'production'`). Añade `Vary: Origin`.

4. VALIDACIÓN DE PAYLOAD:
   - `/api/callGeminiProxy`: exige `prompt` (string ≤ 30.000 chars) o `contents`; rechaza lo demás con 400.
   - `/api/send-email`: valida formato de `to` (email o array de emails), `subject` ≤ 200 chars, `html` ≤ 100 KB. Si `RESEND_API_KEY` no está configurada → 503 con error honesto (NUNCA `{ success: true, simulated: true }`).

5. ENDPOINT DUPLICADO:
   - Elimina la ruta `/api/gemini/proxy`; deja solo `/api/callGeminiProxy`. Verifica con búsqueda global que ningún cliente llama al duplicado.

6. CLIENTE CON TOKEN:
   - `src/lib/geminiProxy.ts` y `src/lib/emailService.ts`: obtén el ID token con `auth.currentUser?.getIdToken()` y envíalo en el header `Authorization`. Si no hay sesión, lanza error de autenticación visible para el usuario (no silencioso).
   - Elimina en `callGeminiProxy` el texto de "contingencia" que simula respuesta de IA: propaga el error real al componente para que muestre un estado de error honesto.

7. CABECERAS DE SEGURIDAD:
   - Añade en `server.ts`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`. (CSP completa queda para el Sprint 29.)

8. VERIFICACIÓN Y SUBIDA:
   - `tsc --noEmit` sin errores.
   - Prueba manual documentada en tu respuesta: sin token → 401; con token → 200; ráfaga de 25 req → 429.
   - Responde el Checklist de Cierre de Sprint.
   - Sube los cambios a `main`.
```

---

## 8. SPRINT 19 — Reglas de Storage + Portal Cliente con token opaco

### Objetivo
Cerrar dos brechas: (a) no existe `storage.rules` (los buckets heredan exposición análoga a la de Firestore), y (b) INFORME §3.2 — el Portal Cliente se "protege" solo conociendo el `portalId`, enumerable con las reglas antiguas. Se implementa acceso por token opaco de un solo propósito con expiración y revocación.

### Alcance técnico
- TOCA: `storage.rules` (nuevo), `firebase.json` (registrar storage rules), `src/pages/ClientPortalBuilder.tsx`, `src/pages/ClientPortalView.tsx`, `firestore.rules` (solo el bloque `client_portals` bajo `/organizations/{org}`).
- NO TOCA: resto de `firestore.rules` (ya endurecido en S17), `server.ts`.

### Criterio de aceptación
- `storage.rules` deniega por defecto; lectura/escritura solo bajo `/organizations/{orgId}/...` con `belongsToOrg`.
- El portal se guarda bajo `/organizations/{orgId}/client_portals/{portalId}` (no en raíz) y su URL pública es `/portal/{portalId}?k={token}`.
- Acceso sin token válido → pantalla de acceso denegado. Token revocado o expirado → denegado.
- La regla de lectura pública del portal valida `accessEnabled == true`, `expiresAt > request.time` y `revokedAt == null`.

### 📋 PROMPT — SPRINT 19

```
Actúa como Lead Security Engineer (Firebase Storage + Firestore Rules) y Senior React Developer.

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`, `AGENTS.md`, el `firestore.rules` actual (post-Sprint 17), `src/pages/ClientPortalBuilder.tsx` y `src/pages/ClientPortalView.tsx`.

Ejecutamos el Sprint 19: Reglas de Storage y Portal Cliente con token opaco (IC360-028).

⚠️ REGLAS INQUEBRANTABLES:
- Denegar por defecto en Storage y en cualquier regla nueva de Firestore.
- El portal deja de vivir en la colección raíz `client_portals`: migra a `/organizations/{orgId}/client_portals/{portalId}`.
- NO ejecutar `firebase deploy` (los despliegues son pasos manuales).
- El token de acceso NUNCA se loguea en consola ni se guarda en `localStorage`.

1. STORAGE RULES (`storage.rules`, nuevo):
   - Denegación por defecto: `match /{allPaths=**} { allow read, write: if false; }`.
   - Ruta `/organizations/{orgId}/{allPaths=**}`: lectura/escritura solo si `request.auth != null` y (`request.auth.token.orgId == orgId` o rol `superadmin`).
   - Límite de tamaño razonable en escritura (ej. `request.resource.size < 20 * 1024 * 1024`) y validación de `contentType` para imágenes/PDF.
   - Registra `storage.rules` en `firebase.json`.

2. MODELO DE PORTAL SEGURO:
   - En `ClientPortalBuilder.tsx`: al crear/editar un portal, escribe en `/organizations/{orgId}/client_portals/{portalId}` con campos: `accessToken` (string opaco generado con `crypto.randomUUID()` + sufijo aleatorio, NO `Math.random()`), `accessEnabled: true`, `expiresAt` (ISO), `revokedAt: null`.
   - La URL pública mostrada para compartir es `${APP_URL}/portal/{portalId}?k={accessToken}`.

3. LECTURA PÚBLICA CONTROLADA (`ClientPortalView.tsx`):
   - Lee `portalId` de la ruta y `k` del query string.
   - Consulta el portal por collection group `client_portals` filtrando `portalId` y `accessToken == k` (o doc directo si conoces el org del claim anónimo — elige la variante que NO exija listar la colección).
   - Si no existe, token inválido, `accessEnabled == false`, expirado o revocado → pantalla de "Acceso no válido o revocado" SIN revelar cuál condición falló.
   - Mantén el access log en `/organizations/{orgId}/client_portal_access_logs` (create-only).

4. REGLA FIRESTORE PARA PORTAL (añade solo este bloque a `firestore.rules`, sin tocar lo demás):
   - `match /organizations/{org}/client_portals/{portalId}`:
     - `allow read: if belongsToOrg(org) || (resource.data.accessEnabled == true && resource.data.expiresAt > request.time && resource.data.revokedAt == null);`
     - `allow create, update: if belongsToOrg(org) && hasRole(['gerente']);`
     - `allow delete: if belongsToOrg(org) && hasRole(['gerente']);`
   - Añade a `securityRules.test.ts` un caso: lectura pública con portal revocado → `assertFails`.

5. REVOCACIÓN:
   - En `ClientPortalBuilder.tsx`, el botón "Revocar acceso" fija `revokedAt` con timestamp y `accessEnabled: false` (no borra el documento: preserva auditoría).

6. VERIFICACIÓN Y SUBIDA:
   - `tsc --noEmit` sin errores; tests del emulador en verde (incluido el nuevo caso).
   - Prueba manual documentada: URL sin `k` → denegado; con `k` válido → portal; tras revocar → denegado.
   - Responde el Checklist de Cierre de Sprint.
   - Sube los cambios a `main`.
```

---

# FASE P1 — ESTABILIZACIÓN Y REFACTORIZACIÓN (Sprints 20 → 24)

---

## 9. SPRINT 20 — IDs regulatorios secuenciales (eliminar `Math.random()`)

### Objetivo
Cerrar INFORME §4.2: hay 10 usos de `Math.random()` generando identificadores de documentos regulatorios (PTW, LOTO, AST, manifiestos RASDA, WBS, códigos de material, tags de instrumentación). En contexto HSE/fiscal esto es inaceptable: colisiones, no secuencialidad, no auditabilidad. Se reemplazan por contadores transaccionales por organización/serie.

### Alcance técnico
- TOCA: nuevo `src/lib/documents/sequentialId.ts`, y los call-sites: `SihoPtw.tsx`, `LotoIsolation.tsx`, `AstForm.tsx`, `EnvironmentalManagement.tsx`, `TaskModal.tsx`, `ProcurementInventory.tsx`, `InstrumentationControl.tsx`.
- NO TOCA: `firestore.rules` (el bloque `counters` ya se creó en S17), lógica de PDF.

### Criterio de aceptación
- `rg "Math.random" src/pages src/components` → cero coincidencias en generación de IDs oficiales (puede quedar solo en IDs efímeros de UI si los hay, justificados).
- IDs con formato `{SERIE}-{AÑO}-{NNNN}` secuencial por org (ej. `PTS-TRA-2026-0042`).
- Dos creaciones concurrentes del mismo tipo de documento producen IDs distintos y consecutivos (transacción).

### 📋 PROMPT — SPRINT 20

```
Actúa como Desarrollador Senior React 19 / TypeScript e Ingeniero de Calidad documental O&G.

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`, `AGENTS.md` (§2, patrón prohibido de `Math.random()`).

Ejecutamos el Sprint 20: IDs regulatorios secuenciales transaccionales (IC360-029).

⚠️ REGLAS INQUEBRANTABLES:
- Cero `Math.random()` para cualquier identificador que se muestre como oficial (PTW, LOTO, AST, RASDA, WBS, materiales, tags).
- Los contadores viven en `/organizations/{orgId}/counters/{serie-año}` y se incrementan SOLO con `runTransaction`.
- NO tocar `firestore.rules` (el bloque `counters` ya existe desde el Sprint 17).

1. NUEVO HELPER (`src/lib/documents/sequentialId.ts`):
   - `nextSequentialId(orgId: string, series: string): Promise<string>` usando `runTransaction` sobre `doc(db, 'organizations', orgId, 'counters', `${series}-${year}`)`.
   - Formato de salida: `${series}-${year}-${String(next).padStart(4, '0')}`.
   - Manejo de error: si la transacción falla (sin permisos/offline), lanzar error visible — NUNCA caer a un ID aleatorio silencioso.
   - Incluye comentario de diseño: por qué transacción (concurrencia de cuadrillas) y por qué contador por año (reinicio anual de series fiscales).

2. REEMPLAZOS (uno por uno, verificando cada call-site):
   - `SihoPtw.tsx:209` → serie `PTS-${tipo3letras}`.
   - `LotoIsolation.tsx:168,170` → series `LOCK-${energia}` y `PTW`.
   - `AstForm.tsx:277` → serie `AST`.
   - `EnvironmentalManagement.tsx:170,274` → series `RASDA` y `CERT-RASDA`.
   - `TaskModal.tsx:49` → WBS: usa `nextSequentialId` solo para el segmento numérico nuevo, preservando la jerarquía WBS padre si existe.
   - `ProcurementInventory.tsx:344,496,934` → serie `MAT`.
   - `InstrumentationControl.tsx:183-184` → series por tipo de instrumento y `LOOP`.

3. ESTADO DE CARGA Y ERROR EN UI:
   - Mientras se genera el ID, el botón de creación muestra estado de carga; si falla, mensaje de error claro con opción de reintento (no se crea el documento sin ID oficial).

4. VERIFICACIÓN Y SUBIDA:
   - `rg "Math.random" src/pages src/components` sin coincidencias en IDs oficiales.
   - `tsc --noEmit` sin errores.
   - Prueba documentada: crear 2 PTW seguidos → IDs consecutivos.
   - Responde el Checklist de Cierre de Sprint.
   - Sube los cambios a `main`.
```

---

## 10. SPRINT 21 — Saneamiento XSS + honestidad funcional

### Objetivo
Cerrar INFORME §3.3-A03 y §4.2: (a) XSS por SVG subido sin sanitizar en `IsometricViewer` y HTML inyectado en `DossierCompiler`; (b) funciones simuladas presentadas como reales (`handleSimulateOCRScan`, consola de plataforma 100% mock con MRR y audit logs falsos); (c) fallbacks silenciosos que muestran datos de ejemplo como si fueran reales.

### Alcance técnico
- TOCA: `package.json` (`dompurify` + `@types/dompurify`), `IsometricViewer.tsx`, `DossierCompiler.tsx`, `FleetEquipment.tsx`, `PlatformOwnerConsole.tsx`, `ProjectContext.tsx` (fallbacks), `src/lib/geminiProxy.ts` (ya saneado en S18 — solo verificar).
- NO TOCA: reglas, server, functions.

### Criterio de aceptación
- Todo contenido subido por usuario que se renderice como HTML/SVG pasa por `DOMPurify.sanitize()` con perfil SVG estricto.
- No existe ninguna función `handleSimulate*` en el código.
- `PlatformOwnerConsole` muestra datos reales de Firestore o, si un dato aún no tiene fuente real, lo etiqueta visiblemente como "DEMO — sin conexión a datos reales".
- Cuando Firestore falla o está vacío, el usuario ve estado de error/vacío, no proyectos demo disfrazados (el seed demo solo corre con el flag del Sprint 16).

### 📋 PROMPT — SPRINT 21

```
Actúa como Senior Frontend Security Engineer y Desarrollador React 19 / TypeScript.

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md` y `AGENTS.md` (§1, §2 patrones prohibidos).

Ejecutamos el Sprint 21: Saneamiento XSS y honestidad funcional (IC360-030).

⚠️ REGLAS INQUEBRANTABLES:
- Ningún `dangerouslySetInnerHTML` sin sanitización previa con DOMPurify.
- Ninguna simulación puede presentarse como funcionalidad real (AGENTS.md §1).
- Ningún dato mock puede renderizarse sin etiqueta visible "DEMO".
- NO tocar `firestore.rules`, `server.ts`, `functions/`.

1. SANITIZACIÓN:
   - Instala `dompurify` y `@types/dompurify`.
   - `IsometricViewer.tsx`: antes de inyectar el SVG subido (`customSvgContent`), aplícale `DOMPurify.sanitize(content, { USE_PROFILES: { svg: true, svgFilters: true } })`. Rechaza archivos > 2 MB y cualquier contenido con `<script`, `onload=`, `javascript:` tras sanitizar (valida que el resultado no quedó vacío).
   - `DossierCompiler.tsx`: sanitiza el HTML generado antes de `dangerouslySetInnerHTML` con perfil HTML por defecto.

2. ELIMINAR SIMULACIONES:
   - `FleetEquipment.tsx`: elimina `handleSimulateOCRScan`. Sustitúyelo por: (a) subida real del documento a Storage bajo `/organizations/{orgId}/...`, y (b) estado "Extracción OCR pendiente de integración" honesto, o extracción real vía proxy Gemini con `responseSchema` si decides implementarla (si la implementas, cita que pasa por `/api/callGeminiProxy`).
   - `PlatformOwnerConsole.tsx`: elimina `INITIAL_TENANTS` e `INITIAL_AUDIT_LOGS` como datos presentados. Conecta tenants a `/organizations` y audit logs a `/{org}/audit_logs` reales. Todo dato sin fuente real disponible se muestra con badge "DEMO" y tooltip "Métrica pendiente de instrumentación".

3. FALLBACKS HONESTOS:
   - `ProjectContext.tsx`: los `FALLBACK_DEMO_PROJECTS` solo se usan si `DEMO_AUTH_ENABLED` (flag del Sprint 16) está activo. En caso contrario: colección vacía → `EmptyState` real; error de permisos → mensaje de error visible.
   - `seedDemoData` solo puede invocarse con el flag activo (elimina el auto-seed silencioso en producción).

4. BARRIDO FINAL:
   - `rg "handleSimulate|mockData|fakeResponse" src` → cero resultados.
   - `rg "dangerouslySetInnerHTML" src` → cada ocurrencia restante tiene `DOMPurify.sanitize` en las 3 líneas previas.

5. VERIFICACIÓN Y SUBIDA:
   - `tsc --noEmit` sin errores.
   - Prueba documentada: subir SVG con `<script>alert(1)</script>` → el script no ejecuta y el contenido se sanitiza.
   - Responde el Checklist de Cierre de Sprint.
   - Sube los cambios a `main`.
```

---

## 11. SPRINT 22 — Motor offline unificado

### Objetivo
Cerrar INFORME §2.2/§4.2: coexisten TRES motores offline divergentes (`offlineSync.ts`, `offlineStore.ts`, `offline/dexieDb.ts` + `syncEngine.ts`) y el Service Worker espera una base concreta que solo uno crea. `syncEngine` hace `addDoc` ciego: duplicados garantizados en reconexión. Se consolida en UN motor Dexie con outbox, deduplicación por `tempId` y resolución por `updatedAt`.

### Alcance técnico
- TOCA: `src/lib/offline/*` (consolidar), `src/lib/offlineSync.ts` y `src/lib/offlineStore.ts` (eliminar o convertir en fachada deprecada), `public/sw.js` (alinear nombre de DB/store), páginas que encolan operaciones offline (`FieldReports`, `Valuations`, `LogisticsMap`).
- NO TOCA: reglas, server, functions, Dexie schema de lectura actual (migrar con versión Dexie si hace falta).

### Criterio de aceptación
- Existe UN solo punto de entrada offline: `src/lib/offline/` (enqueue + sync). Los otros dos archivos quedan eliminados o re-exportando desde el motor único con `@deprecated`.
- Re-sincronizar la misma cola dos veces no crea duplicados (dedupe por `tempId`: antes de `addDoc`, verifica si ya existe documento con ese `tempId`).
- Toda escritura sincronizada lleva `tempId`, `updatedAt` y `orgId`/`projectId` (jerarquía multi-tenant — nada de colecciones raíz).
- El Service Worker apunta a la misma DB/store que Dexie.

### 📋 PROMPT — SPRINT 22

```
Actúa como Senior Frontend Engineer especializado en offline-first / PWA y sincronización.

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`, `AGENTS.md` (§3, patrón offline), `src/lib/offline/dexieDb.ts`, `src/lib/offline/syncEngine.ts`, `src/lib/offlineSync.ts`, `src/lib/offlineStore.ts` y `public/sw.js`.

Ejecutamos el Sprint 22: Unificación del motor offline (IC360-031).

⚠️ REGLAS INQUEBRANTABLES:
- UN solo motor offline: `src/lib/offline/` (Dexie). Nada de colas paralelas.
- Toda escritura sincronizada va bajo `/organizations/{orgId}/projects/{projId}/...` — prohibido colecciones raíz.
- Deduplicación obligatoria por `tempId`: re-sincronizar no puede duplicar documentos.
- NO tocar `firestore.rules`, `server.ts`, `functions/`.

1. CONSOLIDACIÓN:
   - `src/lib/offline/` queda como única implementación (Dexie): `dexieDb.ts` (schema versionado), `syncEngine.ts` (procesamiento de cola), `outbox.ts` nuevo (API `enqueueOperation(type, payload)`).
   - `src/lib/offlineSync.ts` y `src/lib/offlineStore.ts`: migra sus call-sites al motor único y elimina los archivos (o deja fachadas `@deprecated` que re-exportan, solo si algún import lo exige temporalmente — documéntalo).

2. DEDUPLICACIÓN Y CONFLICTOS:
   - Cada operación encolada lleva `tempId` determinístico (uuid v4 al encolar, no al sincronizar).
   - `syncEngine`: antes de escribir, consulta si ya existe un documento con ese `tempId` (campo indexado); si existe → marca la operación como sincronizada sin re-escribir.
   - Escrituras con `serverTimestamp()` + campo `updatedAt` del cliente; en conflicto de actualización, gana el `updatedAt` mayor (last-write-wins documentado con comentario).
   - Política de reintentos: máximo 5 por operación con backoff exponencial (1s, 2s, 4s...); tras agotar → estado `failed` visible en UI con acción "Reintentar" manual.

3. JERARQUÍA MULTI-TENANT:
   - Corrige los `addDoc(collection(db, 'field_reports'|'valuations'|'routes'))` de `syncEngine.ts` para escribir en la ruta `/organizations/{orgId}/projects/{projId}/{col}` correspondiente, incluyendo `orgId` y `projectId` en el payload.

4. SERVICE WORKER:
   - Alinea `public/sw.js` con el nombre real de la DB Dexie y su object store. El mensaje `IC360_TRIGGER_SYNC` debe disparar el `syncEngine` real (verifica el listener en la app).

5. UI DE ESTADO:
   - `OfflineBanner` muestra: operaciones pendientes, última sincronización exitosa, y operaciones `failed` con botón de reintento.

6. VERIFICACIÓN Y SUBIDA:
   - `tsc --noEmit` sin errores.
   - Prueba documentada: encolar 3 reportes offline → reconectar → 3 documentos creados; forzar segunda pasada de sync → siguen siendo 3, no 6.
   - Responde el Checklist de Cierre de Sprint.
   - Sube los cambios a `main`.
```

---

## 12. SPRINT 23 — Migración de datos raíz → jerarquía + capa repositorio

### Objetivo
Cerrar INFORME §2.2/§5 — el defecto arquitectónico más profundo: unos módulos escriben en colecciones raíz y otros leen de la jerarquía multi-tenant, corrompiendo el modelo de datos. Se crea la capa de repositorio por dominio y se migra TODO el acceso a datos a `/organizations/{orgId}/projects/{projId}/...`.

### Alcance técnico
- TOCA: nuevo `src/lib/repositories/` (tasks, valuations, weldJoints, fieldReports, documents, inventory, routes, apus, quantityTakeoffs, workers, sihoPtw), y TODAS las páginas/lib que hoy tocan colecciones raíz: `QaQcWelding.tsx`, `FieldReports.tsx`, `Documents.tsx`, `Inventory.tsx`, `LogisticsMap.tsx`, `Tasks.tsx`, `Valuations.tsx`, `ProjectBrain.tsx`, `Intelligence.tsx`, `lib/parsers/syncParsers.ts`, `lib/seedDemoData.ts`, `Settings.tsx`, `ProjectContext.tsx`.
- NO TOCA: reglas (las raíces ya quedaron denegadas en S17 — este sprint hace que la app vuelva a funcionar sobre la jerarquía).
- 🧍 PASO MANUAL posterior: ejecutar/verificar la migración de documentos existentes con `scripts/migrate-to-multitenant.ts` en el proyecto real.

### Criterio de aceptación
- `rg "collection\(db, '" src | grep -v organizations` → cero escrituras/lecturas en colecciones raíz (salvo `/users` y casos justificados documentados).
- Ninguna página importa `collection/addDoc/onSnapshot` directamente para datos de proyecto: usan el repositorio.
- Cada documento escrito incluye `orgId` y `projectId` (requisito de las collection-group rules de S17).

### 📋 PROMPT — SPRINT 23

```
Actúa como Principal Full Stack Architect y Desarrollador Senior React 19 / TypeScript.

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`, `docs/architecture/ARCHITECTURE.md`, `AGENTS.md` (§1.5, §3) y el `firestore.rules` actual.

Ejecutamos el Sprint 23: Capa repositorio y erradicación de colecciones raíz (IC360-032).

⚠️ REGLAS INQUEBRANTABLES:
- TODO dato de proyecto bajo `/organizations/{orgId}/projects/{projId}/...` — cero excepciones.
- Todo documento escrito incluye `orgId` y `projectId` en el payload.
- Las páginas NO importan el SDK de Firestore directamente para datos de proyecto: pasan por `src/lib/repositories/`.
- NO tocar `firestore.rules`, `server.ts`, `functions/`.

1. CAPA REPOSITORIO (`src/lib/repositories/`):
   - Crea un módulo por dominio (`tasksRepo.ts`, `valuationsRepo.ts`, `weldJointsRepo.ts`, `fieldReportsRepo.ts`, `documentsRepo.ts`, `inventoryRepo.ts`, `routesRepo.ts`, `sihoPtwRepo.ts`, `apusRepo.ts`, `workersRepo.ts`).
   - Cada uno expone: `subscribe({ orgId, projectId }, callback, onError)`, `create({ orgId, projectId }, data)`, `update(...)`, `remove(...)` y construye las rutas internamente. Inyecta `orgId`/`projectId` en cada payload.
   - Para vistas de portafolio corporativo (`projectId === 'all'`), expone variantes `subscribeByOrg` usando collection group con `where('orgId','==',orgId)`.

2. MIGRACIÓN DE CALL-SITES (verificar uno por uno):
   - `QaQcWelding.tsx` (addDoc `weld_joints` raíz), `FieldReports.tsx`, `Documents.tsx`, `Inventory.tsx`, `LogisticsMap.tsx`, `Tasks.tsx` (update/delete raíz), `Valuations.tsx` (query `tasks` raíz), `ProjectBrain.tsx` e `Intelligence.tsx` (`doc(db,'projects',id)`), `lib/parsers/syncParsers.ts`, `lib/seedDemoData.ts`, `Settings.tsx` (`settings/general` → bajo `/organizations/{orgId}/settings/general`), `ProjectContext.tsx` (`settings/brandKit` → idem).

3. TIPADO:
   - Los repositorios usan interfaces de dominio explícitas (sin `any`): define los tipos en `src/lib/repositories/types.ts` reutilizando los campos que hoy escriben las páginas.

4. SCRIPT DE MIGRACIÓN DE DATOS:
   - Revisa `scripts/migrate-to-multitenant.ts`: actualízalo para mapear TODAS las colecciones raíz legacy listadas en S17 hacia la jerarquía, con modo `--dry-run` (reporta conteos sin escribir) y resumen de integridad al final. NO lo ejecutes: queda listo para paso manual.

5. VERIFICACIÓN Y SUBIDA:
   - `rg --pcre2 "collection\(db, '(?!organizations)" src` → sin resultados en datos de proyecto.
   - `tsc --noEmit` sin errores.
   - Responde el Checklist de Cierre de Sprint, indicando qué módulos requieren el paso manual de migración de datos.
   - Sube los cambios a `main`.
```

> 🧍 **PASO MANUAL tras S23:** `npx tsx scripts/migrate-to-multitenant.ts --dry-run` → revisar → ejecutar real → verificar conteos por colección en Firebase Console.

---

## 13. SPRINT 24 — Supply chain: dependencias, lockfile único, alineación de versiones

### Objetivo
Cerrar INFORME §3.5: `xlsx@0.18.5` con CVEs sin parche en npm, `vite` 6.2.x temprano con CVEs de dev-server, `firebase-admin` ^12 (functions) vs ^14 (raíz), y doble lockfile (`bun.lock` + `package-lock.json`) que rompe la reproducibilidad del build.

### Alcance técnico
- TOCA: `package.json` (raíz y functions), `package-lock.json`, `bun.lock` (eliminar uno), `functions/package.json`.
- NO TOCA: lógica de negocio (salvo ajuste de imports de `xlsx` → nueva librería en `excelExporter.ts` y donde se use).

### Criterio de aceptación
- Un solo lockfile en el repo (decisión documentada en `DECISIONS.md`: npm o bun).
- `xlsx` reemplazado por `exceljs` (o SheetJS oficial fuera de npm) en todos los exports.
- `vite` actualizado a último 6.x parcheado (o 7.x si la compatibilidad lo permite).
- `firebase-admin` en la misma major version en raíz y functions.
- `npm audit` sin vulnerabilidades críticas/altas conocidas (o con excepciones documentadas y justificadas).

### 📋 PROMPT — SPRINT 24

```
Actúa como Senior DevSecOps Engineer y Desarrollador TypeScript.

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md` y `DECISIONS.md`.

Ejecutamos el Sprint 24: Remediación de supply chain y dependencias (IC360-033).

⚠️ REGLAS INQUEBRANTABLES:
- UN solo gestor de paquetes a partir de este sprint (documenta la elección en `DECISIONS.md` con razón).
- Ningún downgrade de funcionalidad: los exports a Excel deben seguir generando archivos válidos.
- NO tocar `firestore.rules`, `server.ts` (salvo dependencias), `functions/src/`.

1. GESTOR ÚNICO:
   - Decide npm (alineado con CI `npm ci`) o bun; elimina el lockfile del otro (`bun.lock` o `package-lock.json`). Añade la decisión a `DECISIONS.md`.
   - Añade campo `packageManager` en `package.json` para fijar la versión del gestor elegido.

2. ELIMINAR `xlsx` VULNERABLE:
   - Sustituye `xlsx` por `exceljs` en `src/lib/excelExporter.ts` y cualquier otro import (`rg "from 'xlsx'" src`).
   - Verifica que los exports conservan: hojas múltiples, formatos de número, anchos de columna y cabeceras. Prueba generando un archivo real y ábrelo.

3. ACTUALIZACIONES DE SEGURIDAD:
   - `vite` → última versión parcheada de la línea 6.x (o 7.x si `npm run build` pasa sin cambios breaking); alinea `@vitejs/plugin-react` y `@tailwindcss/vite`.
   - `firebase-admin` en `functions/package.json` → misma major que raíz (^14).
   - Ejecuta `npm audit fix` para el resto y documenta cualquier vulnerabilidad residual con justificación (ej. solo dev, sin exploit remoto).

4. VERIFICACIÓN COMPLETA:
   - `npm ci` limpio desde cero (borra `node_modules` primero).
   - `npm run lint`, `npm test` (emulador) y `npm run build` en verde.
   - Responde el Checklist de Cierre de Sprint.
   - Sube los cambios a `main`.
```

---

# FASE P2/P3 — CALIDAD, RENDIMIENTO Y GOBERNANZA (Sprints 25 → 31)

---

## 14. SPRINT 25 — TypeScript `strict` + ESLint + Prettier

### Objetivo
Cerrar INFORME §4.1: el `tsconfig` raíz no tiene `strict`, no hay ESLint/Prettier, y los tests están excluidos del chequeo de tipos. Se endurece el toolchain sin romper el build.

### 📋 PROMPT — SPRINT 25

```
Actúa como Senior TypeScript Engineer y DX Engineer.

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`, `tsconfig.json` y `package.json`.

Ejecutamos el Sprint 25: Toolchain de calidad base (IC360-034).

⚠️ REGLAS INQUEBRANTABLES:
- El build (`npm run build`) y los tests deben quedar en verde al final.
- Los errores de `strict` se corrigen de verdad (tipos correctos), no se silencian con `any` masivo ni `@ts-ignore` salvo excepción comentada.
- NO tocar `firestore.rules`, `server.ts` (salvo tipos), lógica de negocio más allá de correcciones de tipado.

1. TYPESCRIPT ESTRICTO:
   - Activa en `tsconfig.json`: `strict: true` (incluye `strictNullChecks`, `noImplicitAny`). Elimina `allowJs` si no hay `.js` en `src/`.
   - Quita las exclusiones de tests de `tsconfig` (`src/**/__tests__/**`, `*.test.ts`) para que `tsc` también los chequeé; si genera ruido en CI, crea `tsconfig.test.json` separado y úsalo en el script `test`.
   - Corrige los errores resultantes. Presupuesto máximo: 5 `@ts-expect-error` con comentario de justificación; el resto se tipa correctamente (empieza por los `useState<any[]>` de páginas usando los tipos de `src/lib/repositories/types.ts` del Sprint 23).

2. ESLINT + PRETTIER:
   - Instala y configura ESLint (flat config) con: `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, y regla custom o de comunidad que prohíba `Math.random()` en `src/pages` y `src/components`.
   - Prettier con configuración mínima documentada; script `format`.
   - Sustituye el script `lint` por: `tsc --noEmit && eslint . --max-warnings 0`.

3. VERIFICACIÓN Y SUBIDA:
   - `npm run lint` en verde, `npm test` en verde, `npm run build` en verde.
   - Responde el Checklist de Cierre de Sprint.
   - Sube los cambios a `main`.
```

---

## 15. SPRINT 26 — Rendimiento: paginación, virtualización y bundle

### Objetivo
Cerrar INFORME §4.4: collection-group queries sin límites que descargan colecciones completas y filtran en cliente, tablas sin virtualización, bundle con librerías pesadas en el grafo principal.

### 📋 PROMPT — SPRINT 26

```
Actúa como Senior Performance Engineer (React + Firebase).

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`, `vite.config.ts`, `Dashboard.tsx`, `ClientPortalView.tsx`, `Tasks.tsx` y `ProcurementInventory.tsx`.

Ejecutamos el Sprint 26: Optimización de rendimiento (IC360-035).

⚠️ REGLAS INQUEBRANTABLES:
- Ninguna query a Firestore sin `limit()` y paginación por cursor en vistas de lista.
- Ningún filtrado masivo en cliente: los filtros van en la query (`where`), no en memoria tras descargar.
- Cambios medibles: reporta bundle size antes/después en tu respuesta (`npm run build`).

1. PAGINACIÓN Y QUERIES EFICIENTES:
   - En los repositorios del Sprint 23 añade `subscribePage({ orgId, projectId }, { limit, startAfter }, callback)` con `limit(50)` y cursor `startAfter`.
   - `ClientPortalView.tsx`: elimina el filtrado en memoria de `projIds` tras descargar todo el org; usa `where('projectId', 'in', projIds)` (batches de 10 si hay más) + `limit`.
   - `Dashboard.tsx` (modo portafolio): usa agregaciones server-side (`getCountFromServer`, `getAggregateFromServer`) para los KPIs en lugar de descargar colecciones completas.

2. VIRTUALIZACIÓN:
   - Instala `@tanstack/react-virtual` y aplícalo a las tablas/listas grandes: `QaQcWelding` (juntas), `ProcurementInventory`, `Tasks` (columnas Kanban con muchas tarjetas), `Documents`.

3. BUNDLE:
   - En `vite.config.ts` configura `build.rollupOptions.output.manualChunks` separando: `three`/`@react-three/*` (chunk `3d`), `leaflet`/`react-leaflet` (chunk `maps`), `recharts` (chunk `charts`), `jspdf`/`html2canvas`/`html-to-image` (chunk `pdf`), `exceljs` (chunk `excel`).
   - Convierte en import dinámico (`await import(...)`) las librerías de PDF/Excel: solo se cargan al exportar.
   - Reporta tamaños de chunks antes/después.

4. MEMOIZACIÓN:
   - Añade `useMemo`/`useCallback` en los handlers de `onSnapshot` de las páginas más grandes para evitar re-render completo del árbol en cada snapshot.

5. VERIFICACIÓN Y SUBIDA:
   - `npm run build` en verde con reporte de chunks; `tsc --noEmit` y tests en verde.
   - Responde el Checklist de Cierre de Sprint.
   - Sube los cambios a `main`.
```

---

## 16. SPRINT 27 — CI/CD + gobernanza

### Objetivo
Cerrar INFORME §6: el CI actual no bloquea nada (los tests de seguridad fallaban y el código igual llegaba a `main`), no hay escaneo de secretos, ni auditoría de dependencias, ni despliegue controlado de reglas.

### 📋 PROMPT — SPRINT 27

```
Actúa como Senior DevSecOps Engineer (GitHub Actions).

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md` y `.github/workflows/ci.yml`.

Ejecutamos el Sprint 27: Endurecimiento de CI/CD y gobernanza (IC360-036).

⚠️ REGLAS INQUEBRANTABLES:
- Ningún secreto en el YAML: todo vía GitHub Secrets.
- El deploy de reglas de Firestore SOLO ocurre desde CI en `main` (o manualmente), nunca desde AI Studio.
- El pipeline debe FALLAR si: lint falla, tests fallan, `npm audit` reporta críticas, o se detecta un secreto.

1. PIPELINE ENDURECIDO (`.github/workflows/ci.yml`):
   - Añade job `security`: (a) `npm audit --audit-level=high` (falla ante críticas/altas), (b) escaneo de secretos con `gitleaks` (action oficial o docker).
   - Añade job `rules-check`: despliega reglas al emulador y corre `securityRules.test.ts` (ya existe, asegúrate de que sea bloqueante).
   - Añade job `deploy-rules` (solo en push a `main`, con `environment: production` para approval manual): `firebase deploy --only firestore:rules,firestore:indexes,storage` usando `FIREBASE_TOKEN` o Workload Identity Federation desde GitHub Secrets.
   - Cache de dependencias con `actions/setup-node` (ya existe; verifica que usa el lockfile único del Sprint 24).

2. GOBERNANZA DEL REPO:
   - Crea `.github/dependabot.yml` (npm semanal, agrupa minor/patch).
   - Crea `SECURITY.md` en raíz: política de reporte de vulnerabilidades y contacto.
   - Crea `.github/pull_request_template.md` con el Checklist de Cierre de Sprint embebido.

3. DOCUMENTACIÓN DE ENTORNOS:
   - Crea `docs/operations/ENVIRONMENTS.md`: dev local, emuladores, staging y producción — URLs, proyectos Firebase, quién despliega qué, y dónde vive cada secreto (sin valores, solo nombres).

4. VERIFICACIÓN Y SUBIDA:
   - El pipeline corre verde en este PR; provoca un fallo deliberado de lint en un commit de prueba y confirma que el check falla (luego reviértelo).
   - Responde el Checklist de Cierre de Sprint.
   - Sube los cambios a `main`.
```

> 🧍 **PASO MANUAL tras S27:** activar branch protection en `main` (M6): require PR, require status checks (`build-and-test`, `security`, `rules-check`), require 1 approval.

---

## 17. SPRINT 28 — Higiene de código y documentación

### Objetivo
Cerrar INFORME §4.1/§4.2: normas de ingeniería duplicadas en dos jerarquías, `package.json` genérico (`react-example` v0.0.0), mojibake en docs/manifest, README desactualizado (dice React 18, se usa 19), sin LICENSE.

### 📋 PROMPT — SPRINT 28

```
Actúa como Senior Software Engineer (mantenibilidad) y Technical Writer.

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`, `package.json`, `README.md` y el árbol de `src/lib/norms/`.

Ejecutamos el Sprint 28: Higiene de código y documentación (IC360-037).

⚠️ REGLAS INQUEBRANTABLES:
- Los cálculos de normas (ASME/API/PDVSA) no cambian ni una fórmula: solo se consolidan archivos duplicados.
- Los tests de normas existentes deben seguir en verde sin modificar sus aserciones.

1. NORMAS SIN DUPLICADOS:
   - Consolida `src/lib/norms/`: elimina las versiones duplicadas en raíz (`api570.ts`, `b165.ts`, `b313.ts`, `b31g.ts`, `pcc1.ts`, `pdvsa906.ts`, `api1163.ts`) dejando UNA jerarquía (`api/`, `asme/`, `pdvsa/`, `core/`). Actualiza todos los imports (`rg "lib/norms/" src`).
   - `npm test` (tests de normas) en verde tras la consolidación.

2. PACKAGE.JSON REAL:
   - `name: "industrial-control-360"`, `version: "1.0.0"`, `description`, `license`, `engines: { "node": ">=20" }`, y elimina duplicados de dependencias entre `dependencies` y `devDependencies` (`vite`, `@vitejs/plugin-react`, `@types/*` → devDependencies).

3. DOCUMENTOS Y ENCODING:
   - Corrige el mojibake (caracteres `�?`, `A3`, `A�`) en `docs/flujos/WORKFLOWS.md`, `public/manifest.json` y `metadata.json` (guardar como UTF-8).
   - Actualiza `README.md`: React 19, scripts reales, arquitectura actual (proxy + Functions + Firestore), y enlace a `docs/`.

4. LEGAL:
   - Añade `LICENSE` (la que decida la dirección; si es propietaria: "Proprietary — All Rights Reserved" con texto estándar).

5. VERIFICACIÓN Y SUBIDA:
   - `npm run lint`, `npm test`, `npm run build` en verde.
   - Responde el Checklist de Cierre de Sprint.
   - Sube los cambios a `main`.
```

---

## 18. SPRINT 29 — Observabilidad y resiliencia

### Objetivo
Cerrar INFORME §3.3-A09/§4.3: sin Error Boundaries, logging solo por `console.*` (con PII), sin cabeceras de seguridad completas, sin monitoreo de errores en producción.

### 📋 PROMPT — SPRINT 29

```
Actúa como Senior SRE / Observability Engineer y React Developer.

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`, `src/firebase.ts` (`handleFirestoreError`), `src/App.tsx` y `server.ts`.

Ejecutamos el Sprint 29: Observabilidad y resiliencia (IC360-038).

⚠️ REGLAS INQUEBRANTABLES:
- Ningún log con PII (email, uid completo, tokens) en cliente ni servidor.
- Ninguna librería de monitoreo nueva con clave embebida en `src/` (DSN solo vía variables de entorno públicas documentadas en `.env.example`).

1. ERROR BOUNDARIES:
   - Crea `src/components/ErrorBoundary.tsx` (clase React) con fallback UI institucional (no pantalla en blanco) y botón "Reintentar". Envuelve el `<AppLayout />` y cada `ProtectedRoute` de módulos críticos (SihoPtw, Valuations, QaQcWelding).

2. LOGGER SIN PII:
   - Crea `src/lib/logger.ts`: niveles `info|warn|error`, sanitiza emails/UIDs (enmascara: `u***@dominio.com`, `uid:…{last4}`), y enmascara tokens por completo.
   - Reemplaza los 74 `console.*` de `src/` por el logger (empieza por `handleFirestoreError` en `firebase.ts`).
   - `handleFirestoreError` deja de serializar `authInfo` completo en consola.

3. MONITOREO:
   - Integra Firebase Performance Monitoring y Crashlytics-equivalente para web (o Sentry si la dirección lo prefiere — DSN vía `VITE_SENTRY_DSN` en `.env.example`, nunca hardcodeado).
   - Captura errores del ErrorBoundary y de `handleFirestoreError` en el servicio elegido.

4. CABECERAS HTTP COMPLETAS (`server.ts`):
   - Añade Content-Security-Policy (directiva inicial: `default-src 'self'` + allowlist para Firebase/Google APIs que la app necesita — documéntala), `Strict-Transport-Security`, `Permissions-Policy` (camera/microphone/geolocation solo `self`).

5. VERIFICACIÓN Y SUBIDA:
   - Provoca un error de render en una página de prueba y confirma que el ErrorBoundary lo captura y lo reporta.
   - `rg "console\." src` → cero o solo dentro de `logger.ts`.
   - `npm run lint`, `npm test`, `npm run build` en verde.
   - Responde el Checklist de Cierre de Sprint.
   - Sube los cambios a `main`.
```

---

## 19. SPRINT 30 — Tests de negocio + E2E del flujo PTW

### Objetivo
Cerrar INFORME §6: cobertura real <10% de UI. Se añaden tests de componentes para los flujos regulatorios críticos y un E2E del ciclo de vida PTW.

### 📋 PROMPT — SPRINT 30

```
Actúa como Senior QA Engineer (Vitest + Testing Library + Playwright).

Antes de escribir código, sincroniza y lee `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`, `package.json` y los tests existentes en `src/lib/norms/__tests__/`.

Ejecutamos el Sprint 30: Cobertura de tests de negocio y E2E (IC360-039).

⚠️ REGLAS INQUEBRANTABLES:
- Los tests de componentes usan Firebase Emulator Suite (no tocan proyecto real).
- Ningún test depende de red externa ni de Gemini real (mock del proxy).

1. TESTS DE COMPONENTES (Vitest + @testing-library/react):
   - `SihoPtw`: creación de permiso → valida que el ID sigue el formato secuencial del Sprint 20 (mock del repo), que estados vacío/error se renderizan, y que el payload incluye `orgId`/`projectId`.
   - `Valuations`: flujo Borrador → En Revisión → Aprobada con cambio de rol (mock de claims).
   - `ProtectedRoute`: con claims de rol insuficiente → acceso denegado; con rol correcto → renderiza.
   - `sequentialId` (Sprint 20): dos llamadas concurrentes → IDs distintos y consecutivos (emulador).

2. E2E (Playwright):
   - Instala `@playwright/test` y crea `e2e/ptw.spec.ts`: login (usuario de prueba del emulador) → crear PTW → aprobar como supervisor → verificar en lista → exportar PDF (verifica que el blob se genera).
   - Script `test:e2e` y documentación en README de cómo correrlo con emuladores.

3. COBERTURA:
   - Añade umbrales mínimos de cobertura en `vitest.config` para `src/lib/` (80%) y excluye páginas aún no cubiertas con comentario `// TODO: cubrir en Sprint 31+`.

4. CI:
   - Añade el job `e2e` al workflow (emuladores + Playwright) como bloqueante.

5. VERIFICACIÓN Y SUBIDA:
   - `npm test` y `npm run test:e2e` en verde localmente y en CI.
   - Responde el Checklist de Cierre de Sprint.
   - Sube los cambios a `main`.
```

---

## 20. SPRINT 31 — Auditoría final y re-scoring → 100/100

### Objetivo
Verificación global independiente de que todas las brechas del `INFORME.MD` están cerradas, con evidencia ejecutable. **Este sprint no lo ejecuta AI Studio: lo ejecuta un auditor (humano o agente externo).**

### Protocolo
1. Re-correr el INFORME completo contra el repo actualizado: cada hallazgo §1.3, §3.3 (OWASP), §4.2, §6 debe quedar marcado como `CERRADO (evidencia: commit/archivo/test)`.
2. Verificación explosiva: intento real de (a) leer Firestore sin auth, (b) escalar rol desde la UI, (c) llamar `/api/callGeminiProxy` sin token, (d) subir SVG con script. Los 4 deben fallar.
3. `npm audit` sin críticas; CI verde con todos los jobs; tests de reglas + normas + componentes + E2E en verde.
4. Re-scoring con la misma rúbrica del INFORME §1.1.
5. Definición de 100/100: **cero hallazgos P0/P1 abiertos, evidencia de cada cierre, y re-auditoría ≥ 95/100.** El 100 absoluto se declara solo cuando el auditor no encuentra ningún hallazgo nuevo de severidad media o superior.

### 📋 PROMPT — SPRINT 31 (para el agente auditor, opcional)

```
Actúa como Principal Security Auditor. Re-audita este repositorio contra el informe `INFORME.MD`
original (score 32/100). Para cada hallazgo P0/P1 del informe, verifica con evidencia
(archivo, test, o exploit fallido) si está CERRADO o ABIERTO. Ejecuta los 4 intentos de
explotación del protocolo S31. Entrega una tabla de verificación y un nuevo score con la
misma rúbrica (Seguridad 30%, Arquitectura 20%, Mantenibilidad 20%, Cobertura 15%, Rendimiento 15%).
No modifiques código: solo reporta.
```

---

## 21. Proyección de score por fase

| Hito | Seguridad | Arquitectura | Mantenibilidad | Cobertura | Rendimiento | **Global** |
|---|---|---|---|---|---|---|
| Hoy (auditoría) | 8 | 42 | 40 | 35 | 55 | **32** |
| Tras S17 (P0 cerrado) | 70 | 45 | 42 | 40 | 55 | **~52** |
| Tras S19 (P0 completo) | 85 | 48 | 45 | 45 | 55 | **~58** |
| Tras S24 (P1 cerrado) | 90 | 68 | 60 | 50 | 60 | **~70** |
| Tras S26 | 90 | 75 | 68 | 55 | 78 | **~76** |
| Tras S28 | 92 | 78 | 78 | 62 | 80 | **~80** |
| Tras S30 | 95 | 82 | 85 | 80 | 82 | **~87** |
| Tras S31 + hallazgos menores resueltos | 98 | 90 | 92 | 90 | 90 | **~93-95** |
| Declaración 100/100 | — | — | — | — | — | **Solo con cero hallazgos ≥ medio en re-auditoría** |

> **Nota honesta (AGENTS.md §0):** 100/100 no es una fecha, es un estado verificable. El plan lleva a ~93–95 de forma realista; el 100 se alcanza iterando sobre los hallazgos menores que emerjan de la re-auditoría del Sprint 31. Cualquier score declarado sin la verificación explosiva del S31 es teatro.

---

**Fin del Playbook.** Mantén este documento actualizado: cada sprint cerrado se marca ✅ con su commit y fecha.



