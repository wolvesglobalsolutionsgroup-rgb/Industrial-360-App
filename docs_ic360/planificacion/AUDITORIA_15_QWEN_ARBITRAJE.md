# 🔍 AUDITORÍA #15 — ARBITRAJE QWEN: ChatGPT vs. Antigravity + Filtro de Ciclo

**Fecha:** 30 julio 2026 · **Auditor:** Qwen (Orquestador) · **Método:** verificación contra código real en `main` (no contra reportes)
**Insumos:** Análisis de ChatGPT (auditor externo) + Respuesta de Antigravity + Auditoría #9 de Claude (knowledge base)

---

## 0. VEREDICTO EJECUTIVO

> **Ambos tienen razón en parte, y ninguno de los dos vio el hallazgo más grave.**
> ChatGPT acertó en el riesgo de "falsas conclusiones de completado". Antigravity acertó en que SEC-001 ya está mitigado.
> Pero la evidencia en el código muestra un **bug de producción real** que ninguno detalló: **`Valuations.tsx` lee en multi-tenant pero ESCRIBE en colección plana raíz** — y con las reglas Zero-Trust ya cerradas (Sprint 3), eso rompe el módulo de cobro en cuanto se despliegue.
>
> **El reporte "Sprint 2 — Migración 13/13 COMPLETADO" de Antigravity NO coincide con el código.** No es un ataque a Antigravity (su trabajo de seguridad es excelente); es que el estado real del repo manda sobre cualquier reporte.

---

## 1. LOS 3 HALLAZGOS VERIFICADOS CONTRA EL CÓDIGO REAL

### 🟢 H1 — SEC-001 está MITIGADO (Antigravity tiene razón, ChatGPT desactualizado)
Leí `vite.config.ts` en `main` (824 bytes). **NO contiene ningún `define` de `GEMINI_API_KEY`.** Solo tiene: plugins (react, tailwind), alias `@`, `dedupe` de react, `optimizeDeps` y `hmr:false`.
- El Issue #1 (SEC-001) sigue **ABIERTO** pero el código ya no tiene la vulnerabilidad.
- **Acción:** CERRAR el Issue #1 con esta evidencia + verificar `grep -R "AIza\|GEMINI_API_KEY" dist/` tras `npm run build`. La key vive solo en `process.env` del proxy server-side (`geminiServer.ts`), confirmado en auditorías previas.
- **Veredicto:** ChatGPT marcó P0 algo que ya está resuelto. Antigravity lo verificó empíricamente y acertó.

### 🔴 H2 — `Valuations.tsx` tiene un BUG de lectura/escritura (NADIE lo reportó con este detalle)
Leí `Valuations.tsx` completo (46.7KB). La migración multi-tenant está **ROTA a medias**:

| Operación | Ruta que usa | Estado |
|---|---|---|
| **LECTURA** principal | `organizations/${orgId}/projects/${projId}/valuations` | ✅ Multi-tenant |
| **ESCRITURA** `handleCreateValuation` | `addDoc(collection(db, 'valuations'), ...)` | 🔴 **COLECCIÓN PLANA RAÍZ** |
| **UPDATE** `handleAdvanceStatus` | `doc(db, 'valuations', valuation.id)` | 🔴 **COLECCIÓN PLANA RAÍZ** |
| **CÁLCULO** `calculateFromTasks` | `collection(db, 'tasks')` + `where('projectId',...)` | 🔴 **COLECCIÓN PLANA LEGACY** |

**Consecuencia funcional:** el usuario crea una valuación → se guarda en `valuations` (raíz) → la pantalla lee de la jerarquía multi-tenant → **la valuación "desaparece"**. Y con las reglas Zero-Trust cerradas, la escritura en raíz será **DENEGADA**. **El módulo de cobro (el corazón financiero del ciclo) está roto.**

