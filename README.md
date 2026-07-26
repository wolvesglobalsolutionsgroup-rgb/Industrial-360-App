# 🏭 Industrial Control 360

**Sistema Integral de Control de Obras, Gestión EPC y Supervisión Técnica en Oil & Gas e Industria**

Industrial Control 360 es una plataforma empresarial multi-tenant diseñada para el control exhaustivo de obras industriales, supervisión de campo, avance físico-financiero, cumplimiento de seguridad SIHO-A (PTW), control de calidad NDT/juntas de soldadura y asistencia de ingeniería potenciada por Inteligencia Artificial (Gemini AI).

---

## 🛠️ Características Principales

- **Dashboard Ejecutivo Corporativo**: Métricas consolidada de proyectos, curva S de avance físico vs. financiero, alertas tempranas de desviación y desviaciones presupuestarias.
- **Control de Partidas WBS y Tablero Kanban Industrial**: Seguimiento de cómputos métricos, avance por cuadrillas y frentes de trabajo, e integración nativa con Primavera P6 (`.xer`) y Presupuestos BC3 (`.bc3`).
- **Módulo SIHO-A & Permisos de Trabajo PTW**: Gestión de Análisis de Riesgo del Trabajo (ART), permisos para trabajo en caliente/espacio confinado y verificación de EPP.
- **QA/QC y Control de Soldaduras**: Trazabilidad de juntas soldadas, ensaye no destructivo (NDT, gammagrafía, ultrasonido) e inspección técnica.
- **Valuaciones ROE & Finanzas**: Registro de valuaciones contractuales, certificados de obra y amortización de anticipos.
- **Cerebro de Proyecto (Project Brain AI)**: Asistente experto en normativas industriales (ASME B31.3, API 1104, NOM, ISO) con estructuración de respuestas mediante Gemini AI Proxy.
- **Gestión Documental & Dossier Compiler**: Compilación automatizada de Libros Blancos y Dossiers de Calidad para entrega de obra.
- **Herramientas de Ingeniería**: Calculadoras técnicas de tuberías, recipientes a presión y prueba hidrostática.
- **Visor BIM 3D**: Inspección e interacción con modelos tridimensionales de plantas e instalaciones.
- **Navegación Integral de Módulos (ModulePanel)**: Acceso directo y categorizado a los 31 módulos especializados mediante el panel de navegación `Grid3x3`.

---

## 🏗️ Arquitectura Técnica

- **Frontend**: React 18, TypeScript, Tailwind CSS v4, Motion (Framer Motion)
- **Drag & Drop**: `@dnd-kit/core` & `@dnd-kit/sortable`
- **Backend & Almacenamiento**: Firebase Firestore, Firebase Auth, Google Cloud Proxy
- **AI Integrada**: Google Gemini AI (Proxy de servidor con `responseSchema` / Structured Output)
- **Importadores Técnicos**: Parsers nativos en cliente/servidor para archivos `.xer` (Primavera P6) y `.bc3` (FIEBDC-3)

---

## 🚀 Instalación y Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en puerto 3000
npm run dev

# Validar tipos y linter
npm run lint

# Compilar para producción
npm run build
```

---

## 🔐 Licencia y Seguridad

Industrial Control 360 cumple con rigurosas políticas de seguridad multi-tenant y aislamiento por organización (`orgId`). Las claves de API y secretos se gestionan estrictamente del lado del servidor.
