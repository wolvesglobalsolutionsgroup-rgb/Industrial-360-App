# 🏛️ SOLICITUD DE AUDITORÍA GLOBAL Y PLANIFICACIÓN DE FASE 2
## CONSEJO DE EXPERTOS E INTELIGENCIA ARTIFICIAL (AUDITORÍA 360°)

---

**Documento:** Dossier de Presentación y Prompts de Auditoría — CONSEJO DE EXPERTOS  
**Proyecto:** Industrial Control 360 (Industrial OS)  
**Fecha de Emisión:** 31 de Julio de 2026  
**Repositorio Oficial (Única Fuente de Verdad):** `wolvesglobalsolutionsgroup-rgb/Industrial-360-App` (`main @ 65ba164`)  
**Estatus Actual:** Sprints S0 → S13 Completados | Certificación 96/100 Enterprise  

---

## 📋 TABLA DE CONTENIDO

1. [Visión Fundacional y Directivas del Fundador](#1-visión-fundacional-y-directivas-del-fundador)
2. [Estado de Avance Real Full-Stack (S0 → S13)](#2-estado-de-avance-real-full-stack-s0--s13)
3. [Especificación del Plan Maestro 200 — Fase 2 (S15 → S22)](#3-especificación-del-plan-maestro-200--fase-2-s15--s22)
4. [Prompts de Auditoría Especializada por Modelo del Consejo](#4-prompts-de-auditoría-especializada-por-modelo-del-consejo)
   - 4.1 GPT 5.6 Terra Thinking (DevSecOps & Cloud Architecture)
   - 4.2 Claude 5 Sonnet Thinking (UX/UI Design & 12-Question Checklist)
   - 4.3 Qwen 3.8 Max (Real-Time GitHub Code Auditor via MCP)
   - 4.4 MiniMax M3 (Long-Context Technical Ingestion & Multi-Operator Norms)
   - 4.5 Kimi K3 Thinking (Offline Concurrency, Outbox & Rollback Safety)
   - 4.6 GLM 5.2 Thinking (Mathematical & Engineering Formula Auditor)
   - 4.7 Grok 4.5 Thinking (CVE Supply Chain & Live Threat Intelligence)
   - 4.8 NVIDIA Nemotron Ultra 3 (Synthetic Stress Test & Data Generation)
5. [Matriz de Decisión y Próximos Pasos Ejecutivos](#5-matriz-de-decisión-y-próximos-pasos-ejecutivos)

---

## 1. VISIÓN FUNDACIONAL Y DIRECTIVAS DEL FUNDADOR

### A. Principios Inmutables del Proyecto
1. **"No es generar, es CONSTRUIR":** Industrial Control 360 no es una demo ni una plantilla descartable. Se está construyendo un **Sistema Operativo Industrial de alto nivel** diseñado para mantenerse vigente por 50 años o más en Oil & Gas, refinación, petroquímica y obras EPC.
2. **GitHub como Única Fuente de la Verdad:** La rama `main` en GitHub es la referencia autoritativa de código. Google AI Studio (GAIS) se utiliza como el entorno de máxima velocidad de generación debido a la gratuidad e hiper-eficiencia en el uso de tokens.
3. **Estrategia Financiera B2B (Stack Gratuito hasta 10 Clientes):** Toda la arquitectura está diseñada sobre el Tier Gratuito y Pay-as-you-go optimizado de Firebase, Vercel y GitHub Actions. Cero costos fijos de infraestructura hasta haber cerrado los primeros 10 clientes corporativos.
4. **UX/UI World-Class & Friendly:** La aplicación debe ser sumamente amigable, limpia, ultra-organizada y fluida, compitiendo con los estándares de diseño de los mejores software corporativos del mundo.
5. **Rigor Normativo Multi-Operador:** Cumplimiento estricto de PDVSA (SI-S-04), Chevron (CES/CHESM), Repsol (EHS/NORMA), ENI (STEA) y normativas internacionales (ASME B31.3, B31G, API 570, API 1163, COVENIN 2000, CCPP Petrolero LOTTT).

---

## 2. ESTADO DE AVANCE REAL FULL-STACK (S0 → S13)

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ RESUMEN DE COMPILACIÓN Y EVALUACIÓN ENTERPRISE                                         │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ • Compilación TypeScript (npx tsc --noEmit): 0 ERRORES                                 │
 │ • Suite de Pruebas Unitarias (vitest): 13 suite files / 70 tests pasados (100%)       │
 │ • Puntuación de Seguridad & Arquitectura: 96 / 100 ENTERPRISE SOBRESALIENTE            │
 │ • Dictamen: [ X ] APTO PARA PILOTO PROINTECA Y PRODUCCIÓN LIMITADA MULTI-TENANT        │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

### Matriz de Módulos Implementados (S0 → S13):

* **S0 — Test Foundation:** Harness de pruebas para Firebase Emulator (`tests/rules/setup.ts`).
* **S1 / S1.5 — Zero-Trust & Hardening:** Reglas en 19 colecciones (`firestore.rules`) con inmutabilidad estricta en `/users/{userId}` y Cloud Function autoritativa `ensureOwnClaims`.
* **S2 — RBAC JWT:** Autenticación basada 100% en Custom Claims del token JWT (sin dependencia de localStorage o selects vulnerables).
* **S3 — Backend Security:** Proxy seguro Gemini/Resend con rate limiting (20 y 5 req/min) y `storage.rules` multi-tenant.
* **S4 — Hardening Auth:** Gateo configurable del modo demo (`VITE_ENABLE_DEMO_AUTH`).
* **S5 — CI/CD Pipeline:** Hardening de GitHub Actions con Gitleaks, `npm audit` y verificador `tsc`.
* **S6 — Repositories & Regulatory IDs:** Patrón repositorio en 13 módulos e IDs regulatorios atómicos server-side (`functions/src/regulatoryIds.ts`).
* **S7 — XSS & Error Boundary:** Integration de DOMPurify y pantalla de recuperación ante fallos de renderizado.
* **S8 — Engineering Engines:** Consolidador de fórmulas para ASME B31.3, ASME B31G, API 570, API 1163 y PDVSA 906.
* **S9 — Secure Client Portal:** Portal público con token de 32 bytes hasheado en SHA-256 y sello documental backend.
* **S10 — Offline Sync Outbox:** Motor IndexedDB (Dexie.js) con cola de mutaciones idempotentes e ids UUID v4.
* **S11 — Observabilidad:** Sanitización PII en `src/lib/logger.ts` e integración con Sentry.
* **S12 — Dependencias & Perf:** Migración completa de `xlsx` a `exceljs` y `manualChunks` en Vite.
* **S13 — Piloto PROINTECA End-to-End:** Sembrado y simulación del Propanoducto 6" CRP Cardón-Amuay (17 km, 2126 psi, $245k valuación, 3 defectos ILI con Camisa Tipo B).

---

## 3. ESPECIFICACIÓN DEL PLAN MAESTRO 200 — FASE 2 (S15 → S22)

La Fase 2 abarca los Sprints del 15 al 22 documentados en `docs/architecture/PLAN_MAESTRO_200_FASE_2.md`:

1. **S15 (Engine APU & Parser BC3/SIDCON):** Presupuestos tridimensionales, WBS de 5 niveles y parser FIEBDC-3 (.bc3).
2. **S16 (Labor Engine & Tabulador CCPP):** Salario Integral Petrolero, FCMO de 380% a 550% (LOTTT Art 142) y tabuladores salariales.
3. **S17 (Equipment Hourly Cost & Fórmulas Polinómicas):** Costo horario de posesión/operación, mermas de materiales y fórmula polinómica de escalatoria.
4. **S18 (Multi-Operator BrandKit & Dual Header):** Doble membrete dinámico, presets PDVSA/Chevron/Repsol/ENI y QR con sello SHA-256.
5. **S19 (Command Wall TV 4K Dashboard UI):** Layout 6x4 OLED Dark (3840x2160) sin scroll para salas de control en vivo.
6. **S20 (Touch-First Field App & Offline Sync):** Botones 48px+, Sunlight High-Contrast Mode y Service Worker Background Sync.
7. **S21 (Platform Owner Command Center & Monetización):** Dashboard SaaS (MRR, ARR, LTV, CAC), telemetría de storage/tokens y Tiers B2B.
8. **S22 (B2B Marketplace & As-Built Dossier Final):** RFQs de procura automática desde APU y libro de calidad Dossier PDF de 50+ páginas.

---

## 4. PROMPTS DE AUDITORÍA ESPECIALIZADA POR MODELO DEL CONSEJO

Copia y pega cada prompt en la IA correspondiente de tu Consejo de Expertos para obtener sus dictámenes y propuestas de mejora:

---

### 🛡️ 4.1 GPT 5.6 TERRA THINKING (DevSecOps, Backend & Zero-Trust Architecture)

```text
Actúa como Chief Security Architect & DevSecOps Principal. Audita la plataforma Industrial Control 360 (Industrial OS) basada en el repositorio GitHub `wolvesglobalsolutionsgroup-rgb/Industrial-360-App` (rama `main @ 65ba164`).

CONTEXTO DEL PROYECTO:
- Sistema Operativo Industrial para Oil & Gas / EPC en Venezuela y LATAM.
- Backend Serverless en Firebase (Cloud Functions Node 22, Firestore Multi-Tenant, Cloud Storage).
- Estrategia de Costo $0 en Infraestructura hasta alcanzar 10 clientes B2B.

TAREAS DE AUDITORÍA DE SEGURIDAD:
1. Revisa la implementación Zero-Trust en `firestore.rules`:
   - Hardening de /users/{userId} con inmutabilidad de campos de autorización via affectedKeys().
   - Validación autoritativa de Custom Claims en Cloud Function `ensureOwnClaims` mediante /organizations/{orgId}/memberships/{uid}.
   - Cobertura de las 19 colecciones protegidas en collection group queries.
2. Evalúa los proxies serverless `/api/callGeminiProxy` y `/api/sendEmail` en `functions/src/index.ts` (middleware requireAuth, rate limits por IP/UID).
3. Audita la seguridad del Portal Cliente (tokens 32-byte hasheados en SHA-256) y sello documental inmutable.
4. Dictamina si la arquitectura actual es 100% segura para soportar producción multi-tenant sin fugas de datos entre empresas.
```

---

### 🎨 4.2 CLAUDE 5 SONNET THINKING (UX/UI Industrial, Design Systems & Checklist)

```text
Actúa como Principal UX/UI Designer & Design System Lead especializado en software industrial corporativo de primer nivel (estilo Palantir Foundry, Autodesk Construction Cloud, Procore).

CONTEXTO Y DIRECTIVAS DEL FUNDADOR:
- La aplicación debe ser sumamente amigable, ultra-organizada, limpia y fluida.
- Debe soportar 3 entornos visuales:
  1. Sala de Control (TV 4K UHD 3840x2160, OLED Dark #0b0f19, indicadores fluorescentes).
  2. Laptop / Workstation (Full HD / 2K, Datagrid virtualizado de alta densidad, atajos estilo Excel).
  3. Tablets / Móviles Ruggedized de Campo (Touch-First 48px+, Sunlight High-Contrast Mode en blanco/negro puro).

TAREAS DE AUDITORÍA UX/UI Y DISEÑO:
1. Audita el sistema de tokens visuales en `src/index.css` (Tailwind CSS v4 `@theme`) y evalúa su consistencia en los 31 módulos.
2. Revisa la experiencia de usuario en las pantallas complejas (`ApuEstimation.tsx`, `SihoPtw.tsx`, `IntegrityIli.tsx`, `Dashboard.tsx`).
3. Propón mejoras de micro-interacciones, animaciones de carga (skeletons), estados vacíos (empty states) y componentes accesibles.
4. Responde el Auto-Checklist de 12 Preguntas de Calidad Frontend confirmando si el diseño cumple con los estándares corporativos globales.
```

---

### 🔍 4.3 QWEN 3.8 MAX (Auditoría Empírica de Código Real en GitHub vía MCP)

```text
Actúa como Lead Codebase Auditor con acceso a herramientas MCP de GitHub. Tu misión es auditar empíricamente el código REAL en la rama `main` del repositorio `wolvesglobalsolutionsgroup-rgb/Industrial-360-App`.

DIRECTIVAS DE AUDITORÍA:
- NO confíes en resúmenes ni opiniones. Lee directamente los archivos fuente vía MCP.
- Examina la cadena de commits reciente (`0fc73b2`, `65ba164`) y los archivos clave:
  • `firestore.rules` (verificar regla /users y 19 colecciones).
  • `functions/src/index.ts` (verificar ensureOwnClaims y proxies).
  • `src/lib/repositories/` (verificar inyección de orgId en las 13 colecciones).
  • `src/lib/excelExporter.ts` (verificar migración total de xlsx a exceljs).
  • `scripts/seed-prointeca-pilot.ts` (verificar sembrado del piloto PROINTECA).
  • `docs/architecture/PLAN_MAESTRO_200_FASE_2.md` (verificar especificación Fase 2).

RESULTADO ESPERADO:
- Reporta cualquier discrepancia, import roto, o tipo `any` no justificado.
- Emite la calificación numérica de salud del codebase (1 al 100) y confirma si se mantiene el score de 96/100 Enterprise.
```

---

### 🧠 4.4 MINIMAX M3 (Ingesta Normativa Masiva & Adaptabilidad Multi-Operador)

```text
Actúa como Senior Oil & Gas Compliance Specialist & Document Architect. Audita la matriz normativa y la especificación multi-operador de Industrial Control 360 (`docs/architecture/PLAN_MAESTRO_200_FASE_2.md`).

TAREAS DE AUDITORÍA NORMATIVA:
1. Evalúa la matriz de compatibilidad multi-operador para empresas mixtas en Venezuela:
   - **PDVSA:** Permiso de Trabajo SI-S-04, Inspección de Tuberías PI-02-01-01, Formato ROE/AAD.
   - **CHEVRON:** Chevron Environmental & Safety (CES), CHESM, JSA, SWA.
   - **REPSOL:** Repsol EHS Management System, NORMA Repsol.
   - **ENI:** Sistema Técnico de Evaluación y Auditoría (STEA), Eni Safety Golden Rules.
2. Analiza el diseño del Motor de Doble Membrete (Contratista EPC + Empresa Mixta) y la firma digital SHA-256 con Código QR.
3. Dictamina si la estructura de datos propuesta en el BrandKit (`/organizations/{orgId}/settings/brandkit`) cubre todas las necesidades documentales de una licitación u obra petrolera de gran envergadura.
```

---

### 🔗 4.5 KIMI K3 THINKING (Concurrencia Offline, DexieDB Outbox & Rollback Safety)

```text
Actúa como Principal Distributed Systems & Data Integrity Engineer. Audita la arquitectura offline y de sincronización diferida de Industrial Control 360.

TAREAS DE AUDITORÍA DE DATOS E INTEGRIDAD:
1. Revisa el motor offline `src/lib/offline/outbox.ts` y la base de datos local Dexie.js.
2. Evalúa la política de resolución de conflictos por timestamp, generación de UUIDs v4 por mutación y claves de idempotencia para prevenir duplicados al reconectar desde campos petroleros sin 4G.
3. Audita la propuesta del Sprint 20 para el Service Worker Background Sync (`sync-field-reports`).
4. Confirma si el sistema garantiza cero pérdida de reportes de campo, permisos PTS o soldaduras inspeccionadas en condiciones desfavorables de red.
```

---

### 📐 4.6 GLM 5.2 THINKING (Verificación Matemática & Fórmulas de Ingeniería)

```text
Actúa como Principal Mechanical & Cost Engineering Auditor. Tu objetivo es auditar las fórmulas matemáticas y ecuaciones de ingeniería implementadas en el sistema.

TAREAS DE AUDITORÍA NUMÉRICA Y MATEMÁTICA:
1. Audita el consolidador normativo en `src/lib/normEngines.ts`:
   - ASME B31G: Presión máxima de operación admisible (MAOP) y factor Folias en defectos por corrosión.
   - API 570: Cálculo de vida remanente y tasa de corrosión en tuberías de proceso.
   - API 1163 / API 1104: Criterios de aceptación de defectos de inspección interna (ILI) y soldadura.
2. Audita la matemática del Motor de APU (Fase 2 - S15/S16/S17):
   - Salario Integral Petrolero CCPP / LOTTT Art 142 (FCMO 380% - 550%).
   - Costo Horario de Equipos (CHP Posesión + CHO Operación por HP).
   - Fórmula Polinómica de Reajuste de Precios: K = a*(M/M0) + b*(EQ/EQ0) + c*(MO/MO0) + d*(IND/IND0).
3. Confirma la precisión decimal y ausencia de errores de redondeo en valuaciones financieras.
```

---

### 🌐 4.7 GROK 4.5 THINKING (Auditoría de Supply Chain & Inteligencia de Amenazas CVE)

```text
Actúa como Lead Supply Chain Security & Threat Intelligence Auditor. Analiza el árbol de dependencias de Industrial Control 360 (`package.json`, `bun.lock`).

TAREAS DE AUDITORÍA DE CADENA DE SUMINISTRO:
1. Audita la migración completa de `xlsx` a `exceljs` realizada en el Sprint 12 (verificando la eliminación total de vulnerabilidades CVE históricas asociadas a xlsx).
2. Analiza las dependencias de producción (`@sentry/react`, `dompurify`, `dexie`, `pdf-lib`, `leaflet`, `recharts`, `lucide-react`).
3. Evalúa los riesgos de seguridad compensatorios en dependencias de desarrollo.
4. Emite recomendaciones para mantener un pipeline de integración continua con cero vulnerabilidades críticas en producción.
```

---

### ⚡ 4.8 NVIDIA NEMOTRON ULTRA 3 (Generación de Datos Sintéticos & Casos de Estrés)

```text
Actúa como Chief Performance & Stress Testing Engineer. Diseña el plan de pruebas de carga masiva y estrés sintético para la Fase 2 de Industrial Control 360.

TAREAS DE AUDITORÍA DE RENDIMIENTO:
1. Diseña un dataset sintético masivo de prueba:
   - 50,000 partidas WBS de presupuesto APU.
   - 100,000 juntas de soldadura georreferenciadas.
   - 5,000 permisos de trabajo PTS de 6 gases.
   - 10,000 defectos de inspección ILI en oleoductos de 24".
2. Evalúa el comportamiento del Datagrid virtualizado (`@tanstack/react-virtual`) a 60 fps en navegadores de escritorio.
3. Evalúa la capacidad de procesamiento de Cloud Functions e IndexedDB ante ráfagas masivas de sincronización.
```

---

## 5. MATRIZ DE DECISIÓN Y PRÓXIMOS PASOS EJECUTIVOS

1. **Someter los Prompts al Consejo:** Freddy enviará los prompts del punto 4 a las IAs de su Consejo para recopilar sus dictámenes individuales.
2. **Ejecutar Fase 2 (S15 → S22):** Apenas se apruebe el dictamen del Consejo, le entregaremos a Google AI Studio (GAIS) el **Prompt del Sprint 15 (Motor de APU, WBS 5 Niveles y Parser BC3)** para iniciar la construcción.
3. **Mantener la Disciplina de Git:** Ningún código va directo a `main`. Todo se desarrolla en ramas de sprint, se prueba localmente con `tsc` y `vitest`, y se mergea con Pull Request certificado.
