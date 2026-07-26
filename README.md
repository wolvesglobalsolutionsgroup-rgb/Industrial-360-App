# 🏗️ Industrial Control 360 (IC360)

Plataforma empresarial e industrial de gestión de proyectos, control de partidas WBS, aseguramiento QA/QC, permisos de trabajo SIHO-A, valuaciones ROE, analítica de integridad de tuberías (ILI) e inteligencia artificial para contratistas de ingeniería y sector Oil & Gas.

---

## 🌟 Características Principales

- **Dashboard Ejecutivo Bento:** KPIs en tiempo real de avance físico vs. financiero, HHT sin accidentes, tasa de rechazo NDT y curva S acumulada.
- **Work Board Kanban Industrial:** Tablero interactivo con 4 columnas, soporte drag-and-drop (`@dnd-kit`), control de restricciones SIHO/PTW, badges WBS y alternador de 3 vistas (Kanban, WBS Tabla, Calendario).
- **Autenticación Resiliente 3-en-1:** Inicios de sesión por Correo/Contraseña, Acceso Demo (`demo-operator-360`) y Google OAuth con fallback local reactivo (`useAppAuthState()`).
- **Sistema de Diseño "Industrial Executive":** Matriz de tokens `@theme` (Slate Navy `#0b2239`, Naranja WGS `#ff6b00`, `.card`, `.input-base`, `.glass`) inspirada en la arquitectura limpia de *Time to Program*.
- **Copiloto IA Estructurado:** Integración con Google Gemini AI mediante `callGeminiStructured<T>()` para desglosar partidas en subtareas operativas con esquemas JSON validados.
- **Interoperabilidad:** Parser e importador de archivos Primavera P6 (`.xer`) y presupuestos de obra (`.bc3`).
- **Auditoría & Seguridad:** Reglas de Firestore de grano fino (`firestore.rules`) con aislamiento multi-tenant y roles de acceso (Superadmin, Gerente, Supervisor, Inspector, Campo).

---

## 🏗️ Arquitectura del Sistema

```
[ Frontend: React 19 + Vite + Tailwind v4 ]
        │
        ├── Auth Service (useAppAuthState / Firebase Auth + Local Fallback)
        ├── Design System (@theme tokens + Time to Program UI Matrix)
        │
        └── Real-time State & Analytics (Firestore + Gemini Proxy Server)
```

- **Frontend:** React 19, Vite, Tailwind CSS v4, Motion, Recharts, Lucide Icons, `@dnd-kit`.
- **Backend Services:** Firebase Auth, Firestore Database, Firebase Storage, Cloud Functions.
- **Proxy Server:** Proxy de Express server-side (`server.ts`) para resguardar llamadas a Gemini API de forma segura.

---

## 🚦 Primeros Pasos & Desarrollo Local

### Prerrequisitos
- Node.js `v20.x` o superior
- npm o bun

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/wolvesglobalsolutionsgroup-rgb/Industrial-360-App.git
cd Industrial-360-App

# Instalar dependencias
npm install
```

### Ejecutar Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### Verificación de Tipos y Compilación
```bash
# Verificar compilación TypeScript
npx tsc --noEmit

# Generar bundle de producción
npm run build
```

---

## 🔒 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en la siguiente estructura:

```env
# Gemini API Key (Server-side proxy)
GEMINI_API_KEY=tu_api_key_de_gemini

# Configuración Firebase Applet
VITE_FIREBASE_API_KEY=tu_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

---

## 📜 Convenciones de Ramas & PRs

1. **`main`**: Rama protegida de producción. Despliegue automático a Vercel.
2. **`feature/*`**: Ramas para desarrollo de nuevas características.
3. **`fix/*`**: Ramas para correcciones de errores.

---

## 📄 Licencia

Derechos reservados &copy; 2026 Wolves Global Solutions / Industrial Control 360.
