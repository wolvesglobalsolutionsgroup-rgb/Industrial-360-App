# 📘 FICHA TÉCNICA MAESTRA & REPOSITORIO DE RECOMENDACIONES IA

> **Industrial Control 360 (IC360 / Industrial OS)**
> Plataforma Enterprise B2B de Gestión de Ingeniería, Control de Obras, Aseguramiento QA/QC, SIHO-A, Integridad Mecánica y Entregables Normativos (PDVSA / ASME / API / ISO / NACE)
> **Última Actualización:** 2026-07-29 · Estado: Enterprise-Ready Zero-Trust Multi-Tenant

---

## 1. 📌 ESTATUS ACTUAL DEL PROYECTO (Resumen de Salud & Hitos)

| Componente | Estado | Verificación Empírica |
|---|:---:|---|
| **Seguridad Multi-Tenant (`firestore.rules`)** | 🟢 100% Zero-Trust | Custom Claims `orgId`/`role`, Zero-Read overhead, Default Deny catch-all. |
| **Pruebas CI/CD (`src/__tests__/securityRules.test.ts`)** | 🟢 100% Integrado | Firestore Emulator en GitHub Actions con Vitest (4/4 casos de intrusión). |
| **Frontend 13/13 Módulos Multi-tenant** | 🟢 100% Migrado | Rutas segregadas `/organizations/{orgId}/projects/{projId}/...`. |
| **Compilación & Lint (`tsc --noEmit`)** | 🟢 0 Errores | `npm run lint` pasa en verde sin advertencias. |
| **Build de Producción (`vite build`)** | 🟢 100% Exitoso | 4,120+ módulos transformados en 29.5s (`dist/` generado). |
| **Ingesta de Custom Claims** | 🟢 Completado | `scripts/migrate-existing-user-claims.ts` con `revokeRefreshTokens`. |

---

## 2. 🧩 DESGLOSE DE FUNCIONALIDADES EXISTENTES vs. MEJORAS PLANIFICADAS

### 🏢 Módulo A: Seguridad Industrial, Permisología y SIHO-A
- **Estado Actual:** Permisos PTW en frío/caliente, Análisis de Riesgos (ART), LOTO (PDVSA SI-S-28) y MOC (PDVSA IR-S-06).
- **Mejora Planificada:** Carnet QR Inteligente para trabajadores de campo (escaneo rápido en casco/carnet con validación de inducción SIHO, exámenes médicos y estampa WPQ).

### 📐 Módulo B: Calidad, Soldadura QA/QC e Integridad Mecánica
- **Estado Actual:** Trazabilidad de juntas, calificación WPS/PQR, NDT (Radiografía, Ultrasonido), motores ASME B31.3, ASME B31G, API 570, API 1163, PDVSA 906, ASME B16.5.
- **Mejora Planificada:** Trazabilidad de Materiales por Número de Colada (MTR / Heat Numbers) vinculando coladas de tubos/bridas a juntas soldadas.

### 🚜 Módulo C: Control de Campo, Geolocalización & Modo Offline
- **Estado Actual:** Partes diarios en `FieldReports.tsx`, Leaflet, Turf.js, exportador KML, almacenamiento offline en Dexie.ts (IndexedDB) con cola `syncEngine.ts`.
- **Mejora Planificada:** Ingesta de Voz "Voice-to-JSON" (Web Speech API nativa + Gemini 2.5 Flash) para dictado de inspecciones con sol y guantes en campo ($0 costo).

### 💰 Módulo D: Costos, Valuaciones ROE & Contratos
- **Estado Actual:** Categorización PDVSA L-STC-001 (9 rubros), OCR de facturas con Gemini, Certificados de Valuación ROE, amortización de anticipo y retenciones de fiel cumplimiento.
- **Mejora Planificada:** Bitácora de Tiempos Muertos & Reclamos Financieros (Stand-by Claims / Extension of Time EOT) por demoras en permisos o entregas del cliente.

### 📚 Módulo E: Compilador de Dossier & Codificación Normada
- **Estado Actual:** Motor de codificación PDVSA PIC-01-03-05 (`AABBCCDDEE-FFGHI-JKLLMMM`), Portada Oficial Anexo A, firmas digitales y hash criptográfico SHA-256 (`DossierCompiler.tsx`).
- **Mejora Planificada:** Visor de Isométricos SVG / Hotspotting Visual de Juntas NDT (cambio de color en vivo: rojo=pendiente, amarillo=soldado, verde=NDT aprobado).

---

## 3. 🤖 ESPACIO DE RECOMENDACIONES & AUDITORÍA PARA MODELOS DE IA

> **INSTRUCCIONES PARA AGENTES DE IA (Gemini, Qwen, Claude, GPT, DeepSeek, etc.):**
> Cuando analices este repositorio, lee esta sección y añade tus recomendaciones de arquitectura, optimización de código, nuevas normas o refactorizaciones sugeridas siguiendo el formato estándar.

### 💡 Registro de Recomendaciones de IA:

#### 🟢 [2026-07-29] Recomendación de Antigravity AI (Arquitecto Principal):
- **Área:** Visor de Isométricos & Spool Tracking (`src/components/mechanical/SmartIsometricViewer.tsx`).
- **Detalle:** Renderizar gráficos SVG interactivos donde cada junta sea un elemento `<circle>` con atributos `data-joint-id`. Al hacer clic, desplegar el modal de inspección NDT y actualizar en vivo el estado en IndexedDB y Firestore.
- **Impacto:** Cero alucinación, 100% interactividad visual client-side.

#### 🟡 [2026-07-29] Recomendación de Qwen (Orquestador / Auditor):
- **Área:** Conector de Auto-RFQ para WBS (`src/lib/marketplaceConnector.ts`).
- **Detalle:** Extraer automáticamente la lista de materiales (BOM) de la WBS del proyecto y generar archivos JSON formateados para cotización instantánea con distribuidores de acero/bridas.
- **Impacto:** Conecta el software de obra con el Marketplace B2B.

#### 🔵 [2026-07-29] Recomendación de Hermes (Bibliotecario Normativo):
- **Área:** Ingesta de Criterios de Aceptación API 510 / ASME B31.4 / B31.8.
- **Detalle:** Estructurar las tablas de espesores mínimos y presiones máximas de operación (MAOP) para recipientes a presión y gasoductos en `src/lib/norms/`.
- **Impacto:** Expansión multidisciplinaria completa.

---

## 4. 🗺️ HOJA DE RUTA DE PRÓXIMOS SPRINTS (Para Ejecución en Google AI Studio)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SPRINT 5 (IC360-009) ──► Diferenciador Normativo API 1163 (Propanoducto Cardón)│
│ SPRINT 6 (IC360-010) ──► Ingesta Voice-to-JSON en Campo & Visor SVG Juntas  │
│ SPRINT 7 (IC360-011) ──► Trazabilidad de Coladas MTR & Reclamos EOT/Standby │
│ SPRINT 8 (IC360-012) ──► Auto-RFQ Marketplace & Carnet QR Inteligente       │
└─────────────────────────────────────────────────────────────────────────────┘
```
