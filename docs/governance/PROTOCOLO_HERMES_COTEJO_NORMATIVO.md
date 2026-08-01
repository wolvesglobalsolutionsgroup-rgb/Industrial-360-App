# 🚨 PROTOCOLO DE INSTRUCCIONES PARA HERMES — COTEJO NORMATIVO Y CONSTRUCCIÓN DE MÓDULOS

> **Documento de Cumplimiento Obligatorio**
> Proyecto: Industrial Control 360 (IC360)
> Repositorio: `wolvesglobalsolutionsgroup-rgb/Industrial-360-App`
> Versión: 1.0 — Agosto 2026
> Autoridad: Dirección de Arquitectura / Fundador

---

## ⛔ SECCIÓN 0: REGLAS ABSOLUTAS (NO NEGOCIABLES)

### REGLA 0.1 — PROHIBIDO BORRAR, SOBRESCRIBIR O REEMPLAZAR NORMAS EXISTENTES

En el repositorio ya existen **9 calculadoras normativas implementadas y registradas** en `src/lib/norms/core/NormRegistry.ts`. Estas son código de producción con tests golden aprobados. **BAJO NINGUNA CIRCUNSTANCIA** se debe:

- ❌ Eliminar archivos de `src/lib/norms/`
- ❌ Sobrescribir calculadoras existentes con versiones "simplificadas"
- ❌ Modificar la interfaz `NormCalculator` en `src/lib/norms/types.ts` sin aprobación explícita
- ❌ Desregistrar calculadoras del `NormRegistry`
- ❌ Reemplazar una norma con otra "equivalente" (ej: no sustituir ASME B31G por una "versión genérica de corrosión")

### REGLA 0.2 — PROHIBIDO USAR UNA SOLA NORMA COMO REFERENCIA ÚNICA

Cuando se construya CUALQUIER módulo (SIHO/PTW, QA/QC, ILI, APU, etc.), **NUNCA** se debe basar el módulo en una sola norma. Cada módulo industrial requiere un **COTEJO NORMATIVO COMPLETO** que cruce múltiples fuentes. La IR-S-04 que se usa como ejemplo en los prompts es **SOLO UNO de los documentos** que alimentan el módulo SIHO/PTW. No es el único. No es suficiente.

### REGLA 0.3 — PROHIBIDO GENERAR CÓDIGO GENÉRICO DE IA

No se aceptan:
- ❌ Funciones con `Math.random()` para IDs regulatorios (usar `functions/src/regulatoryIds.ts`)
- ❌ Datos simulados/mock presentados como funcionales
- ❌ `any` no justificado en TypeScript
- ❌ Cálculos de ingeniería delegados a la IA (la IA NUNCA calcula; el código determinista SÍ)
- ❌ Documentos "resumidos" de 2 páginas cuando la norma exige 50+

### REGLA 0.4 — TODA NORMA NUEVA DEBE SEGUIR EL PATRÓN EXISTENTE

Cada calculadora nueva **DEBE** implementar la interfaz `NormCalculator` de `src/lib/norms/types.ts`:

```typescript
interface NormCalculator<TInput, TResult> {
  id: string;                    // Identificador único: "asme-b31g-remaining-pressure"
  standard: string;              // "ASME B31G"
  edition: string;               // "2012 / R2021"
  reference: string;             // Sección/cláusula exacta
  name?: string;                 // Nombre legible
  description?: string;          // Descripción funcional
  category?: 'tuberias' | 'soldadura' | 'bridas' | 'inspeccion' | 'proceso';
  disclaimer?: string;           // SIEMPRE incluir NORM_DISCLAIMER
  getFields?(): NormField[];     // Campos de entrada con unidades y rangos
  validate(input: TInput): string[];  // Validaciones PRE-cálculo
  calculate(input: TInput): TResult;  // Cálculo determinista
}
```

Y **DEBE** registrarse en `NormRegistry.ts` y tener **al menos un test golden** en `src/lib/norms/__tests__/`.

---

