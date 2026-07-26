# 🏛️ ROADMAP MAESTRO — Industrial Control 360
## Enterprise Operating System para la Industria O&G

> **Versión:** 1.0 | **Fecha:** 2026-07-25 | **Estado:** En Ejecución
> 
> Este documento es la única fuente de verdad del proyecto. Cada ítem tiene su Issue de GitHub correspondiente.

---

## 📊 Estado Actual del Código (Línea Base)

| Dimensión | Estado | Detalle |
|---|---|---|
| Líneas de código | ~10,600 | 30 pantallas en `src/pages/` |
| Stack | React 19 + TS + Vite 6 + Tailwind v4 | SPA pura, sin SSR |
| Firebase activo | Auth + Firestore | Storage y Cloud Functions = 0 |
| Multi-tenancy | ❌ No existe | Colecciones planas en raíz |
| Tests | ❌ 0 archivos | Sin CI/CD |
| Seguridad IA | 🔴 CRÍTICO | API key Gemini expuesta en bundle JS |
| Commit history | 1 commit | Generado en AI Studio |

---

## 🗺️ VISIÓN DE FASES

```
FASE 0 ──► FASE 1 ──► FASE 2 ──► FASE 3 ──► FASE 4 ──► FASE 5
Sanear     Cimientos   Motores   Diferen-   PWA+IA    Enterprise
Seguridad  Multi-      Reales    ciadores   Offline   Production
(2 sem)    Tenancy     de Datos  Únicos     First     Launch
           (5 sem)     (8 sem)   (10 sem)   (5 sem)   (4 sem)
```

**Timeline total estimado: 34 semanas (~8 meses) trabajo enfocado solo → producción enterprise**

---

## 🚨 FASE 0 — Saneamiento Crítico
### Duración: 2 semanas | Rama: `phase-0/security-foundation`
### Hito: Ningún secreto expuesto, repo listo para colaboradores

### Problemas Bloqueantes (no negociables antes de cualquier otra cosa)

- [ ] **[SEC-001]** `vite.config.ts` — Eliminar `define: { 'process.env.GEMINI_API_KEY': ... }` que hornea la API key en el bundle público
- [ ] **[SEC-002]** Crear `functions/` con proxy seguro de Gemini (key en Google Secret Manager via Cloud Functions)
- [ ] **[SEC-003]** Rotar la API key de Gemini expuesta actualmente y nunca volver a ponerla en código del cliente
- [ ] **[SEC-004]** `firebase-applet-config.json` — Verificar que no contenga secrets (solo config pública de Firebase está OK)
- [ ] **[INF-001]** Crear `.github/workflows/ci.yml` — Pipeline CI mínimo: `tsc --noEmit` + lint en cada PR
- [ ] **[INF-002]** `Login.tsx` — Renombrar "ObraSync" → "Industrial Control 360" en la primera pantalla
- [ ] **[INF-003]** Activar Firebase Storage en consola y conectar `firebase.ts` con `getStorage()`
- [ ] **[INF-004]** Agregar `firebase/storage` a `src/firebase.ts` y exportar instancia
- [ ] **[DOC-001]** Crear este `ROADMAP.md` como fuente de verdad del proyecto ✅
- [ ] **[DOC-002]** Crear `ARCHITECTURE.md` — Decisiones de arquitectura documentadas

### Entregables de Fase 0
- ✅ Ningún secret en el frontend
- ✅ CI/CD activo — cada PR tiene validación automática
- ✅ Firebase Storage operativo
- ✅ Login muestra nombre correcto del producto

---

## 🏗️ FASE 1 — Cimientos: Multi-Tenancy y Roles
### Duración: 5 semanas | Rama: `phase-1/multi-tenancy`
### Hito: Dos empresas pueden usar el sistema sin que sus datos se mezclen

### Módulo 1.1 — Arquitectura Multi-Tenant de Firestore