### 🔴 H3 — `ClientPortalView.tsx` NO está migrado (8 referencias legacy)
Leí `ClientPortalView.tsx` completo (31KB). Usa el patrón legacy `collectionGroup` filtrado por `orgId`, NO la jerarquía `organizations/{orgId}/...`:
- `doc(db, 'client_portals', portalId)` — raíz plana
- `collection(db, 'client_portal_access_logs')` — raíz plana
- `collectionGroup(db, 'tasks' | 'valuations' | 'siho_ptw' | 'weld_joints' | 'field_reports')` — 5 collectionGroup
- `collection(db, 'dossier_compilations')` — raíz plana

**Es la pantalla de MAYOR exposición externa** (la ve PDVSA/el cliente con auth anónima). Con las reglas cerradas, **todas estas lecturas serán DENEGADAS** → el portal cliente se muere.

### ⚠️ Conclusión de los hallazgos
**El Sprint 2 (migración 13/13) NO está completado.** El estado real, verificado en código, es compatible con la Auditoría #9 de Claude (4/13 migrados), NO con el "13/13 COMPLETADO" del tablero de Antigravity. **El GATE_DESPLIEGUE_REGLAS es lo único que protege producción ahora.** NO desplegar reglas hasta migrar 13/13 de verdad.

---

## 2. TABLA DE ARBITRAJE: ¿Quién acertó en qué?

