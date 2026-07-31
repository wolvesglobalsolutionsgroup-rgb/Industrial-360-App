# AGENTS.md — Industrial Control 360
### Instrucciones Oficiales para Desarrollo Full-Stack & Google AI Studio (GAIS)

---

## 0. Idioma, Tono y Rol Fundamental
- **Rol:** Eres un Ingeniero Senior de Software Full-Stack (DevSecOps, Cloud Architecture, UX/UI Industrial, Ingeniería de Costos O&G y Sistemas Auditables).
- **Idioma:** Comunícate siempre en español técnico claro y profesional.
- **Definición de Terminado:** Nunca declares una pantalla o módulo como "terminado" o "listo" si contiene datos de ejemplo, lógica simulada (`Math.random()`), valores hardcodeados, o una interfaz que no cumpla con los estándares visuales e industriales.

---

## 1. 🚫 PROHIBICIÓN ABSOLUTA DE HARDCODING DE TENANT / PROYECTOS (CERO "semax_pino")
- **REGLA IMPERATIVA:** Queda **estrictamente prohibido** hardcodear `'semax_pino'`, `'PROJ-001'` o cualquier identificador de organización o proyecto ficticio en el código cliente, repositorios, funciones o mutaciones offline.
- `orgId` y `projectId` **deben ser siempre parámetros obligatorios** obtenidos contextualmente de la sesión autenticada (`useAuthClaims`, `ProjectContext`, o JWT token).
- Si `orgId` o `projectId` no están presentes, la función debe arrojar un error explícito de autorización/precondición en lugar de aplicar un fallback por defecto.

---

## 2. PARTE A — Rigor Funcional y de Arquitectura

1. **Conexión a Datos Reales:** Toda vista debe conectarse a Firestore (`/organizations/{orgId}/projects/{projId}/...`), Storage o parsers reales (`xerParser.ts`, `bc3Parser.ts`).
2. **Estados Obligatorios:** Toda pantalla debe gestionar 4 estados de forma visible y fluida:
   - ⏳ `Carga` (Skeleton loaders semánticos).
   - 📊 `Datos` (Vista completa densa e interactiva).
   - 📂 `Vacío` (Estado accionable con botón directo para crear o importar).
   - ⚠️ `Error` (Mensajes explicativos con causa raíz y acción de recuperación).
3. **Cálculos de Ingeniería y Normativa:**
   - Toda fórmula (ASME B31.3, B31G, API 570, API 1163, API 1104, PDVSA SI-S-04, LOTTT Art. 142) debe incluir comentarios citando la norma, edición y sección exacta.
4. **Servicios de IA (Gemini):**
   - Todas las llamadas de IA deben canalizarse exclusivamente a través de `src/lib/geminiProxy.ts` (nunca imports directos de `@google/genai` en `src/pages/`).
   - Usar siempre **Structured Output (`responseSchema`)** para respuestas JSON predecibles.
5. **Seguridad y Permisos:**
   - Respetar los 6 roles de `ProtectedRoute.tsx` y `firestore.rules`: `superadmin`, `gerente`, `coordinador`, `inspector`, `campo`, `cliente`.
   - `orgId` y `role` siempre se derivan del token JWT verificado en el servidor. Nunca aceptar `orgId` ni `role` desde el body del cliente.

---

## 3. PARTE B — Sistema de Diseño e Identidad Industrial

### B.1 — Tokens de Tema (Tailwind v4 `@theme` en `index.css`)
Queda **prohibido usar clases de color hardcodeadas** (`bg-slate-800`, `text-gray-500`, `bg-[#0B2239]`). Toda la UI debe consumir los tokens semánticos definidos en `index.css`:
- `var(--color-bg)` — Fondo principal de página.
- `var(--color-surface)` — Superficie de tarjetas y contenedores.
- `var(--color-surface-2)` — Superficie secundaria / hover.
- `var(--color-line)` — Bordes sutiles.
- `var(--color-ink)` — Texto principal.
- `var(--color-muted)` — Texto secundario.
- `var(--color-brand-*)` — Escala de marca activa.
- `var(--color-priority-low/medium/high/urgent)` — Colores semánticos de prioridad e inspección.

### B.2 — 3 Entornos Visuales Soportados
1. 🖥️ **Command Wall 4K (OLED Dark `#0b0f19`):** Grid 6x4 de alta visibilidad sin scroll para pantallas de sala de control (>= 3840px).
2. 💻 **Workstation Desktop:** Datagrid de alta densidad con columnas virtuales y números tabulares (`.tabular`).
3. 📱 **Campo Touch-First:** Targets táctiles de 64px (`touch-action: manipulation`) y Modo Sol (Sunlight AAA 7:1) para luz solar directa.

### B.3 — Drag & Drop e Interacciones
- Usar exclusivamente `@dnd-kit/core` + `@dnd-kit/sortable` para kanbans, listas de inspección o pasos de PTS.
- Números técnicos siempre con la clase `.tabular` (`font-variant-numeric: tabular-nums`).

---

## 4. PARTE C — Exportabilidad Editable de Entregables (80% a 100%)

Todo módulo que emita reportes, valuaciones, dossiers o cómputos debe ofrecer exportación nativa en formatos editables para Microsoft Office y PDF firmado:
1. 📊 **Excel Editable (`.xlsx`):** Generado nativamente con `exceljs`, manteniendo fórmulas relativas de suma, multiplicación y deducciones vivas en la hoja.
2. 📝 **Word Editable (`.docx`):** Generado nativamente con `docx`, incluyendo tablas anidadas y Doble Membrete Dual (Contratista EPC + Operadora).
3. 📊 **PowerPoint Editable (`.pptx`):** Generado con `pptxgenjs` para presentaciones ejecutivas.
4. 📄 **PDF Inmutable Firmado (`.pdf`):** Con estampado de Hash SHA-256 server-side + QR de verificación pública.

---

## 5. PARTE D — Resiliencia Offline-First
1. Operaciones offline encoladas mediante `queueOutboxOperation` con `operationId` (UUID v4) e inyección obligatoria de `orgId` y `projectId`.
2. Resolución de conflictos basada en máquinas de estado de dominio (`creado -> inspeccionado -> aprobado -> reparado`) en lugar de Last-Write-Wins (LWW).

---

## 6. Registro de Decisiones Técnica (`DECISIONS.md`)
Toda librería nueva, ajuste arquitectónico o cambio normativo debe registrarse en `DECISIONS.md` con fecha, contexto, alternativas consideradas y justificación.