- [ ] **[MT-001]** Migrar schema Firestore de colecciones planas → jerarquía `/organizations/{orgId}/projects/{projId}/...`
- [ ] **[MT-002]** Crear script de migración de datos existentes (`scripts/migrate-to-multitenant.ts`)
- [ ] **[MT-003]** Actualizar `firestore.rules` con el nuevo modelo de tenancy
- [ ] **[MT-004]** Definir y documentar todos los paths de colecciones:
  ```
  /organizations/{orgId}/
    metadata → nombre, RIF, plan, brandKit
    /projects/{projId}/
      metadata, tasks, siho_ptw, weld_joints,
      documents, valuations, expenses, inventory,
      fleet, ili_anomalies, engineering_calcs
    /users/{userId} → role, assignedProjects[]
    /invitations/{inviteId}
  ```

### Módulo 1.2 — Sistema de 6 Roles

- [ ] **[ROL-001]** Definir interface `UserRole` en TypeScript: `superadmin | gerente | supervisor | inspector | campo | cliente_readonly`
- [ ] **[ROL-002]** `ProjectContext.tsx` — Agregar `currentOrganization`, `userRole`, `viewMode` al contexto global
- [ ] **[ROL-003]** `App.tsx` — Implementar `<ProtectedRoute allowedRoles={[...]}>` para cada módulo
- [ ] **[ROL-004]** Matriz de permisos por rol:
  ```
  superadmin:        TODO
  gerente:           TODO excepto superadmin settings
  supervisor:        Proyectos asignados + SIHO + QA/QC + Reportes
  inspector:         Solo proyectos asignados, SIN costos/valuaciones
  campo:             SIHO PTW + QA/QC + Reportes de campo (offline)
  cliente_readonly:  Dashboard resumen + Documentos + Dossier (solo lectura)
  ```
- [ ] **[ROL-005]** `firestore.rules` — Implementar reglas por rol con el nuevo schema
- [ ] **[ROL-006]** Remover el superadmin hardcodeado por email en `firestore.rules`

### Módulo 1.3 — Onboarding de Organización

- [ ] **[ONB-001]** Crear página `/onboarding` — Flujo de creación de nueva organización
- [ ] **[ONB-002]** Crear página `/invite` — Invitación de usuarios con link + rol asignado
- [ ] **[ONB-003]** `Login.tsx` — Agregar selector de organización post-autenticación
- [ ] **[ONB-004]** Cloud Function `onUserCreate` — Trigger que crea el documento de usuario al registrarse

### Módulo 1.4 — Layout y Navegación por Rol

- [ ] **[NAV-001]** `Layout.tsx` — Filtrar menú lateral según `userRole` del contexto
- [ ] **[NAV-002]** `Layout.tsx` — Agregar selector "🏢 Portafolio Corporativo" para gerente/superadmin
- [ ] **[NAV-003]** `Layout.tsx` — Mostrar nombre de la organización activa en la barra superior

### Entregables de Fase 1
- ✅ 2 usuarios de distintas empresas: sus datos no se mezclan
- ✅ inspector no puede ver valuaciones ni módulo de costos
- ✅ Organización nueva puede registrarse y agregar su primer proyecto
- ✅ Firestore rules pasan todos los tests del emulador local

---

## ⚙️ FASE 2 — Motores Reales de Datos
### Duración: 8 semanas | Rama: `phase-2/real-data-engines`
### Hito: Todos los módulos CRUD usan datos reales de Firestore/Storage, cero mock data

### Módulo 2.1 — Dashboard KPIs Reales

- [ ] **[DSH-001]** Reemplazar `progressData` hardcodeado → query agregada real desde `tasks` ponderadas
- [ ] **[DSH-002]** Reemplazar `budgetData` hardcodeado → suma real de `expenses` vs `valuations` por período
- [ ] **[DSH-003]** KPI HHT (Horas Hombre Sin Accidentes) → contar días desde último incidente en `siho_ptw`
- [ ] **[DSH-004]** KPI Tasa de Rechazo de Soldadura → `weld_joints` where `ndtResult === 'Rechazada'` / total
- [ ] **[DSH-005]** KPI Valuaciones por Cobrar → `valuations` where `status === 'Presentada'` suma real
- [ ] **[DSH-006]** Vista "Portafolio Corporativo" → agregar KPIs de TODOS los proyectos de la organización
- [ ] **[DSH-007]** Widget Curva S → calcular avance planificado vs real por semana desde fechas de tareas

