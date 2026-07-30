# 🎯 PROMPTS MAESTROS OPTIMIZADOS DE AUDITORÍA Y EJECUCIÓN (V2026)

**Código del Documento:** `DOC-GOV-2026-013` (v2 Consolidada)  
**Ubicación:** `docs/governance/PROMPTS_MAESTROS_AUDITORIA_Y_DESARROLLO.md`  
**Fecha:** 29 de Julio de 2026  
**Finalidad:** Plantillas maestras mejoradas para solicitar auditorías de repositorio a IAs externas (ChatGPT 5.6, Claude 5, Qwen 3.8) y para generar prompts ejecutables de sprints para Google AI Studio (GAIS).

---

## 🏆 PROMPT MAESTRO #1: SOLICITUD DE AUDITORÍA TÉCNICA E INTEGRAL (`INFORME.MD`)

*(Usa este prompt cuando quieras pedirle a cualquier IA —ChatGPT, Claude, Qwen— que clone o lea vía MCP el repositorio en GitHub y emita un informe de salud 0-100 en `INFORME.MD`)*.

```text
Actúa como un Principal Full Stack Architect, Lead Security Engineer y Auditor de Código Senior Enterprise.

Tu objetivo es realizar una AUDITORÍA TÉCNICA INTEGRAL Y RIGUROSA en tiempo real del repositorio de GitHub ubicado en:
https://github.com/wolvesglobalsolutionsgroup-rgb/Industrial-360-App/tree/main

Analiza la rama `main` en su totalidad (arquitectura multi-tenant, código fuente React 19 / TypeScript, reglas de base de datos, proxies Express, dependencias, pruebas y DevSecOps) y genera un informe ejecutable y exhaustivo titulado `INFORME.MD`.

---

### INSTRUCCIONES DE AUDITORÍA Y ESTRUCTURA DE `INFORME.MD`

El archivo `INFORME.MD` debe seguir estrictamente este índice y rigor empírico:

#### 1. RESUMEN EJECUTIVO Y SCORE DE SALUD
- Score Global de Salud del Proyecto (0 a 100) con desglose por rúbrica:
  • Seguridad y DevSecOps (Peso 35%)
  • Arquitectura y Multi-Tenancy (Peso 20%)
  • Mantenibilidad y DX (Peso 15%)
  • Cobertura de Pruebas y Calidad (Peso 15%)
  • Rendimiento y Bundle Size (Peso 15%)
- Estado de Madurez Actual: Avance funcional vs. Preparación de Producción.
- Top 5 Riesgos Críticos / Bloqueantes de Producción.

#### 2. AUDITORÍA DE SEGURIDAD Y CUMPLIMIENTO ZERO-TRUST (DEVSECOPS)
- Base de Datos Firestore: Inspecciona `firestore.rules`. ¿Existe el catch-all `match /{document=**} { allow read, write: if false; }`? ¿Las consultas exigen claims `request.auth.token.orgId`? ¿Existen wildcards permisivos?
- Control de Acceso RBAC: Inspecciona `ProtectedRoute.tsx` y `src/firebase.ts`. ¿El rol se lee de `getIdTokenResult().claims.role` o de `localStorage`? ¿Se eliminó el `<select>` de auto-escalación a superadmin?
- APIs y Proxies de Servidor: Inspecciona `server.ts` y `functions/src/index.ts`. ¿`/api/callGeminiProxy` y `/api/send-email` cuentan con middleware `requireAuth`, rate-limiting persistente y validación CORS estricta (sin wildcard `*`)?
- Sanitización XSS: Inspecciona `IsometricViewer.tsx` y `DossierCompiler.tsx`. ¿Todo HTML/SVG inyectado se filtra con `DOMPurify.sanitize()`?
- Dependencias (Supply Chain): Audita `package.json` contra vulnerabilidades conocidas (ej. Prototype Pollution en `xlsx`).

#### 3. ARQUITECTURA Y ESTÁNDAR MULTI-TENANT
- Jerarquía de Colecciones: ¿Toda consulta escribe en `/organizations/{orgId}/projects/{projId}/...` o existen escrituras en colecciones raíz sueltas (`/tasks`, `/valuations`)?
- Generación de IDs Regulatorios: ¿Cero `Math.random()` en códigos de PTW, ART, LOTO y RASDA? ¿Se emiten por Cloud Function con Admin SDK?
- Motor Offline & Concurrencia: ¿`DexieDB` maneja cola outbox con deduplicación por `operationId` y resolución de conflictos bloqueante?

#### 4. MOTOR DE INGENIERÍA Y DOCUMENTOS TÉCNICOS
- Calculadoras Normativas: Evaluación de la modularización de fórmulas (ASME B31.3, ASME B31G, API 570, API 1163, COVENIN 2000-92) en `src/lib/norms/` con golden test cases.
- Trazabilidad y Dossier Compiler (PDVSA L-STC-001): Generación de reportes PDF limpios con `BrandKit`, Hash SHA-256 server-side, código QR y fotos de evidencia.

#### 5. DEVOPS, CI/CD E INTEGRIDAD DE PRUEBAS
- Fundación de Pruebas (Sprint S0): ¿Existe un test harness real (`npm run test:rules`) con emulador Firebase que ABORTE visiblemente si no hay emulador?
- Pipeline de CI/CD: Evaluación de `.github/workflows/ci.yml`. ¿Es un gate bloqueante que ejecuta `npm audit`, `npx tsc --noEmit`, y `test:rules`?

#### 6. PLAN DE ACCIÓN REORDENADO (HOJA DE RUTA MATRIZ S0 → S14)
Clasifica las soluciones necesarias en:
- **P0 (Crítico - Cierre Inmediato):** Fundación de tests S0, reglas Firestore, Custom Claims JWT, Auth en APIs y RBAC en cliente.
- **P1 (Alto - Estabilización):** Migración multi-tenant 13/13, IDs secuenciales server-side y motor offline Dexie.
- **P2 (Medio - Producto y Calidad):** Portal Cliente con token revocable, Piloto PROINTECA End-to-End en S13 y migración a `exceljs`.
- **P3 (Optimización):** Observabilidad Sentry, code-splitting e higienización de UI/UX.

---

### REGLAS DE TRABAJO
1. No asumas ni leas snapshots viejos: lee la rama `main` en su estado actual exacto.
2. Si un archivo o prueba está corregido en el repositorio, reconócelo con su hash de commit.
3. Todo el documento debe redactarse en tono profesional, empírico, técnico y sin rodeos.
```

