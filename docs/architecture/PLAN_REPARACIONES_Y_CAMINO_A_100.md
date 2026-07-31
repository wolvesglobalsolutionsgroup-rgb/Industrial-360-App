# 🛡️ PLAN MAESTRO DE ACCIÓN: REPARACIONES SEGURIDAD P0/P1 Y CAMINO A CALIFICACIÓN 100/100
## Sistema Operativo Industrial Control 360° — Repositorio `wolvesglobalsolutionsgroup-rgb/Industrial-360-App`

> **ESTADO ACTUAL:** Transición de Piloto PROINTECA (89-92/100 Verificado Empíricamente) hacia **Certificación Enterprise Absoluta 100/100**.
> **OBJETIVO DEL DOCUMENTO:** Someter a la validación final del Consejo de IAs el Plan de Micro-Sprints de Corrección P0/P1 y la Hoja de Ruta Fase 2 reordenada para alcanzar 100/100 real y libre de vulnerabilidades.

---

## 📊 1. SÍNTESIS DE AUDITORÍA DEL CONSEJO Y CONSECUCIÓN DE HALLAZGOS

Tras la evaluación cruzada realizada por el panel de expertos (GPT 5.6 Terra, Claude 5 Sonnet, Kimi K3 y Qwen 3.8 Max):

1. **Confirmación de Avance:** Los 5 P0s históricos de la arquitectura original (DB Pública, RBAC Falso, APIs Unauth, XSS/IDs Simulados, Auto-Escalación) **fueron cerrados exitosamente en el código fuente de `main`**.
2. **Diagnóstico de Brechas:** Sin embargo, la auditoría profunda identificó **nuevos vectores P0/P1**, discrepancias en el `package-lock.json` (`xlsx` residual transitivo), riesgos de canal de llaves (PAT sin expiración en markdown público), tipados permisivos (`[key:string]:any`), y faltantes matemáticos/normativos para alcanzar la nota máxima de **100/100**.

---

## 🚀 2. ESTRATEGIA DE REPARACIÓN Y EJECUCIÓN (DESGLOSE DE SPRINTS Y PROMPTS)

---

### 🛡️ SPRINT S14.1: CRITICAL SECURITY & TENANT AUTHORIZATION HARDENING (P0/P1 FIXES)
**Objetivo:** Resolver el 100% de los hallazgos P0 y P1 de seguridad y autorización identificados por GPT 5.6, Claude y Qwen.

#### 📝 Tareas Concretas:
1. **Fix `getClientPortal` (Ataque de Tiempo y Rate Limit Público):**
   - Eliminar el fallback `portalData.accessToken === token` en texto plano.
   - Implementar `crypto.timingSafeEqual(computedHash, portalData.tokenHash)`.
   - Separar el limitador de tasa para endpoints públicos sin exigir `req.user.uid` en `requireAuth`.
2. **Fix `createClientPortal` y `sealDocument` (Autorización de Tenant Server-Side):**
   - Forzar la validación de tenant: `if (context.auth.token.orgId !== data.orgId) throw new HttpsError('permission-denied')`.
   - Derivar `orgId` y `role` exclusivamente del JWT verificado del usuario.
3. **Fix Registro e Inmutabilidad de `orgId` en `/users`:**
   - En `firestore.rules` y `functions/src/index.ts` (`ensureOwnClaims`), asegurar que la creación/edición del perfil del usuario no pueda vincularse a un `orgId` arbitrario sin membresía verificada en `/organizations/{orgId}/memberships/{uid}`.
4. **Fix Idempotencia Offline:**
   - Mover el registro de claves de idempotencia a transacciones server-side en Cloud Functions o ajustar las reglas en `firestore.rules` para permitir escrituras de claves de idempotencia validadas por `auth.uid`.
5. **Eliminación de Defaults Hardcodeados (`semax_pino`):**
   - Eliminar `orgId = 'semax_pino'` y `projectId = 'PROJ-001'` por defecto en `src/lib/offline/outbox.ts` y `getClientPortal`. Exigir que `orgId` y `projectId` sean parámetros obligatorios no nulos.