## 📐 SECCIÓN 1: INVENTARIO NORMATIVO ACTUAL (LO QUE YA EXISTE — NO TOCAR)

### 1.1 Calculadoras Implementadas y Registradas

| # | Archivo | Norma | Categoría | Estado |
|---|---------|-------|-----------|--------|
| 1 | `src/lib/norms/b31g.ts` | ASME B31G (2012/R2021) — Presión remanente en tuberías corroídas | `tuberias` | ✅ Producción + Tests |
| 2 | `src/lib/norms/b313.ts` | ASME B31.3 — Espesor mínimo de pared (tmin) | `tuberias` | ✅ Producción + Tests |
| 3 | `src/lib/norms/api570.ts` | API 570 — Tasa de corrosión y vida remanente | `inspeccion` | ✅ Producción + Tests |
| 4 | `src/lib/norms/b165.ts` | ASME B16.5 — Dimensiones de bridas, clases, torques | `bridas` | ✅ Producción + Tests |
| 5 | `src/lib/norms/pdvsa906.ts` | PDVSA 906 / PI-02-04-01 — Matriz NDT de defectos de soldadura | `soldadura` | ✅ Producción + Tests |
| 6 | `src/lib/norms/pdvsa906.ts` | PDVSA 906.01-E — Separadores (calculadora adicional) | `proceso` | ✅ Producción + Tests |
| 7 | `src/lib/norms/weldingEstimator.ts` | Estimador de Soldadura (consumibles, tiempos, costos) | `soldadura` | ✅ Producción + Tests |
| 8 | `src/lib/norms/pcc1.ts` | ASME PCC-1 — Torque de bridas y empaquetaduras | `bridas` | ✅ Producción + Tests |
| 9 | `src/lib/norms/api1163.ts` | API 1163 — Evaluación de defectos ILI (In-Line Inspection) | `inspeccion` | ✅ Producción + Tests |

### 1.2 Archivos de Soporte (NO MODIFICAR SIN APROBACIÓN)

| Archivo | Función |
|---------|---------|
| `src/lib/norms/types.ts` | Interfaces `NormCalculator`, `NormField`, `NormResult`, `NORM_DISCLAIMER` |
| `src/lib/norms/core/NormRegistry.ts` | Registro central de calculadoras (patrón Registry) |
| `src/lib/norms/core/NormCalculator.ts` | Interfaz base abstracta |
| `src/lib/norms/index.ts` | Barrel exports |
| `src/lib/norms/pdfReport.ts` | Generador de informes PDF de cálculos normativos |
| `src/lib/norms/__tests__/` | Suite de tests golden (8+ tests aprobados) |

### 1.3 Duplicados Detectados (PENDIENTE DE CONSOLIDACIÓN — NO BORRAR AÚN)

Existen archivos duplicados en subcarpetas que deben consolidarse en un sprint dedicado, **pero NO se eliminan hasta que la consolidación esté probada**:

- `src/lib/norms/api/api570.ts` (153 bytes — stub) vs `src/lib/norms/api570.ts` (8,511 bytes — completo)
- `src/lib/norms/asme/asmeB165.ts` (138 bytes — stub) vs `src/lib/norms/b165.ts` (31,866 bytes — completo)
- `src/lib/norms/asme/asmeB313.ts` (7,657 bytes) vs `src/lib/norms/b313.ts` (1,384 bytes)
- `src/lib/norms/asme/asmeB31g.ts` (119 bytes — stub) vs `src/lib/norms/b31g.ts` (11,850 bytes — completo)
- `src/lib/norms/pdvsa/pdvsa906.ts` (8,426 bytes) vs `src/lib/norms/pdvsa906.ts` (7,101 bytes)

> **INSTRUCCIÓN PARA HERMES:** Si detectas estos duplicados, **NO los borres**. Reporta la discrepancia y espera instrucción de consolidación. Los archivos en la raíz de `norms/` son los que están registrados en `NormRegistry.ts` y son la fuente de verdad.

---

## 📚 SECCIÓN 2: MATRIZ DE COTEJO NORMATIVO POR MÓDULO