### Módulo 2.2 — Documents + Firebase Storage Real

- [ ] **[DOC-010]** `Documents.tsx` — Implementar upload real a `Firebase Storage` con progress bar
- [ ] **[DOC-011]** Path de storage: `organizations/{orgId}/projects/{projId}/docs/{uuid}_{filename}`
- [ ] **[DOC-012]** Generar `downloadURL` segura y guardarla en Firestore junto a metadatos
- [ ] **[DOC-013]** Preview inline de PDFs en el navegador usando la URL de Storage
- [ ] **[DOC-014]** Control de versiones: al resubir el mismo plano, guardar versión anterior en `/revisions/`
- [ ] **[DOC-015]** Etiquetas de categoría: Planos, Permisos, Certificados, Contratos, Reportes

### Módulo 2.3 — SIHO/PTW Motor Completo

- [ ] **[PTW-001]** Firma digital SHA-256 → hash del contenido del PTS al momento de la firma
- [ ] **[PTW-002]** `functions/src/expirePermits.ts` — Cloud Function programada: expirar PTS vencidos cada 60 min
- [ ] **[PTW-003]** Export PDF del PTS con `pdf-lib`: número, participantes, datos atmosféricos, firmas, membrete
- [ ] **[PTW-004]** Adjuntar foto del gasómetro al PTS desde cámara móvil → Firebase Storage
- [ ] **[PTW-005]** Notificación push cuando un PTS está por vencer (30 min antes)
- [ ] **[PTW-006]** Panel de PTS activos en tiempo real con `onSnapshot` + semáforo visual

### Módulo 2.4 — QA/QC Soldadura Motor Completo

- [ ] **[QAC-001]** Correlativo real de juntas: `{isometrico}-{numero.padStart(3,'0')}` → quitar `Math.random()`
- [ ] **[QAC-002]** Alerta automática WPQ vencido: comparar `weldDate` vs `wpqExpirationDate`
- [ ] **[QAC-003]** Cálculo automático NDT requerido según ASME B31.3 basado en categoría de junta
- [ ] **[QAC-004]** Registro fotográfico por junta → Firebase Storage, foto de identificación y resultado NDT
- [ ] **[QAC-005]** Reporte de soldadura en PDF por isométrico (listado de juntas con status)
- [ ] **[QAC-006]** Dashboard de rechazo: ratio de reparación por soldador, por procedimiento WPS

### Módulo 2.5 — Valuaciones Fórmula ROE Real

- [ ] **[VAL-001]** Conectar partidas activas del proyecto como base del cálculo
- [ ] **[VAL-002]** Implementar fórmula real: `montoBruto = Σ(avance% × precioUnitario × metrado)`
- [ ] **[VAL-003]** Deducciones legales configurables: `retencionFielCumplimiento (10%)` + `retencionLaboral (5%)`
- [ ] **[VAL-004]** Deducción de anticipo configurable por contrato
- [ ] **[VAL-005]** Export PDF de valuación con membrete corporativo (Kit de Marca)
- [ ] **[VAL-006]** Workflow de aprobación: `borrador → presentada → aprobada → cobrada`
- [ ] **[VAL-007]** Fórmula de escalación polinómica (ajuste por índices de precios)

### Módulo 2.6 — Engineering Tools: Persistencia y PDF