#### 🤖 PROMPT EJECUTABLE PARA SPRINT S14.1:
```text
Ejecuta el Sprint S14.1 de Seguridad Crítica P0/P1 para Industrial Control 360 en el repositorio `Industrial-360-App`:

1. En `functions/src/index.ts` -> `getClientPortal`:
   - Reemplaza la comparación en texto plano por `crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(portalData.tokenHash, 'hex'))`.
   - Remueve completamente el fallback `|| portalData.accessToken === token`.
   - Configura rate-limiting independiente basado en IP / portalId para que funcione públicamente sin req.user.uid.

2. En `functions/src/index.ts` -> `createClientPortal` y `sealDocument`:
   - Agrega validación estricta de tenant: `if (!context.auth || context.auth.token.orgId !== data.orgId) { throw new functions.https.HttpsError('permission-denied', 'No autorizado para operar en esta organización'); }`.

3. En `firestore.rules` y `functions/src/index.ts` (`ensureOwnClaims`):
   - Refuerza las reglas de `/users/{userId}` para impedir la asignación de `orgId` durante el registro inicial a menos que exista un registro autorizado en `/organizations/{orgId}/memberships/{uid}`.

4. En `src/lib/offline/outbox.ts`:
   - Elimina todos los valores hardcodeados por defecto `'semax_pino'` y `'PROJ-001'`. Haz que `orgId` y `projectId` sean parámetros estrictamente requeridos.

5. En `functions/src/index.ts` -> `sendEmail`:
   - Elimina la respuesta `simulated: true` cuando no hay API Key; retorna error HTTP 503 honesto `service-unavailable`.

Verifica con `npx tsc --noEmit` que todo compile con 0 errores y ejecuta los vitest tests.
```

---

### 📦 SPRINT S14.2: SUPPLY CHAIN, KEY GOVERNANCE & LOCKFILE CLEANUP
**Objetivo:** Eliminar vulnerabilidades de la cadena de suministro, limpiar el lockfile y asegurar la gobernanza estricta de llaves.

#### 📝 Tareas Concretas:
1. **Regeneración de Lockfile & Limpieza de Deprecaciones:**
   - Ejecutar `npm install` para regenerar `package-lock.json` asegurando la remoción total de `xlsx@0.18.5`.
   - Desinstalar `@types/exceljs` deprecado (exceljs v4 incluye sus propios tipos nativos).
   - Actualizar `vite` a `>= 6.2.6` en `package.json` para cerrar CVEs de servidor dev.
2. **Gobernanza de Claves & Sanitización de Markdown:**
   - Mover la metadata del PAT de GitHub únicamente al archivo local en el escritorio (`C:\Users\Administrator\Desktop\REGISTRO_APIS_Y_PROYECTO_I360.txt`).
   - Limpiar cualquier mención a llaves en el repositorio público.
3. **Rebranding Enterprise en `package.json`:**
   - Cambiar `"name": "react-example"` por `"name": "industrial-360-app"`.
   - Cambiar `"version": "0.0.0"` por `"version": "1.0.0-enterprise"`.

#### 🤖 PROMPT EJECUTABLE PARA SPRINT S14.2:
```text
Ejecuta el Sprint S14.2 de Gobernanza y Cadena de Suministro:

1. Modifica `package.json`:
   - Actualiza `"name": "industrial-360-app"`, `"version": "1.0.0-enterprise"`.
   - Remueve `@types/exceljs` de devDependencies.
   - Actualiza `vite` a `^6.2.6`.

2. Ejecuta en terminal:
   - `npm install` para regenerar `package-lock.json` sin rastro de `xlsx`.
   - Verifícalo corriendo `npm ls xlsx` (debe retornar vacío).

3. En `docs/governance/REGISTRO_INFRAESTRUCTURA_Y_LLAVES.md`:
   - Remueve la sección del GitHub PAT en texto público para evitar exposición de metadata de gobierno. Registra únicamente la política de rotación a tokens fine-grained de 90 días.

4. Corre `npx tsc --noEmit` y `npm test` para asegurar compilación limpia.
```

---

### 📐 SPRINT S14.3: STRICT DOMAIN TYPING & ESLINT QUALITY GATES
**Objetivo:** Eliminar la permisividad en los tipos de TypeScript y garantizar cero `any` en la capa de dominio.

#### 📝 Tareas Concretas:
1. **Eliminación de Index Signatures Permisivas:**
   - En `src/lib/repositories/types.ts` y todas las entidades de dominio, eliminar `[key: string]: any`.
   - Definir propiedades explícitas o usar `Record<string, unknown>` para atributos dinámicos validados con Zod.