### 2.1 — Principio Fundamental del Cotejo

**CADA módulo de IC360 se construye cruzando MÍNIMO 4 capas normativas:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COTEJO NORMATIVO OBLIGATORIO                     │
├─────────────────────────────────────────────────────────────────────┤
│ CAPA 1: NORMAS PDVSA (Obligatorias en Venezuela)                   │
│   → IR-S-04, SI-S-06, SI-S-19, SI-S-20, SI-S-27, SI-S-28,        │
│     SI-S-29, SI-S-31, SI-S-32, HO-H-06, PI-02-04-01, PI-15-02-01, │
│     PIC-01-03-05, L-STC-001, IR-S-16, IR-S-17, IR-E-01, etc.     │
├─────────────────────────────────────────────────────────────────────┤
│ CAPA 2: NORMAS NACIONALES VENEZOLANAS                              │
│   → COVENIN (2000, 2116, 2245, 2247, 3049, etc.)                  │
│   → Decretos (638, 2210, 2212, 2217, 2220, 2226, 5554)            │
│   → LOTTT (Art. 142 — FCMO, prestaciones)                         │
│   → CCPP Petrolero (Tabuladores salariales, FCMO 380%-550%)        │
│   → Ley Penal del Ambiente                                         │
├─────────────────────────────────────────────────────────────────────┤
│ CAPA 3: NORMAS INTERNACIONALES (ASME / API / ISO / NACE / IEEE)    │
│   → ASME: B31.3, B31.4, B31.8, B31G, B16.5, PCC-1, Sec. VIII     │
│   → API: 510, 570, 579, 650, 653, 1104, 1163, 520, 571            │
│   → ISO: 14224, 14001, 45001, 27001                               │
│   → NACE/AMPP: SP0169, SP0176                                     │
│   → IEEE / IEC: 60079, 61511                                      │
│   → NFPA: 70 (NEC)                                                │
│   → ISA: 5.1, S20                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ CAPA 4: ESTÁNDARES CORPORATIVOS DE OPERADORES (Multi-Operador)     │
│   → PDVSA: Formato ROE/AAD, PIC-01-03, Portada Anexo A            │
│   → CHEVRON: CES, CHESM, JSA, SWA (Stop Work Authority)           │
│   → REPSOL: EHS Management System, NORMA Repsol                   │
│   → ENI: STEA, Eni Safety Golden Rules                            │
│   → SHELL: DEP (Design Engineering Practice), MESC                │
│   → BP: GP (Group Practices)                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 — Matriz Específica por Módulo

#### MÓDULO SIHO/PTW (Seguridad Industrial / Permisos de Trabajo)

**NO es solo la IR-S-04.** El módulo SIHO/PTW completo requiere cruzar:

