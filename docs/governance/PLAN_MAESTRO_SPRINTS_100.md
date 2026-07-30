# 🗺️ PLAN MAESTRO UNIFICADO DE SPRINTS — RUTA A 100/100 (S0 → S13)
## Industrial Control 360 — Hoja de Ruta de Cierre de Brechas P0 → P3

**Código del Documento:** `DOC-GOV-2026-010` (v3 Consolidada)  
**Ubicación:** `docs/governance/PLAN_MAESTRO_SPRINTS_100.md`  
**Fecha:** 29 de Julio de 2026  
**Panel de Auditoría:** ChatGPT 5.6 Terra Thinking + Claude 5 Sonnet Thinking + Qwen 3.8 Max (MCP GitHub)  
**Director de Operaciones & Síntesis:** Antigravity (DeepMind)  
**Implementador Exclusivo:** Google AI Studio (GAIS) via Pull Requests (NUNCA push directo a `main`)  

---

## 📐 0. REGLAS TRANSVERSALES DE EJECUCIÓN (EN TODOS LOS SPRINTS)

```text
⚠️ REGLAS INQUEBRANTABLES (Aplica a cada prompt de GAIS):
1. Eres GAIS, el ÚNICO desarrollador autorizado a escribir código en el repo.
2. Trabajas SOLO en ramas de feature: sprint/IC360-SXX-<nombre>.
3. PROHIBIDO: Push directo a main, firebase deploy no autorizado, rotar secretos o cambiar fórmulas en src/lib/norms/.
4. Aislamiento Multi-Tenant Estricto: Toda entidad vive bajo /organizations/{orgId}/projects/{projId}/...
5. Ninguna clave o secreto se incluye en src/ ni en el bundle de cliente.
6. Al terminar cada tarea, responde el Auto-Checklist Obligatorio de 7 Preguntas de Claude y abre PR sin mergear.
```

### ❓ Auto-Checklist Obligatorio de Cierre (7 Preguntas):
1. ¿Qué archivos se modificaron y por qué?
2. ¿`npx tsc --noEmit` pasa 100% con 0 errores?
3. ¿Se probó el estado vacío y el estado de error de cada función tocada?
4. ¿Algún dato mostrado sigue siendo Math.random(), array hardcodeado o simulación?
5. ¿Se expone alguna clave o secreto nuevo en `src/` o en el bundle de cliente?
6. ¿Los cambios respetan `/organizations/{orgId}/projects/{projId}/...` sin excepción?
7. ¿Qué quedó explícitamente FUERA de alcance de este sprint y por qué?

---

## 📊 1. MAPA UNIFICADO DE SPRINTS (S0 → S13)

| Sprint | Nombre y Alcance | Prioridad | Cierra Brecha |
|---|---|---|---|
| **S0** | Verificación de Estado Real en `main` via MCP GitHub | P0 (Verificado) | Base de datos pública (`signedIn() { return true; }`) confirmada en HEAD `11c6bb4` |
| **S1** | Zero-Trust: Custom Claims en Backend + Refresco Token + `firestore.rules` | P0 (Seguridad) | Bloqueo multi-tenant hermético y reparación de `securityRules.test.ts` |
| **S2** | RBAC Real en Cliente + Redirección de Rutas Alias | P0 (Seguridad) | Eliminación del `<select>` de superadmin y dependencia de `localStorage` |
| **S3** | Endpoints `/api/*` Auth + Rate-Limit + CORS Estricto + `storage.rules` | P0 (Seguridad) | Protección contra abuso de cuota Gemini/Resend y aislamiento de archivos |
| **S4** | Autenticación Endurecida (Sin Cuentas Automáticas ni Demo Silencioso) | P0 (Seguridad) | Requiere registro explícito de usuarios por administrador |
| **S5** | CI/CD Bloqueante + Desacople de `server.ts` / `functions/` + Secret Scan | P1 (DevSecOps) | Reparación de tipos `tsc` en `server.ts` y pipeline con gates de seguridad |
| **S6** | Migración Multi-Tenant Completa (13/13) + Repositorios + IDs Secuenciales | P1 (Integridad) | Adiós `Math.random()`, contadores atómicos `runTransaction` por organización |
| **S7** | Sanitización XSS (DOMPurify) + Error Boundaries + Eliminación de Mocks | P1 (Resiliencia) | Sanitización de SVGs/HTML e higienización de `PlatformOwnerConsole` |
| **S8** | Motor Normativo Modular (ASME B31.3 / B31G / API 570 / API 1163) + Golden Tests | P1 (Diferenciador) | Calculadoras puras tipadas y testeables con referencias normativas |
| **S9** | **PILOTO PROINTECA END-TO-END (Cardón-Amuay)** | P0 (Comercial) | **Valor Tangible YA:** Flujo completo WBS → PTW → Campo → QA/QC → Valuación → Dossier |
| **S10**| Portal Cliente Seguro (Token Opaco/Revocable) + Sello Server-Side SHA-256 | P1 (Trazabilidad) | Dossier inviolable con verificación QR en tiempo real |
| **S11**| Motor Offline Unificado en `DexieDB` con Outbox & Deduplicación | P1 (Resiliencia) | Cero duplicados en sync y resolución de conflictos bloqueantes |
| **S12**| Observabilidad (Sentry) + Rendimiento (Code-Splitting) + Migración `exceljs` | P2 (Calidad) | Sustitución de `xlsx` vulnerable y monitoreo de errores en producción |
| **S13**| Auditoría Final y Re-Scoring de Producción | — | Verificación de cierre total con rúbrica enterprise (Puntaje Objetivo: ≥93-95/100) |

---

## 🚀 2. PROMPTS PARA GAIS (SPRINT S1 EN ADELANTE)

### 📋 PROMPT GAIS — SPRINT S1 (Zero-Trust & Custom Claims)
```text
Actúa como Lead Firebase Security Engineer. Trabajas SOLO en la rama `sprint/IC360-S1-zero-trust`. 
PROHIBIDO: Push a main, firebase deploy no autorizado, borrar datos o tocar src/lib/norms/.

CONTEXTO VERIFICADO (Auditoría Qwen #20 sobre HEAD 11c6bb4):
- firestore.rules tiene `signedIn() { return true; }` → DB 100% pública.
- securityRules.test.ts tiene 4 casos correctos PERO cada uno arranca con `if (!testEnv) return;` → pasan en silencio.

⚠️ REGLAS INQUEBRANTABLES:
1. El fallback de TODA función helper en firestore.rules es DENEGAR (false), nunca permitir.
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

© 2026 **Industrial Control 360**. Todos los derechos reservados.