2. **Configuración de Reglas ESLint:**
   - Activar `@typescript-eslint/no-explicit-any` como advertencia/error en la carpeta `src/lib/`.
3. **Validación de Schemas de Entrada:**
   - Reforzar los schemas Zod en repositorios y Cloud Functions para validar datos financieros (`ValuationItem`) y regulatorios (`SihoPtwRecord`).

#### 🤖 PROMPT EJECUTABLE PARA SPRINT S14.3:
```text
Ejecuta el Sprint S14.3 de Tipado Estricto de Dominio:

1. En `src/lib/repositories/types.ts`:
   - Elimina la firma indexada `[key: string]: any` de todas las interfaces (`ValuationItem`, `SihoPtwRecord`, `WeldJoint`, `Project`, etc.).
   - Define explícitamente todos los campos opcionales requeridos por la normativa.

2. Revisa y reemplaza los usos de `: any` y `as any` en `src/lib/repositories/baseRepo.ts` y `src/lib/normEngines.ts` por tipos concretos o `unknown` con type guards.

3. Ejecuta `npx tsc --noEmit` y verifica que el proyecto compile al 100% sin errores de compilación.
```

---

### 🧮 SPRINT S15: MOTOR MATEMÁTICO DE APU, WBS & PARSER BC3/SIDCON (FASE 2 CORE)
**Objetivo:** Construir el motor de precios unitarios de nivel industrial con rigor paramétrico venezolano e internacional.

#### 📝 Tareas Concretas:
1. **Desglose Paramétrico de APU (`PUT = PUD * (1 + FCIU)`):**
   - Modelar `FCIU` desglosado en `indirectosPercent + utilidadPercent` con controles editables independientes (utilidad 8-12%).
2. **Salario Integral Petrolero (LOTTT Art. 142 & FCMO 380%-550%):**
   - Implementar cálculo con alícuotas de Utilidades parametrizables por sector/tamaño (25% en O&G) y Bono Vacacional (4.17%).
3. **Costo Horario de Equipos (CHP + CHO):**
   - Separar Posesión (CHP) y Operación (CHO) con factor de potencia operativa (70-80% HP nominal) y consumo diesel real.
4. **Fórmulas Polinómicas de Reajuste:**
   - Implementar cálculo `K = a(M/M0) + b(EQ/EQ0) + c(MO/MO0) + d(IND/IND0)` validando que `sum(a+b+c+d) === 1.0`.
5. **Parser BC3 / FIEBDC-3:**
   - Implementar parser modular en `src/lib/bc3Parser.ts` para importar y exportar presupuestos estándar de la industria.

#### 🤖 PROMPT EJECUTABLE PARA SPRINT S15:
```text
Ejecuta el Sprint S15: Motor Matemático de APU, WBS y Parser BC3/SIDCON:

1. Crea `src/lib/apuEngine.ts` implementando:
   - Cálculo de Precio Unitario Total (PUT) con FCIU desglosado en Indirectos y Utilidad separada.
   - Cálculo de Salario Integral Petrolero conforme a LOTTT Art. 142 con FCMO parametrizable (380%-550%) y alícuota de utilidades O&G (25%).
   - Costo Horario de Equipos (CHP + CHO) considerando HP operativo al 75% del nominal.
   - Fórmula Polinómica de Reajuste de Precios K con validación estricta de suma de coeficientes igual a 1.0.

2. Crea `src/lib/bc3Parser.ts` para la ingesta y generación de archivos de intercambio FIEBDC-3 / BC3 y vinculación con la WBS de 5 niveles.

3. Crea suites de pruebas unitarias en `src/lib/__tests__/apuEngine.test.ts` con vectores dorados de prueba.
```

---

### 🏛️ SPRINT S16: BRANDKIT MULTI-OPERADOR & DOBLE MEMBRETE COMPLIANCE
**Objetivo:** Soportar identidades duales (Contratista EPC + Operadora: PDVSA, Chevron, Repsol, ENI) con valor legal y firma registrada.

#### 📝 Tareas Concretas:
1. **Configuración de BrandKit Multi-Tenant:**
   - Soporte para logos duales, colores corporativos y códigos de contrato en el header de todos los entregables.
2. **Firma Dual y Estampado Legal:**
   - Modelo de datos con arreglo `firmantes[]` (Inspectores, Supervisores, Gerentes EPC y Cliente).
   - Estampado de hash SHA-256 + QR con *nonce* único y rate-limiting en la URL de verificación pública.
