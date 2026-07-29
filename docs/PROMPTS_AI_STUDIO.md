# 🎯 PROMPTS ACTIVOS PARA GOOGLE AI STUDIO (Industrial Control 360)

> **Orquestador Principal:** Antigravity AI
> **Coordinación:** Qwen & Hermes
> **Fuente de verdad:** `docs_ic360/planificacion/`

---

## 🟢 PROMPT ACTUAL: TICKET `IC360-008` (Sprint 4 — Tests de Intrusión Cross-Tenant en CI)

```text
Actúa como Especialista en QA de Seguridad Firebase y CI/CD.

Necesitamos implementar la suite de pruebas unitarias de intrusión cross-tenant para `firestore.rules` utilizando `@firebase/rules-unit-testing` en Node.js, e integrarla en la GitHub Action del proyecto (`IC360-008`):

1. SUITE DE PRUEBAS (`src/__tests__/securityRules.test.ts`):
   Crea la suite de pruebas unitarias que verifique los 4 casos de aislamiento multi-tenant:
   - Caso 1: Usuario de 'semax_pino' con rol 'gerente' PUEDE leer `/organizations/semax_pino/projects/proj_1`.
   - Caso 2 (INTRUSIÓN BLOQUEADA): Usuario de 'semax_pino' NO PUEDE leer ni escribir en `/organizations/prointeca/projects/proj_456`.
   - Caso 3 (ZERO TRUST): Usuario autenticado SIN claim `orgId` NO PUEDE leer ni escribir en ninguna organización.
   - Caso 4 (COLLECTION GROUP ISOLATION): Consulta collectionGroup en `tasks` solo retorna registros de su `orgId`.

2. CONFIGURACIÓN CI/CD (.github/workflows/ci.yml):
   Agrega un paso en la GitHub Action para ejecutar el emulador de Firestore y correr los tests:
   - Instalar Firebase CLI (`npm install -g firebase-tools`).
   - Ejecutar: `firebase emulators:exec --only firestore "npm test"`.

3. VERIFICACIÓN:
   Asegura que `npm run lint` siga pasando limpiamente y realiza el commit.
```

---

## 🟡 EN PREPARACIÓN: TICKET `IC360-009` (Sprint 5 — Diferenciador Normativo API 1163 / API 653)

*Hermes está pre-cargando los criterios de prueba del caso Propanoducto Cardón-Amuay 6" (API 1163) desde el vault PDVSA.*
