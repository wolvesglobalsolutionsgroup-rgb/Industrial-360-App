# Ficha Técnica de Funcionalidades — Industrial Control 360

## Visión General
Industrial Control 360 (IC360) es una plataforma SaaS industrial y de ingeniería diseñada para la gestión integral de proyectos EPC, parada de planta, integridad de ductos (O&G), aseguramiento QA/QC de soldadura y cumplimiento de seguridad industrial SIHO-AHO.

---

## Módulos Principales y Capacidad Técnica

### 1. Motor de Integridad de Ductos (API 1163 / ASME B31G / API 570)
- **Evaluación ILI (In-Line Inspection)**: Análisis de anomalías de pérdida de metal y deformación geométrica.
- **Factor de Eficiencia de Presión (ERF)** y **Burst Pressure Ratio ($P_{safe} / P_{ref}$)**.
- **Presets de Campo**: Preset dorado Propanoducto Cardón-Amuay 6" (17.0 km, API 5L Gr. B, MAOP 2126 PSI).
- **Exportación de Informes**: Generación automática de informes PDF técnicos de integridad.

### 2. Valuaciones de Obra ROE y Control Financiero (Multi-Tenant)
- **Ruta de Almacenamiento Multi-Tenant**: `/organizations/{orgId}/projects/{projectId}/valuations/{valuationId}`.
- **Flujo de Firmas Digitales Tripartitas**:
  1. Inspector / Residente de Obra (`Borrador` → `En Revisión`).
  2. Supervisor de Contrato (`En Revisión` → `Aprobada`).
  3. Gerente de Proyecto / Finanzas (`Aprobada` → `Pagada`).
- **Cálculo Automático**: Deducción de amortizaciones de anticipo, retención laboral (5%) y fiel cumplimiento (10%).

### 3. Portal de Cliente y Fiscalización Externa
- **Acceso Directo**: Token de enlace seguro para inspección cliente con revocación y fecha de caducidad.
- **Trazabilidad de Accesos**: Registro de logs en `/organizations/{orgId}/client_portal_access_logs`.
- **Vista Agregada**: Filtrado de tareas, valuaciones, permisos SIHO, juntas de soldadura y dossier compilado por proyecto vinculado.

### 4. Gestión QA/QC de Soldadura y Ensayos No Destructivos (NDT)
- **Trazabilidad de Juntas**: Registro de cupones, soldadores certificados (WPS/PQR), fecha y trazabilidad de tubería.
- **Inspecciones NDT**: Registro de Tintas Penetrantes (PT), Partículas Magnéticas (MT), Ultrasonido (UT) y Radiografía (RT).

### 5. Permisos de Trabajo Seguro (SIHO / PTW)
- **Validación de Riesgos**: Gestión de Permisos de Trabajo Frío / Caliente / Espacio Confinado.
- **Verificación de EPP e Interferencia**: Integración con matrices de riesgo PDVSA y normas internacionales.

---

## Especificaciones de Arquitectura y Seguridad
- **Multi-Tenancy**: Aislamiento estricto por `orgId` y `projectId`.
- **Backend & Server Proxy**: Proxy server-side para llamadas a Google Gemini (`/api/callGeminiProxy`).
- **Persistencia**: Firebase Firestore con `firestore.rules` basados en Custom Claims de usuario (`orgId`, `role`).