| Norma | Qué aporta al módulo | Sección crítica |
|-------|---------------------|-----------------|
| **PDVSA IR-S-04** (Rev.4, Ago.2013) | Estructura del Sistema de Permisos: Emisor/Receptor/Ejecutor, tipos de permiso (frío/caliente), 12 certificados especiales (Anexos A-L), duración/prórroga/cancelación/cierre | Anexos A-L (formatos completos) |
| **PDVSA IR-S-17** (Rev.0, Oct.2006) | Metodología del Análisis de Riesgos del Trabajo (ART): Secciones A/B/C, identificación de peligros, medidas en fuente/trayectoria/receptor, Anexo B completo (clasificación de peligros) | Sección 6 (Metodología), Anexo B |
| **PDVSA SI-S-06** | Sistema Integrado de Gestión de Riesgos (SIR-PDVSA) — marco general | Requisitos del SIR |
| **PDVSA SI-S-19** | Gestión y Control de Desviaciones — protocolo de parada de trabajo | Criterios de desviación |
| **PDVSA SI-S-20** | Procedimientos de Trabajo — estructura documental obligatoria | Formato de procedimientos |
| **PDVSA SI-S-27** | Andamios: Requisitos de Seguridad — certificación de andamieros | Construcción y certificación |
| **PDVSA SI-S-28** | Control de Fuentes de Energía (LOTO) — bloqueo y etiquetado | Procedimiento LOTO |
| **PDVSA SI-S-29** | Seguridad en Sistemas Eléctricos de Alta Tensión | Trabajos energizados |
| **PDVSA SI-S-31** | Seguridad para Trabajos en Altura (>1.50m) | Certificación y equipos |
| **PDVSA SI-S-32** | Seguridad en Sistemas Eléctricos de Baja Tensión | Trabajos desenergizados |
| **PDVSA HO-H-06** | Guía de Higiene y Seguridad para Espacios Confinados | Monitoreo atmosférico |
| **PDVSA PI-15-02-01** | Requisitos de Seguridad en Izamiento de Cargas | Certificación de equipos |
| **PDVSA IR-E-01** | Clasificación Eléctrica de Áreas | Zonificación ATEX |
| **PDVSA IR-S-16** | Zonas de Seguridad en Instalaciones y Áreas de Protección | Franjas de seguridad |
| **COVENIN 2116** | Andamios — Requisitos de Seguridad (nacional) | Complemento SI-S-27 |
| **COVENIN 2245** | Escaleras, rampas y pasarelas (nacional) | Complemento SI-S-31 |
| **COVENIN 2247** | Excavaciones a Cielo Abierto y Subterráneas (nacional) | Complemento certificado excavación |
| **Decreto 638** | Calidad de Aire y Control de Contaminación Atmosférica | Límites de emisión |
| **Decreto 5554** | Sustancias, Materiales y Desechos Peligrosos | Manejo de MSDS |
| **OSHA 1910** | Occupational Safety and Health (referencia internacional) | Mejores prácticas |
| **ISO 45001** | Gestión de Seguridad y Salud en el Trabajo | Marco de gestión |
| **Chevron CHESM** | Contractor Health, Environmental & Safety Management | JSA, SWA |
| **Repsol NORMA** | Sistema EHS de Repsol | Permisología dual |
| **ENI STEA** | Sistema Técnico de Evaluación y Auditoría | Golden Rules |

> **INSTRUCCIÓN PARA HERMES:** Cuando construyas el módulo SIHO/PTW, los 12 formatos del Anexo A-L de la IR-S-04 son los **formatos de salida** (lo que la app genera). Pero las **reglas de negocio** (quién puede firmar, cuándo se cancela, qué certificados aplican, qué EPP se requiere) vienen de CRUZAR todas las normas de la tabla. No basta con digitalizar el formato; hay que programar la lógica de validación cruzada.

#### MÓDULO QA/QC (Calidad y Soldadura)

| Norma | Qué aporta |
|-------|-----------|
| **PDVSA PI-02-04-01 / 906** | Matriz NDT de defectos de soldadura y tolerancias |
| **PDVSA PI-06-06-01** | Calificación de soldadores y procedimientos |
| **ASME B31.3** | Espesor mínimo, criterios de aceptación |
| **ASME Sec. IX** | Calificación de WPS/PQR/WPQ |
| **API 1104** | Soldadura de tuberías de transporte |
| **API 577** | Welding Inspection and Metallurgy |
| **AWS D1.1** | Structural Welding Code |
| **ISO 5817** | Niveles de calidad de soldadura |
| **ASME PCC-1** | Torque de bridas |

#### MÓDULO ILI / INTEGRIDAD MECÁNICA

| Norma | Qué aporta |
|-------|-----------|
| **API 1163** | Evaluación de datos ILI (ya implementado) |
| **ASME B31G** | Presión remanente por corrosión (ya implementado) |
| **API 570** | Tasa de corrosión y vida remanente (ya implementado) |
| **API 579 / ASME FFS-1** | Fitness-For-Service (PENDIENTE) |
| **API 510** | Inspección de recipientes a presión (PENDIENTE) |
| **API 650 / 653** | Tanques de almacenamiento (PENDIENTE) |
| **ASME B31.4 / B31.8** | Tuberías de transporte (PENDIENTE) |
| **NACE SP0169** | Protección catódica (PENDIENTE) |
| **PDVSA PI-02-09-01** | Inspección en marcha (PENDIENTE) |
| **PDVSA D-211** | Recipientes a presión (PENDIENTE) |
| **PDVSA H-221** | Especificaciones de tuberías (PENDIENTE) |