3. **Mapeo de Jerarquías Normativas:**
   - PDVSA (SI-S-04), Chevron (CHESM/JSA con botón SWA en UI), Repsol (NORMA EHS) y ENI (STEA / Golden Rules).

#### 🤖 PROMPT EJECUTABLE PARA SPRINT S16:
```text
Ejecuta el Sprint S16: Multi-Operator BrandKit y Doble Membrete Compliance:

1. Actualiza `src/types/` y `src/components/settings/BrandKitSettings.tsx` para permitir configurar logos duales (EPC + Operadora), colores de tema y membretes personalizados por proyecto.

2. En `functions/src/index.ts` -> `sealDocument`:
   - Genera un hash SHA-256 inmutable del contenido del documento + metadata de firmantes.
   - Retorna una URL de validación pública que incluya un token HMAC de un solo uso para prevenir scraping masivo.

3. Integra el botón de Paro de Emergencia por Seguridad (Stop Work Authority - SWA) de acuerdo a las Golden Rules de Chevron/ENI en la barra principal de la aplicación móvil.
```

---

### 📄 SPRINT S17: EXPORTADORES DE DOCUMENTOS EDITABLES (.XLSX, .DOCX, .PPTX)
**Objetivo:** Garantizar la directiva de editabilidad total (80% al 100%) para el cliente mediante exportaciones nativas en formatos de MS Office.

#### 📝 Tareas Concretas:
1. **Instalación de Dependencias Editables:**
   - Agregar `docx` y `pptxgenjs` a `package.json`.
2. **Exportador `.xlsx` con Fórmulas Vivas (`exceljs`):**
   - Asegurar que las valuaciones y APUs exportados incluyan fórmulas relativas (`SUM`, `PRODUCT`) en lugar de valores planos.
3. **Exportador `.docx` para Informes y Dossiers (`docx`):**
   - Crear `src/lib/docxExporter.ts` para exportar informes de calidad, AST y PTW a Microsoft Word con tablas anidadas y membrete dual.
4. **Exportador `.pptx` para Presentaciones Executivas (`pptxgenjs`):**
   - Crear `src/lib/pptxExporter.ts` para generar diapositivas de avance físico/financiero para la Sala de Control.

#### 🤖 PROMPT EJECUTABLE PARA SPRINT S17:
```text
Ejecuta el Sprint S17: Exportadores Editables de Documentos:

1. Instala las dependencias: `npm install docx pptxgenjs`.

2. Crea `src/lib/docxExporter.ts` para exportar informes técnicos, PTW y Secciones del Dossier a archivos `.docx` editables respetando el Doble Membrete.

3. Actualiza `src/lib/excelExporter.ts` para escribir fórmulas nativas de Excel en las hojas de Valuaciones y Cómputos Métricos.

4. Crea `src/lib/pptxExporter.ts` para exportar resúmenes ejecutivos de proyectos a presentaciones `.pptx`.

5. Agrega pruebas unitarias en `src/lib/__tests__/documentExporters.test.ts`.
```

---

### 🔄 SPRINT S18: RESILIENCIA OFFLINE & CRDT EN CAMPO
**Objetivo:** Eliminar el riesgo de Last-Write-Wins (LWW) en operaciones petroleras mediante máquinas de estado y sincronización inteligente.

#### 📝 Tareas Concretas:
1. **Máquina de Estados para Mutaciones de Campo:**
   - Reemplazar LWW por máquina de estados estricta en `conflictPolicy.ts` (`creado -> inspeccionado -> aprobado/rechazado -> reparado`).
2. **Carga Adaptativa de Fotos:**
   - Subida en 2 pasos: miniatura/compresión inmediata offline -> alta resolución al detectar conexión WiFi/4G estable.
3. **Circuit Breaker y Alerta de Acumulación:**
   - Notificar al usuario si la cola de outbox Dexie supera 50 operaciones o 24 horas sin sincronizar.

#### 🤖 PROMPT EJECUTABLE PARA SPRINT S18:
```text
Ejecuta el Sprint S18: Resiliencia Offline y CRDT en Campo:

1. Actualiza `src/lib/offline/conflictPolicy.ts` para implementar resolución basada en máquinas de estado de dominio para soldaduras y permisos PTW en lugar de Last-Write-Wins.

2. Implementa compresión adaptativa de imágenes en `src/lib/offline/outbox.ts` antes de guardar fotos en IndexedDB.

3. Agrega telemetría en `syncEngine.ts` que emita alertas UI cuando existan registros sin sincronizar con más de 12 horas de antigüedad.
```