---

## ⚡ PROMPT MAESTRO #2: GENERADOR DE PROMPTS Y SPRINTS EJECUTABLES (PARA GAIS)

*(Usa este prompt cuando quieras pedirle a una IA de orquestación —ChatGPT, Claude, Qwen o Antigravity— que te redacte los Sprints de desarrollo listos para entregar a Google AI Studio)*.

```text
Actúa como Lead DevSecOps Engineer & Principal Full Stack Architect.

Nuestro proyecto Industrial Control 360 (`wolvesglobalsolutionsgroup-rgb/Industrial-360-App`) requiere ejecutar una Hoja de Ruta de Remediación y Desarrollo Industrial (S0 a S14).

Tu objetivo es redactar un Plan Maestro de Sprints Executables (`PLAN_MAESTRO_SPRINTS_100.md`) donde CADA SPRINT contenga un PROMPT COMPLETO Y LISTO PARA COPIAR Y PEGAR directamente en Google AI Studio (GAIS).

---

### REGLAS DE OBLIGATORIO CUMPLIMIENTO EN CADA PROMPT GENERADO PARA GAIS:

1. **Estrategia Git Inflexible (Prohibido Push a Main):**
   Cada prompt DEBE exigir a GAIS trabajar en una rama aislada de feature: `sprint/IC360-SXX-<nombre-sprint>`, abrir Pull Request y NUNCA hacer push directo a `main` ni desplegar a producción.

2. **Garantía Multi-Tenant (Zero-Trust por Defecto):**
   Toda consulta, creación o actualización de datos DEBE forzar la ruta `/organizations/{orgId}/projects/{projectId}/{collection}`. Cero escrituras en colecciones raíz sueltas.

3. **Código Production-Ready Sin Placeholder:**
   PROHIBIDO generar prompts que permitan dejar comentarios del tipo `// ... resto del código`. GAIS debe entregar archivos completos y funcionales.

4. **Comandos de Verificación Exactos:**
   Cada prompt DEBE incluir los comandos reales que GAIS debe validar antes de entregar:
   • `npx tsc --noEmit` (0 errores de compilación).
   • `npm run test:rules` (para pruebas de seguridad y reglas en emulador Firebase).
   • `npm run test:unit` (para pruebas unitarias normativas).

5. **Auto-Checklist Obligatorio de 12 Preguntas de Claude:**
   CADA PROMPT GENERADO DEBE FINALIZAR OBLIGATORIAMENTE exigiendo a GAIS responder estas 12 preguntas antes de abrir el Pull Request:
   ```text
   1. ¿Qué archivos se modificaron, por qué y qué ticket lo autoriza?
   2. ¿Qué archivos deliberadamente NO se modificaron?
   3. ¿npm ci, lint, tsc --noEmit, build y tests relevantes están verdes?
   4. Si toca Firebase, ¿los tests Emulator pasan y fallan cuando deben fallar?
   5. Si se tocaron roles, reglas, Storage, tokens o Functions, ¿qué prueba demuestra que Org A no accesses Org B?
   6. ¿Se expuso algún secreto, token, URL firmada o dato PII nuevo?
   7. ¿Se agregó código temporal, mock o demo? ¿Está gateado y fuera de producción?
   8. ¿Qué migración de datos, índice o cambio de compatibilidad existe?
   9. ¿Cuál es el rollback exacto?
   10. ¿Qué estados vacío, error, offline y permiso denegado se probaron?
   11. ¿Qué evidencia (CLI/capturas) acompaña el PR?
   12. ¿Qué quedó fuera de alcance y qué riesgo residual permanece?
   ```

---

### ESTRUCTURA DE CADA SPRINT EN EL PLAN MAESTRO:
Para cada Sprint (del S0 al S13), incluye:
1. **Ficha del Sprint:** Código de Ticket, Prioridad, Duración estimada y Brecha que cierra.
2. **Alcance Técnico:** Archivos que toca y archivos que NO toca.
3. **Criterios de Aceptación Medibles.**
4. **Bloque de Código de Prompt para GAIS:** Formateado en Markdown `text` para copiar y pegar con un solo clic.
```

---

© 2026 **Industrial Control 360**. Todos los derechos reservados.