#### MÓDULO APU / COSTOS / PLANIFICACIÓN (Fase 2)

| Norma/Fuente | Qué aporta |
|-------------|-----------|
| **PDVSA PIC-01-03-05** | Codificación de proyectos y documentos |
| **PDVSA L-STC-001** | Categorización de costos (9 rubros) |
| **CCPP Petrolero / LOTTT Art. 142** | Salario integral, FCMO 380%-550% |
| **AACE International** | EVM (SPI, CPI, EAC), estimación de costos |
| **PMI / PMBOK** | WBS, CPM, gestión de proyectos |
| **FIEBDC-3 (.bc3)** | Formato de intercambio de presupuestos (España/LATAM) |
| **SIDCON** | Sistema de codificación de partidas |

---

## 🔬 SECCIÓN 3: PROTOCOLO DE INGESTA DE NORMAS Y DOCUMENTOS

### 3.1 — Flujo de Digitalización de Normas (Método Probado con Gemini Vision)

El flujo que funciona para extraer la estructura completa de una norma en PDF es:

```
PASO 1: CAPTURA COMPLETA DEL DOCUMENTO
  → Se le proporciona al modelo de visión (Gemini 2.5 Flash/Pro)
    una captura o PDF completo de la norma.
  → Se le pide: "Extrae la estructura completa: índice, secciones,
    tablas, fórmulas, anexos y formatos en JSON estructurado."

PASO 2: IMÁGENES AMPLIADAS POR SECCIÓN
  → Para cada sección crítica (tablas de tolerancias, fórmulas,
    formatos de anexos), se proporcionan imágenes ampliadas.
  → Se le pide: "Extrae esta tabla/fórmula/formato específico
    con todos sus valores, unidades y notas al pie."

PASO 3: VALIDACIÓN CRUZADA
  → Se cruza el JSON extraído contra el texto original.
  → Se verifican fórmulas con casos de prueba conocidos.
  → Se validan unidades y rangos.

PASO 4: IMPLEMENTACIÓN EN CÓDIGO
  → Se implementa como NormCalculator siguiendo types.ts.
  → Se registra en NormRegistry.ts.
  → Se crea test golden con caso conocido.
```

### 3.2 — Limitación Actual de HERMES y Solución

**HERMES actualmente NO tiene capacidad de visión.** Por lo tanto:

- ✅ HERMES **SÍ puede**: trabajar con texto extraído de normas (como el contenido de IR-S-04 e IR-S-17 que ya fue digitalizado y está en la base de conocimiento)
- ✅ HERMES **SÍ puede**: implementar calculadoras a partir de fórmulas y tablas proporcionadas en texto
- ✅ HERMES **SÍ puede**: estructurar JSON schemas, TypeScript, reglas de Firestore
- ❌ HERMES **NO puede** (actualmente): leer directamente un PDF escaneado o una imagen de un formato
- 🔄 **SOLUCIÓN**: Cuando se necesite extraer datos de un PDF/imagen, el flujo se hace a través de **Gemini Vision** (como se hizo con la IR-S-04), y el resultado (JSON/texto estructurado) se le entrega a HERMES para implementación

### 3.3 — Visión Futura: Modelos Especializados en la App

Cuando IC360 habilite la capa agéntica completa, la arquitectura será:

```
┌─────────────────────────────────────────────────────────────┐
│              CAJA DE HERRAMIENTAS IC360 (Código)            │
│  • Motores deterministas (ASME, API, PDVSA)                │
│  • Reglas de negocio (firestore.rules)                      │
│  • Flujos de trabajo (workflows)                            │
│  • Generación de documentos (PDF, DOCX, XLSX)              │
│  • Base de datos (Firestore + Dexie offline)               │
└──────────────────────────┬──────────────────────────────────┘
                           │ Tool Calling / MCP
┌──────────────────────────┴──────────────────────────────────┐
│              CEREBRO IA (Intercambiable)                    │
│  • Modelo de VISIÓN → Lee planos, fotos, formatos PDF      │
│  • Modelo de AUDIO ↔ TEXTO → Dictado en campo              │
│  • Modelo de CÓDIGO → Genera/refactoriza código            │
│  • Modelo MULTIMODAL → Orquesta todos los anteriores       │
│                                                             │
│  La IA NUNCA calcula. La IA NUNCA autoriza.                │
│  La IA llama a las herramientas del código.                │
│  El código ejecuta. El humano aprueba.                     │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ SECCIÓN 4: FILOSOFÍA DE ALTA EFICIENCIA — "LA APP HACE EL 80%"

### 4.1 — Principio Rector

IC360 NO es una base de datos donde la gente "carga información". Es un **motor de automatización activa** que asume el 80% del trabajo pesado, repetitivo y burocrático. El usuario humano solo pone el 20% de criterio y supervisión.

**Cada módulo que HERMES construya debe responder a esta pregunta:**
> "¿Cuántas horas de trabajo manual elimina esta funcionalidad?"

Si la respuesta es "ninguna" o "pocas", el módulo está mal diseñado.

### 4.2 — Ejemplos de Alta Eficiencia por Módulo

| Módulo | Antes (Manual) | Con IC360 (Automatizado) | Ahorro |
|--------|---------------|--------------------------|--------|
| **PTW/ART** | 2-3 horas llenando carpetas, buscando firmas en papel | 2 minutos: seleccionar tipo de trabajo → app autocompleta ART, EPP, normas → firma QR | ~95% |
| **Dossier de Calidad** | 30-90 días compilando al final de obra | Se compila en tiempo real mientras se trabaja → 1 clic para PDF final con SHA-256 | ~90% |
| **Valuación ROE** | Días cuadrando Excel + fotos + boletas | Avance de campo actualiza valuación automáticamente → PDF listo para firma | ~85% |
| **Inspección NDT** | Inspector tipea en laptop bajo el sol | Dicta por voz → IA transcribe → JSON estructurado → cálculo automático de vida remanente | ~80% |
| **Cómputos Métricos** | 2 semanas en Excel desde planos | Isométrico → BOM automático → WBS → APU → solicitud de cotización | ~90% |
| **ART (Análisis de Riesgos)** | Llenar formato a mano, copiar de obras anteriores | Seleccionar tipo de trabajo → app carga peligros típicos del Anexo B IR-S-17 → usuario solo ajusta | ~75% |

### 4.3 — Regla de los 3 Toques (UX de Campo)

Cualquier registro de campo (inspección, foto, nota de voz, permiso) debe completarse en **máximo 3 interacciones táctiles**. Si HERMES diseña un formulario que requiere 15 campos manuales, está violando este principio.

### 4.4 — La App como Manual de Procedimientos Vivo

Cada flujo en IC360 funciona como un **manual de procedimientos y cumplimiento** donde:

1. La app **guía** al usuario paso a paso (no espera que sepa qué hacer)
2. La app **valida** automáticamente contra normas (no confía en que el usuario recuerde la norma)
3. La app **genera** el documento final (no pide que el usuario lo redacte)
4. La app **audita** en segundo plano (no espera a la auditoría externa para detectar errores)

---

## 📋 SECCIÓN 5: INSTRUCCIONES ESPECÍFICAS PARA CADA TAREA DE HERMES

### 5.1 — Cuando se le pida "Construir el módulo SIHO/PTW"

HERMES debe:

1. **LEER PRIMERO** todo el contenido de la IR-S-04 (69 páginas, Rev.4 Ago.2013) y la IR-S-17 (38 páginas, Rev.0 Oct.2006) que están en la base de conocimiento
2. **IDENTIFICAR** los 12 tipos de certificados especiales (Anexos A-L) y sus formatos completos
3. **CRUZAR** con las normas complementarias de la tabla 2.2 (SI-S-28 para LOTO, SI-S-31 para altura, HO-H-06 para espacios confinados, etc.)
4. **IMPLEMENTAR** la lógica de negocio:
   - Roles: Emisor / Receptor / Ejecutor / Custodio (con sus competencias y certificaciones requeridas según §8.9-8.12 de IR-S-04)
   - Duración: máximo 8 horas (12 en paradas de planta) según §8.4
   - Prórroga: solo 1, máximo 2 horas, mismas personas según §8.5
   - Cancelación: 10 causales según §8.6
   - Cierre: inspección final tripartita según §8.7
   - Prueba de gas: obligatoria en caliente, 0% v/v como premisa según §8.3
   - Archivo: mínimo 3 meses según §8.7.2
5. **GENERAR** los formatos de salida (Anexos A-L) como plantillas editables (DOCX/PDF)
6. **INTEGRAR** el ART (IR-S-17) con sus 3 secciones (A: Identificación, B: Peligros/Riesgos, C: Aplicación en Campo) y el Anexo B completo (clasificación de peligros con medidas de prevención)
7. **NO OLVIDAR** los estándares corporativos multi-operador (Chevron CHESM/JSA/SWA, Repsol NORMA, ENI STEA)

### 5.2 — Cuando se le pida "Agregar una norma nueva al motor"

HERMES debe:

1. Verificar que NO exista ya en `src/lib/norms/` (revisar NormRegistry.ts)
2. Crear el archivo en la ubicación correcta: `src/lib/norms/{norma}.ts`
3. Implementar la interfaz `NormCalculator` completa
4. Incluir `NORM_DISCLAIMER` en el resultado
5. Incluir `codeReference` con sección/cláusula EXACTA (ej: "ASME B31.3 §304.1.2 — Ec. 3a")
6. Registrar en `NormRegistry.ts`
7. Crear test golden en `src/lib/norms/__tests__/`
8. Verificar que `npx tsc --noEmit` pasa con 0 errores
9. Verificar que `npm run test` pasa

### 5.3 — Cuando se le pida "Digitalizar un formato/anexo de norma"

Si el formato ya fue extraído como texto/JSON (vía Gemini Vision):
1. Implementar como plantilla en `src/lib/templates/` o como schema JSON en `src/lib/schemas/`
2. Los campos deben mapear exactamente a los campos del formato original
3. Incluir validaciones de campos obligatorios
4. Incluir la lógica de firmas (Emisor/Receptor/Ejecutor)
5. Generar salida en PDF (jsPDF) y DOCX (docx) editable

Si el formato NO ha sido extraído aún:
1. **REPORTAR** que se necesita la extracción vía Gemini Vision
2. **ESPERAR** a que se proporcione el JSON/texto extraído
3. **NO INVENTAR** campos ni estructura del formato

### 5.4 — Cuando se le pida "Construir un flujo de trabajo"

HERMES debe seguir el patrón de `docs/flujos/WORKFLOWS.md`:

1. Definir los actores (roles) que intervienen
2. Definir los estados del documento (Borrador → En Revisión → Aprobado → Pagado/Cerrado)
3. Definir las transiciones (quién puede mover de un estado a otro)
4. Definir las validaciones automáticas en cada transición
5. Definir los documentos que se generan automáticamente
6. Definir las notificaciones (Telegram, email, push)
7. Definir la trazabilidad (audit log server-side)

---

## 🗂️ SECCIÓN 6: ESTRUCTURA DE ARCHIVOS DEL REPOSITORIO (REFERENCIA)

```
Industrial-360-App/
├── docs/
│   ├── FICHA_TECNICA_FUNCIONALIDADES.md
│   ├── architecture/
│   │   └── PLAN_MAESTRO_200_FASE_2.md
│   ├── flujos/
│   │   └── WORKFLOWS.md
│   ├── governance/
│   │   ├── GOVERNANCE.md
│   │   ├── PLAN_DEFINITIVO_UNIFICADO_IC360.md
│   │   └── PROTOCOLO_HERMES_COTEJO_NORMATIVO.md  ← ESTE DOCUMENTO
│   └── pilot/
├── src/
│   ├── lib/
│   │   ├── norms/
│   │   │   ├── __tests__/          ← Tests golden
│   │   │   ├── api/                ← Stubs (pendiente consolidación)
│   │   │   ├── asme/               ← Stubs (pendiente consolidación)
│   │   │   ├── core/
│   │   │   │   ├── NormCalculator.ts
│   │   │   │   └── NormRegistry.ts ← REGISTRO CENTRAL
│   │   │   ├── pdvsa/              ← Versión alternativa pdvsa906
│   │   │   ├── api1163.ts          ← ✅ Producción
│   │   │   ├── api570.ts           ← ✅ Producción
│   │   │   ├── b165.ts             ← ✅ Producción
│   │   │   ├── b313.ts             ← ✅ Producción
│   │   │   ├── b31g.ts             ← ✅ Producción
│   │   │   ├── index.ts
│   │   │   ├── pcc1.ts             ← ✅ Producción
│   │   │   ├── pdfReport.ts
│   │   │   ├── pdvsa906.ts         ← ✅ Producción
│   │   │   ├── types.ts            ← INTERFACES (NO MODIFICAR)
│   │   │   └── weldingEstimator.ts ← ✅ Producción
│   │   ├── repositories/           ← Patrón repositorio (13 módulos)
│   │   ├── offline/                ← Dexie + Outbox + SyncEngine
│   │   ├── parsers/                ← XER, BC3, KML
│   │   ├── dossier/                ← Compilador de Dossier
│   │   └── isometric/              ← Visor de isométricos
│   ├── pages/                      ← 39 páginas/módulos
│   └── __tests__/
│       └── securityRules.test.ts   ← Tests de reglas Firestore
├── functions/
│   └── src/
│       ├── index.ts                ← Cloud Functions v2
│       └── regulatoryIds.ts        ← IDs regulatorios atómicos
├── firestore.rules                 ← Zero-Trust (19 colecciones)
├── storage.rules                   ← Multi-tenant Storage
└── server.ts                       ← Proxy Express (Gemini/Resend)
```

---

## ✅ SECCIÓN 7: CHECKLIST DE VERIFICACIÓN POST-IMPLEMENTACIÓN

Antes de considerar cualquier tarea como "completada", HERMES debe verificar:

- [ ] `npx tsc --noEmit` → 0 errores
- [ ] `npm run test` → todos los tests pasan
- [ ] `npm run build` → build exitoso
- [ ] No se modificó ningún archivo existente de `src/lib/norms/` sin autorización
- [ ] Toda calculadora nueva está registrada en `NormRegistry.ts`
- [ ] Toda calculadora nueva tiene al menos 1 test golden
- [ ] Toda fórmula cita la norma exacta (standard, edition, section)
- [ ] Todo formato de salida incluye `NORM_DISCLAIMER`
- [ ] No hay `Math.random()` en IDs regulatorios
- [ ] No hay datos mock/simulados presentados como funcionales
- [ ] El módulo cruza MÍNIMO 4 capas normativas (PDVSA + Nacional + Internacional + Corporativa)
- [ ] Los flujos siguen el patrón de `docs/flujos/WORKFLOWS.md`
- [ ] La UX cumple la "Regla de los 3 Toques" para operaciones de campo

---

## 📌 SECCIÓN 8: RESUMEN EJECUTIVO PARA HERMES

**En una frase:** Cada módulo que construyas debe ser un **manual de procedimientos vivo** que cruce **todas las normas aplicables** (no una sola), que **automatice el 80% del trabajo**, que **genere los documentos oficiales automáticamente**, y que **nunca delegue cálculos de ingeniería a la IA**.

**Tu trabajo es construir la CAJA DE HERRAMIENTAS (código determinista). La IA es solo el CEREBRO que la opera. El humano es quien APRUEBA.**

---

*Fin del Protocolo. Documento de cumplimiento obligatorio para todas las IAs del equipo de desarrollo IC360.*