---

### 🖥️ SPRINT S19: UX/UI WORLD-CLASS & 3 ENTORNOS VISUALES (4K / LAPTOP / CAMPO)
**Objetivo:** Garantizar la excelencia visual y operativa en Command Wall 4K, Workstations de alta densidad y Tablets de Campo.

#### 📝 Tareas Concretas:
1. **Tokens Industriales en `@theme` (`index.css`):**
   - Definir variables de color semánticas: `--color-h2s-critical`, `--color-joint-pass`, `--color-joint-fail`, `--color-pipe-warning`.
2. **Modo Sol (Sunlight High-Contrast AAA 7:1):**
   - Implementar tema de alto contraste para uso en campo bajo luz solar directa.
3. **Objetivos Táctiles de 64px para Campo:**
   - Aplicar `touch-action: manipulation` y botones de 64px para uso con guantes industriales.
4. **Command Wall 4K (OLED Dark `#0b0f19`):**
   - Grid 6x4 sin scroll para monitores de sala de control con protección anti-burn-in.

#### 🤖 PROMPT EJECUTABLE PARA SPRINT S16 UI:
```text
Ejecuta el Sprint S19: UX/UI de Vanguardia y 3 Entornos Visuales:

1. Actualiza `src/index.css` definiendo los tokens industriales semánticos en el bloque `@theme` de Tailwind v4.

2. En `src/components/common/`:
   - Crea `SunlightToggle.tsx` para activar el modo de contraste extremo (AAA 7:1) para tablets de campo.
   - Aplica dimensiones mínimas de 64px a los elementos interactivos en vistas móviles de campo.

3. Ajusta `src/pages/Dashboard.tsx` para que en pantallas >= 3840px (4K) active el diseño Command Wall sin scroll.
```

---

### 📊 SPRINT S20: SAAS COMMAND CENTER & GESTIÓN DE MONETIZACIÓN (TENANTS)
**Objetivo:** Construir la Consola Master para el Creador/Propietario con monitoreo de cuotas, organizaciones y licencias.

#### 🤖 PROMPT EJECUTABLE PARA SPRINT S20:
```text
Ejecuta el Sprint S20: Consola Master Admin y Monetización SaaS:

1. En `src/pages/PlatformOwnerConsole.tsx`:
   - Implementa métricas globales de consumo de Firestore, almacenamiento y llamadas a Cloud Functions por organización.
   - Agrega gestión de licencias (Tier Gratuito / Enterprise 10 Clientes) y auditoría de seguridad.

2. Crea Cloud Functions administrativas en `functions/src/index.ts` con protección de rol `platform_owner` estricto para suspender/activar tenants.
```

---

### 🏆 SPRINT S21: PRE-PRODUCTION VERIFICATION & CERTIFICACIÓN 100/100
**Objetivo:** Ejecutar la suite completa de pruebas, benchmarks de rendimiento (50k WBS) y verificación auditada por el Consejo.

#### 🤖 PROMPT EJECUTABLE PARA SPRINT S21:
```text
Ejecuta el Sprint S21: Verificación de Pre-Producción y Certificación 100/100:

1. Corre la suite completa de pruebas unitarias e integración: `npm run test:all`.
2. Verifica compilación 100% limpia: `npx tsc --noEmit`.
3. Ejecuta `npm audit --omit=dev` para certificar 0 vulnerabilidades.
4. Genera el informe final de certificación en `docs/governance/INFORME_CERTIFICACION_FINAL_100.md`.
```

---

## 📑 3. INSTRUCCIONES PARA EL CONSEJO DE EXPERTOS

**Freddy:** Puedes copiar este archivo `.md` o enviar el prompt a las IAs de tu Consejo con el siguiente mensaje:

> *"Estimado Consejo de IAs (GPT 5.6, Claude 5, Kimi K3, Qwen 3.8, GLM 5.2, Grok 4.5, Nemotron 3):*
> *Aquí tienen el Plan Maestro de Acción para Reparaciones P0/P1 y Camino a la Calificación 100/100. Por favor, revisen cada Sprint y Prompt de su especialidad, hagan sus observaciones finales, validen el plan y confirmen su aprobación para que Antigravity lo ejecute paso a paso en el código."*