- [ ] **[ENG-001]** Persistir cada cálculo en `organizations/{orgId}/projects/{projId}/engineering_calcs/`
- [ ] **[ENG-002]** Historial de cálculos por proyecto: listado con fecha, tipo, autor, resultado
- [ ] **[ENG-003]** Export PDF individual de cada cálculo con membrete de empresa
- [ ] **[ENG-004]** Arreglar bug del selector ANSI (150# a 2500#) en la calculadora de bridas
- [ ] **[ENG-005]** Agregar tabs 9-12: Coeficiente de expansión térmica, Análisis de flexibilidad básico, MAWP API 579, Dilatación de tuberías

### Módulo 2.7 — Settings: Kit de Marca Corporativo

- [ ] **[SET-001]** Pestaña "Kit de Marca": upload de logo a Firebase Storage
- [ ] **[SET-002]** Campos: nombre legal, RIF/NIT, dirección, teléfono, email corporativo
- [ ] **[SET-003]** Colores primario y secundario de marca → aplicar a todos los PDFs
- [ ] **[SET-004]** Firma autorizada: upload de imagen de firma digitalizada
- [ ] **[SET-005]** Preview en tiempo real del membrete que se aplicará a los documentos
- [ ] **[SET-006]** Membrete automático en: PDFs de PTS, Valuaciones, Cálculos, Dossier

### Módulo 2.8 — Tareas, Gastos, Inventario, Flota

- [ ] **[TSK-001]** `Tasks.tsx` — Agregar Gantt básico con dependencias entre tareas
- [ ] **[TSK-002]** Calcular ruta crítica (CPM básico) sobre las actividades del proyecto
- [ ] **[TSK-003]** `Budget.tsx` — Curva S financiera: presupuesto comprometido vs ejecutado por semana
- [ ] **[TSK-004]** Indicadores SPI (Schedule Performance Index) y CPI (Cost Performance Index)
- [ ] **[INV-001]** `Inventory.tsx` — Alertas de stock mínimo con Cloud Function
- [ ] **[FLT-001]** `Fleet.tsx` — Alertas de mantenimiento preventivo por km/horas

### Entregables de Fase 2
- ✅ Subir un PDF real en Documents y obtener URL de Storage funcional
- ✅ Dashboard muestra KPIs calculados desde Firestore, no arrays hardcodeados
- ✅ PTS firmado tiene hash SHA-256 verificable
- ✅ Valuación calcula correctamente con retenciones 10%+5%
- ✅ Cálculo de Engineering Tools se guarda y se puede exportar como PDF

---

## 🚀 FASE 3 — Diferenciadores Únicos (Los Que Venden)
### Duración: 10 semanas | Rama: `phase-3/differentiators`
### Hito: Al menos UN diferenciador funciona de punta a punta con datos reales

### Módulo 3.1 — Parser Real Primavera P6 (Diferenciador A — RECOMENDADO)

> **Por qué primero:** Formato `.xer` es texto plano delimitado por tabs, parser posible en ~200 líneas. Es el formato estándar de PDVSA y todas sus contratistas. No existe otro sistema en Venezuela que lo integre nativamente.

- [ ] **[P6-001]** Crear `src/lib/parsers/xerParser.ts` — Parser completo del formato `.xer` de Primavera P6
- [ ] **[P6-002]** Mapear secciones `TASK`, `PROJWBS`, `TASKPRED` → interface `P6Activity[]`
- [ ] **[P6-003]** `InteroperabilityEngine.tsx` — Reemplazar `handleSimulateScheduleImport()` con parser real
- [ ] **[P6-004]** Import de cronograma P6 → crear `tasks` en Firestore con WBS, fechas, relaciones
- [ ] **[P6-005]** Resync bidireccional: exportar avances registrados en IC360 de vuelta a formato `.xer`
- [ ] **[P6-006]** Visualización de Gantt importado con react-gantt o similar
- [ ] **[P6-007]** (Fase 3.5) Parser de `.bc3` Presto: presupuesto → partidas del proyecto

### Módulo 3.2 — Dossier As-Built Compilado en PDF (Diferenciador B)

> **Por qué crítico:** Es el producto de cierre de obra. Con pdf-lib ya instalado y Storage operativo (Fase 2), la compilación real es técnicamente directa.

- [ ] **[DOS-001]** Reemplazar las 8 secciones hardcodeadas `status: 'Completo'` por verificación real de datos existentes
- [ ] **[DOS-002]** `DossierCompiler.tsx` — Sección 1: Portada con Kit de Marca (logo, nombre proyecto, fechas)
- [ ] **[DOS-003]** Sección 2: Índice automático con números de página calculados
- [ ] **[DOS-004]** Sección 3: Registros de calidad — juntas de soldadura de `weld_joints` donde `ndtResult !== 'Pendiente'`
- [ ] **[DOS-005]** Sección 4: Permisos de trabajo — todos los PTS cerrados de `siho_ptw`
- [ ] **[DOS-006]** Sección 5: Documentos técnicos — PDFs embebidos desde Firebase Storage
- [ ] **[DOS-007]** Sección 6: Cálculos de ingeniería — reportes PDF de `engineering_calcs`
- [ ] **[DOS-008]** Sección 7: Valuaciones aprobadas — resumen financiero del proyecto
- [ ] **[DOS-009]** Sección 8: Hash SHA-256 del PDF final → certificado de inmutabilidad en Firestore
- [ ] **[DOS-010]** Upload del dossier compilado a Firebase Storage → URL permanente para el cliente
- [ ] **[DOS-011]** Indicador de completitud: % de secciones con datos reales antes de compilar

### Módulo 3.3 — Project Brain RAG Real (Diferenciador C)

- [ ] **[RAG-001]** Cloud Function `geminiProxy` — recibe query + projectId, jala contexto real de Firestore
- [ ] **[RAG-002]** `buildProjectContext()` — agrega NCRs, PTS, juntas, presupuesto, alertas activas del proyecto
- [ ] **[RAG-003]** Usar Gemini 1.5 Pro 1M token context → inyectar contexto completo sin vector store (fase inicial)
- [ ] **[RAG-004]** `Chatbot.tsx` — Conectar al Cloud Function proxy en lugar de llamada directa del navegador
- [ ] **[RAG-005]** Respuestas contextuales: "¿Cuántas juntas rechazadas tiene el isométrico ISO-003?" → dato real
- [ ] **[RAG-006]** (Fase 3.5) Embeddings + Qdrant/Pinecone para RAG sobre documentos de Storage (PDFs, planos)

### Módulo 3.4 — Integrity ILI: Importación Real de Anomalías

- [ ] **[ILI-001]** Reemplazar generación `Math.random()` de anomalías por importación real de Excel/CSV
- [ ] **[ILI-002]** Template CSV estándar PII (Pipeline Inspection International) para field reports
- [ ] **[ILI-003]** La calculadora `calculateB31G()` (ya real) conectada a las anomalías importadas reales
- [ ] **[ILI-004]** Priorización de excavación basada en POF calculado real
- [ ] **[ILI-005]** Export del reporte ILI en PDF con membrete de empresa

### Entregables de Fase 3
- ✅ Importar un `.xer` real de Primavera P6 y ver el cronograma en IC360
- ✅ Compilar un dossier PDF que incluya documentos reales de Storage
- ✅ Preguntarle al Project Brain: "¿Cuál es el avance real del proyecto?" y recibir dato real
- ✅ Importar reporte de anomalías ILI desde Excel y ver el resultado en la calculadora B31G

---

## 📱 FASE 4 — PWA Offline-First e IA Enterprise
### Duración: 5 semanas | Rama: `phase-4/pwa-ai-enterprise`
### Hito: Inspector en campo sin 4G puede registrar datos que sincronizan al reconectar

### Módulo 4.1 — PWA Offline-First

- [ ] **[PWA-001]** `vite.config.ts` — Instalar y configurar `vite-plugin-pwa` con Workbox
- [ ] **[PWA-002]** Service Worker estrategia `NetworkFirst` para Firestore queries
- [ ] **[PWA-003]** Service Worker estrategia `CacheFirst` para assets estáticos (logo, CSS, JS)
- [ ] **[PWA-004]** Cola de escritura offline con IndexedDB: PTS, juntas, reportes creados sin conexión
- [ ] **[PWA-005]** Sync automático al recuperar conexión: flush de IndexedDB → Firestore
- [ ] **[PWA-006]** Indicador visual de estado de conectividad en el Layout
- [ ] **[PWA-007]** Manifest PWA: icono, nombre, colores de la app → instalable desde móvil
- [ ] **[PWA-008]** `manifest.json` configurable por organización (white-label)

### Módulo 4.2 — Chatbot con Voz

- [ ] **[VOZ-001]** `VoiceCommand.tsx` — Web Speech API para entrada de voz en campo (manos libres)
- [ ] **[VOZ-002]** Comandos de voz para: "crear PTS", "registrar junta", "reportar incidente"
- [ ] **[VOZ-003]** Text-to-speech para respuestas del Project Brain en campo

### Módulo 4.3 — Notificaciones Push

- [ ] **[NOT-001]** Firebase Cloud Messaging (FCM) — setup inicial
- [ ] **[NOT-002]** Cloud Function que envía push al supervisor cuando PTS vence
- [ ] **[NOT-003]** Push cuando valuación es aprobada por el cliente
- [ ] **[NOT-004]** Alerta de WPQ por vencer (7 días antes)

### Entregables de Fase 4
- ✅ App instalable desde Chrome móvil como PWA
- ✅ Inspector crea PTS offline, se sube al conectar a WiFi
- ✅ Supervisor recibe push cuando PTS está por vencer

---

## 🏢 FASE 5 — Portal Cliente y Lanzamiento Enterprise
### Duración: 4 semanas | Rama: `phase-5/enterprise-launch`
### Hito: Primer cliente real pagante en producción

### Módulo 5.1 — Portal Cliente (White-Label)

- [ ] **[CLI-001]** Ruta `/portal` — Vista exclusiva para rol `cliente_readonly`
- [ ] **[CLI-002]** Dashboard simplificado: solo avance, fotos, documentos, dossier — SIN costos internos
- [ ] **[CLI-003]** Aprobación de valuaciones con un clic desde el portal
- [ ] **[CLI-004]** Membrete y colores del cliente (white-label por organización)
- [ ] **[CLI-005]** Acceso por link directo sin necesidad de conocer la URL raíz

### Módulo 5.2 — Seguridad Enterprise

- [ ] **[SEC-010]** Auditoría de acceso: loggear en Firestore quién vio qué y cuándo
- [ ] **[SEC-011]** `firestore.rules` — Test suite completa con Firebase Emulator (>50 casos)
- [ ] **[SEC-012]** Rate limiting en Cloud Functions para prevenir abuso de la API de Gemini
- [ ] **[SEC-013]** Backup automático de Firestore programado (Cloud Scheduler)
- [ ] **[SEC-014]** HTTPS forzado + headers de seguridad en el hosting (Vercel/Firebase Hosting)

### Módulo 5.3 — CI/CD Completo

- [ ] **[CID-001]** `.github/workflows/ci.yml` — Build + TypeScript check en cada PR
- [ ] **[CID-002]** `.github/workflows/deploy-staging.yml` — Deploy automático a staging en merge a `develop`
- [ ] **[CID-003]** `.github/workflows/deploy-production.yml` — Deploy a producción en merge a `main` con aprobación manual
- [ ] **[CID-004]** Vitest para unit tests de las funciones de cálculo críticas (Barlow, B31G, ROE)

### Módulo 5.4 — Piloto Prointeca

- [ ] **[PIL-001]** Onboarding de Prointeca como primera organización en producción
- [ ] **[PIL-002]** Migrar datos de prueba al schema multi-tenant de producción
- [ ] **[PIL-003]** Capacitación del equipo de campo en SIHO PTW + QA/QC
- [ ] **[PIL-004]** Recolectar feedback de las primeras 4 semanas de uso real
- [ ] **[PIL-005]** Roadmap v2.0 basado en feedback del piloto

### Entregables de Fase 5 (= v1.0 Enterprise)
- ✅ Cliente real usando el sistema en producción
- ✅ Dossier As-Built compilado para el primer proyecto real
- ✅ Cero API keys expuestas, Firestore rules probadas
- ✅ CI/CD activo: cada commit pasa por validación automática

---

## 🔮 FASE 6+ — Expansión Post-Tracción (Post v1.0)
### Solo ejecutar después del primer cliente pagante

- [ ] **[EXP-001]** Parser real `.mpp` de MS Project (requiere librería de terceros)
- [ ] **[EXP-002]** BIM Viewer IFC real con Autodesk Platform Services (APS/Forge)
- [ ] **[EXP-003]** Vínculo 4D: actividades del cronograma + modelo 3D
- [ ] **[EXP-004]** Integración SAP PM — sincronización de órdenes de trabajo
- [ ] **[EXP-005]** Integración Oracle Primavera Cloud (API REST oficial)
- [ ] **[EXP-006]** RAG con embeddings reales: Qdrant/Pinecone + Gemini sobre PDFs y planos
- [ ] **[EXP-007]** Export DICONDE para radiografías digitales de soldadura
- [ ] **[EXP-008]** GIS: mapa de trazado de tuberías + anomalías ILI georreferenciadas
- [ ] **[EXP-009]** App nativa React Native para iOS/Android (post-PWA)
- [ ] **[EXP-010]** Módulo de licitaciones y concursos de precios

---

## 📅 TIMELINE CONSOLIDADO

| Fase | Semanas | Hito Principal | Estado |
|---|---|---|---|
| **Fase 0** — Seguridad | Sem 1-2 | Ningún secret expuesto, CI activo | 🔴 Pendiente |
| **Fase 1** — Multi-Tenancy | Sem 3-7 | 2 empresas, datos aislados, 6 roles | 🔴 Pendiente |
| **Fase 2** — Datos Reales | Sem 8-15 | Cero mock data, Storage real, KPIs reales | 🔴 Pendiente |
| **Fase 3** — Diferenciadores | Sem 16-25 | Parser P6 + Dossier PDF + RAG real | 🔴 Pendiente |
| **Fase 4** — PWA + IA | Sem 26-30 | App offline, voz, push notifications | 🔴 Pendiente |
| **Fase 5** — Enterprise Launch | Sem 31-34 | Primer cliente pagante en producción | 🔴 Pendiente |
| **Fase 6+** — Expansión | Post Sem 34 | BIM, SAP, Oracle, GIS | 🔲 Backlog |

---

## 🛡️ DECISIONES DE ARQUITECTURA (ADRs)

### ADR-001: Multi-tenant desde el inicio (NO mono-tenant)
**Decisión:** Migrar a `/organizations/{orgId}/...` en Fase 1, antes de tener clientes reales.
**Razón:** Migrar con datos reales de múltiples clientes es exponencialmente más costoso. El costo ahora es 3-5 días. Después puede ser semanas.

### ADR-002: IA del lado del servidor (Cloud Functions), nunca del navegador
**Decisión:** Todas las llamadas a Gemini pasan por Cloud Functions.
**Razón:** Seguridad (keys server-side), RAG real posible, rate limiting, logging.

### ADR-003: Un diferenciador real antes que seis simulados
**Decisión:** Fase 3 ejecuta P6 parser, Dossier PDF, y RAG en ese orden de prioridad.
**Razón:** Un `.xer` parser real que funciona es más valioso para vender que seis simulaciones.

### ADR-004: PDF generado con `pdf-lib` (ya instalado)
**Decisión:** Usar `pdf-lib` para todos los PDFs del sistema (PTS, Valuaciones, Dossier, Cálculos).
**Razón:** Ya está en `package.json`. `jsPDF` también disponible como fallback.

### ADR-005: Firebase Storage paths con UUID
**Decisión:** Path: `organizations/{orgId}/projects/{projId}/{colección}/{uuid}_{filename}`
**Razón:** Evitar colisiones de nombres, trazabilidad, compatible con Firestore security rules.

---

## 🔗 Issues de GitHub

Cada `[CÓDIGO]` en este documento corresponde a un Issue creado en:
**https://github.com/wolvesglobalsolutionsgroup-rgb/Industrial-360-App/issues**

Labels usados:
- `fase-0` `fase-1` `fase-2` `fase-3` `fase-4` `fase-5`
- `bloqueante` `seguridad` `backend` `frontend` `infra` `differentiator`
- `modulo:siho` `modulo:qaqc` `modulo:dashboard` `modulo:dossier` `modulo:engineering` `modulo:pwa`

---

*Última actualización: 2026-07-25 | Mantenido por: Wolves Global Solutions Group*
