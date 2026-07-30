# 🏭 Industrial Control 360 (IC360)

**Plataforma Enterprise Multi-Tenant para Control de Obras, Supervisión EPC y Gobernanza Técnica en Oil & Gas e Industria Heavy-Duty**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth%20%7C%20Rules-FFCA28.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()
[![Compliance](https://img.shields.io/badge/PDVSA-L--STC--001%20%7C%20SIHO--A-green.svg)]()

Industrial Control 360 (IC360) es una solución tecnológica integral de grado industrial diseñada para contratistas, empresas mixtas y operadoras petroleras (PDVSA, Chevron, Repsol, Eni). Digitaliza y automatiza el ciclo de vida completo de un proyecto EPC: desde la estimación de costos y permisos de trabajo hasta el seguimiento de soldadura NDT, valuaciones contractuales y compilación del Dossier de Calidad As-Built.

---

## 🌟 Arquitectura de 31 Módulos Especializados

La plataforma se organiza en 7 grandes disciplinas industriales accesibles mediante una interfaz dinámica de alta fidelidad:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             SUITE MULTIDISCIPLINAR DE IC360                              │
├──────────────────┬───────────────────────────────────────────────────────────────────────┤
│ DISCIPLINA       │ MÓDULOS E INTEGRACIONES CLAVE                                         │
├──────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 1. SIHO-A & HSE  │ • Permisos de Trabajo PTW (6 Gases, Caliente, Confinado) (PDVSA SI-S-04)│
│                  │ • Análisis de Riesgo del Trabajo ART / AST (PDVSA HO-H-02)            │
│                  │ • Control LOTO Aislamiento Energético (PDVSA SI-S-28)                 │
│                  │ • Registro de Trabajadores y Carnets QR VIP                           │
├──────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 2. QA/QC & NDT   │ • Trazabilidad de Soldaduras e Isométricos DXF/SVG (API 1104, ASME B31.3)│
│                  │ • Inspección E&I Lazos de Control (PDVSA K-301 / ISA 5.1)             │
│                  │ • Ensayos Civiles y Densidad de Campo (COVENIN 2000-92 / ASTM D1556)  │
│                  │ • Dossier Compiler As-Built Automatizado (PDVSA L-STC-001)            │
├──────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 3. INGENIERÍA    │ • Calculadoras Técnicas (ASME B31G, API 570, API 1163, API 650/653)   │
│                  │ • Inspección de Integridad ILI (In-Line Inspection)                   │
│                  │ • Visor BIM 3D e Isométricos Interactivos con mapeo de Juntas         │
├──────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 4. PLANIFICACIÓN │ • Importador Nativo Primavera P6 (.xer) y Presupuestos BC3 (.bc3)     │
│                  │ • Curva S de Avance Físico vs. Financiero & Gestión de Valor Ganado (EVM)│
│                  │ • Control de Partidas WBS y Tablero Kanban Industrial                 │
├──────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 5. VALUACIONES   │ • Motor de Valuaciones Contractuales ROE & Certificados (PIC-03-01-19)│
│                  │ • Análisis de Precios Unitarios (APU) & Cómputos Métricos             │
│                  │ • Eventos de Reclamos MOC & Tiempos Improductivos (Standby)           │
├──────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 6. AMBIENTAL     │ • Plan de Gestión Ambiental PGA & Registro RASDA (PDVSA MA-01-02-12)  │
│                  │ • Auditorías de Cumplimiento Específico (Norma 3.8.1)                 │
├──────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 7. INTELIGENCIA  │ • Project Brain AI: Asistente Experto Normativo (Gemini AI Proxy)     │
│                  │ • Branding Dinámico BrandKit (Kit de Marca Contratista ↔ Cliente)      │
│                  │ • Consola Master Admin (Platform Owner SaaS Console)                  │
└──────────────────┴───────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Estándar de Seguridad Zero-Trust & DevSecOps

Industrial Control 360 implementa un modelo de seguridad por capas diseñado para entornos Oil & Gas:

- **Aislamiento Multi-Tenant Estricto**: Toda la estructura de datos reside bajo `/organizations/{orgId}/projects/{projId}/...`, previniendo fugas de información entre contratistas y clientes.
- **Custom Claims Server-Side**: La autorización (RBAC) se valida mediante JWT Claims emitidos por Admin SDK en Cloud Functions.
- **Auditoría Cryptográfica de Documentos**: Generación de reportes PDF con membrete corporativo `BrandKit`, Hash SHA-256 de integridad, código QR de verificación y adjunto de evidencias fotográficas de campo.
- **Modo PWA Offline-First**: Motor de sincronización local `DexieDB` con cola de outbox e idempotencia para operaciones en locaciones remotas sin cobertura de red.

---

## 🛠️ Stack Tecnológico

- **Frontend Core**: React 19, TypeScript, Vite, Tailwind CSS.
- **Visualización & 3D**: Three.js, `@react-three/fiber`, Leaflet Maps.
- **Documentos & Reportes**: `jsPDF`, `xlsx` / `exceljs`, QRCode.
- **Backend & Cloud Services**: Firebase Firestore, Firebase Auth, Express Admin Proxy, Google Gemini AI.
- **Infraestructura de Pruebas**: Vitest, Firebase Local Emulator Suite.

---

## 🚀 Inicio Rápido (Desarrollo Local)

```bash
# 1. Clonar el repositorio
git clone https://github.com/wolvesglobalsolutionsgroup-rgb/Industrial-360-App.git
cd Industrial-360-App

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo Vite
npm run dev

# 4. Validar tipos TypeScript
npx tsc --noEmit

# 5. Ejecutar la suite de pruebas unitarias
npm test
```

---

## 📄 Gobernanza y Documentación

Toda la hoja de ruta de sprints, normativas PDVSA/API/ASME y decisiones de arquitectura están registradas en la carpeta `docs/`:

- 📖 [PLAN_MAESTRO_SPRINTS_100.md](file:///c:/Users/Administrator/Desktop/Memoria/Industrial-360-App/docs/governance/PLAN_MAESTRO_SPRINTS_100.md): Hoja de Ruta Consolidada (Sprints 15 a 31).
- 🎨 [SISTEMA_BRANDING_DINAMICO_Y_KIT_DE_MARCA.md](file:///c:/Users/Administrator/Desktop/Memoria/Industrial-360-App/docs/architecture/SISTEMA_BRANDING_DINAMICO_Y_KIT_DE_MARCA.md): Especificación del BrandKit.
- 📐 [MATRIZ_MULTIDISCIPLINAR_Y_MANUAL_INGENIERIA.md](file:///c:/Users/Administrator/Desktop/Memoria/Industrial-360-App/docs/planificacion/MATRIZ_MULTIDISCIPLINAR_Y_MANUAL_INGENIERIA.md): Matriz de 7 Disciplinas de Ingeniería.
- 📝 [BITACORA_AVANCES_Y_AUDITORIA_QWEN.md](file:///c:/Users/Administrator/Desktop/Memoria/Industrial-360-App/docs/planificacion/BITACORA_AVANCES_Y_AUDITORIA_QWEN.md): Bitácora de Sprints y Relevado de Avances.

---

© 2026 **Industrial Control 360**. Todos los derechos reservados.