| Tema | ChatGPT | Antigravity | Veredicto Qwen (con evidencia) |
|---|---|---|---|
| SEC-001 (API key en bundle) | 🔴 P0 abierto | 🟢 Mitigado | **Antigravity.** `vite.config.ts` limpio. Cerrar Issue #1. |
| Riesgo de "completado falso" | ✅ Lo advirtió | — | **ChatGPT (profético).** Confirmado en Valuations/ClientPortal. |
| Build verde / 0 keys | — | ✅ 31.5s, 98 chunks | **Antigravity** (coherente con vite.config limpio). |
| Sprint 2 migración 13/13 | (no lo trató) | 🟢 "COMPLETADO" | **Ninguno.** Código muestra LO CONTRARIO (H2, H3). |
| Gobierno formal multi-agente | ✅ Propuesta sólida | ✅ Ya creado en repo | **Ambos.** Adoptar la estructura de ChatGPT. |
| Backlog público insuficiente | ✅ Correcto | — | **ChatGPT.** Solo 5 issues + 3 PRs zombis (#6,#7,#8). |
| README desactualizado (React 18) | ✅ Correcto | — | **ChatGPT.** Corregir a React 19. |
| Tests cross-tenant incompletos | ✅ Correcto | 🟢 "4/4 pasando" | **Parcial.** Hay tests, pero falta matriz completa (ChatGPT lista 6 escenarios). |
| Docs de gobierno (OPERATING_MODEL, DoD, STACK) | Propuso | ✅ Creó | **Antigravity ejecutó.** Bien. |

**Síntesis:** Antigravity es fuerte en seguridad/arquitectura/ejecución. ChatGPT es fuerte en gobernanza/detección de riesgo sistémico. **Mi rol (Qwen) es el que faltaba: verificar cada afirmación contra el código real.** Eso es lo que detectó el bug de Valuations que ninguno vio.

---

## 3. FILTRO DE CICLO APLICADO (aprobado por Freddy)

**Regla maestra:** hasta que PROINTECA use el ciclo completo en un proyecto real, NADA de ecosistema se ejecuta.

### ✅ DENTRO DEL CICLO (se ejecuta)
```
Prospección → Oferta → WBS/Planificación → Ejecución/Campo → PTW/SIHO →
QA/QC/NDT → Integridad/ILI → Valuación ROE → Dossier PIC-01-03 → Cobro/Cierre
```
- Sprint 0 de ChatGPT (estabilizar) → ✅ base del ciclo
- Sprint 1 de ChatGPT (núcleo operativo E2E) → ✅ **ESTE ES EL CICLO**
- Sprint 3 de ChatGPT (motor normativo) → ✅ diferenciador del ciclo
- Sprint 4 de ChatGPT (portal + dossier) → ✅ cierre/cobro del ciclo
- Sprint 5 de ChatGPT → **SOLO procure-to-pay (RFQ→OC→recepción→kardex)**

### ⛔ FUERA DEL CICLO (backlog frío, NO ejecución)
- Marketplace B2B, FinTech/Factoring, MCP server, 6 disciplinas, Offshore
- App Stores (iOS/Android/Windows), IA offline WebLLM, RAG vectorial
- Multi-IA gateway (Claude/GPT/Grok), WhatsApp/Telegram bots
→ Todo esto se registra en `BACKLOG_ECOSISTEMA.md` pero **no se toca** hasta cerrar el ciclo con PROINTECA.

---

## 4. HOJA DE RUTA RECONCILIADA (post-arbitraje)

| Orden | Sprint | Objetivo | Dueño | Bloqueador |
|:---:|---|---|---|---|
| **0.5** | 🔴 **Migración multi-tenant REAL 13/13** | Corregir H2 (Valuations escribe en raíz) y H3 (ClientPortalView 8 refs). Verificar las 13 pantallas contra código, no contra reporte. | GAIS + auditoría Qwen | **Crítico: sin esto, reglas cerradas rompen producción** |
| **0.6** | Cerrar SEC-001 + README + PRs zombis | Cerrar Issue #1 con evidencia, README→React 19, cerrar PRs #6/#7/#8 (ya aplicados a main) | Antigravity | Bajo |
| **1** | Tests cross-tenant completos (matriz 6 escenarios de ChatGPT) | Emulador Firestore: Org A vs Org B en read/list/create/update/delete + campos inmutables + portal externo + Functions | Antigravity + Qwen | Medio |
| **2** | Núcleo operativo E2E (Sprint 1 de ChatGPT) | Flujo Proyecto→WBS→PTW→Campo→QA/QC→Valuación→Dossier verificable con datos reales PROINTECA | GAIS | Depende de 0.5 |
| **3** | Motor normativo confiable | Extraer EngineeringTools; golden tests con datos reales del vault (Hermes) | Qwen + Hermes | Medio |
| **4** | Portal cliente + Dossier | Acceso expirable/revocable, separar datos internos vs publicables | GAIS + Antigravity | Depende de 0.5 (H3) |
| **5** | Procura (procure-to-pay) | RFQ→OC→recepción→kardex→liberación a obra | GAIS | Último del ciclo |

**Regla de oro reforzada:** el Sprint 0.5 va PRIMERO. No se cierran reglas (ya cerradas en repo, NO desplegadas) ni se avanza a features hasta que las 13 pantallas lean Y escriban en la jerarquía multi-tenant, verificado en código.

---

## 5. ACCIONES INMEDIATAS

1. **🔴 NO desplegar `firestore.rules` a producción.** El GATE sigue BLOQUEADO (Bloque A: migración 13/13 pendiente).
2. **Brief para GAIS (Sprint 0.5):** corregir `Valuations.tsx` (escrituras a jerarquía) y `ClientPortalView.tsx` (8 refs). Un módulo por brief.
3. **Cerrar Issue #1 (SEC-001)** con evidencia de `vite.config.ts` + grep del build.
4. **Antigravity:** actualizar `STATE.md` — Sprint 2 pasa de "COMPLETADO" a "🔴 EN PROGRESO (bug Valuations + ClientPortalView)". No es retroceso, es precisión.
5. **Hermes:** pre-cargar criterios de Valuations ROE (PDVSA L-STC-001) y ClientPortal para validar la migración.
6. **Adoptar `docs/governance/` de ChatGPT** (OPERATING_MODEL, DECISION_PROTOCOL, DoR/DoD, RISK_REGISTER) — Antigravity ya creó la base.

---

*Esta auditoría se graba en el repo como fuente de verdad versionada. Antigravity y Hermes pueden leerla directamente. — Qwen*
