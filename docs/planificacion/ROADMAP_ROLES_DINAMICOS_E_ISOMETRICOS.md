# 📜 ESPECIFICACIÓN TÉCNICA MAESTRA: ARQUITECTURA DE ROLES DINÁMICOS, GESTIÓN LABORAL Y VISOR DE ISOMÉTRICOS CAD/P&ID
## INDUSTRIAL CONTROL 360 — THE OIL & GAS OPERATING SYSTEM

**Código del Documento:** `DOC-SPEC-2026-003`  
**Ubicación en Código:** `docs/planificacion/ROADMAP_ROLES_DINAMICOS_E_ISOMETRICOS.md`  
**Versión:** 1.0.0 — Final / Aprobado para Implementación  
**Estándares de Referencia:** PDVSA PIC-01-03-05 (Dossier de Calidad Anexo A), PDVSA L-STC-001 (Planos As-Built de Tuberías), PDVSA SI-S-04 (SIHO-A en Contratistas), PDVSA PI-02-01-01 (Plan SIHO-A), ASME IX (Calificación de Soldaduras), API 1104 (Soldadura de Tuberías y Líneas), ASME B31.3 / B31.4 / B31.8.

---

## 📋 FICHA TÉCNICA Y RESUMEN EJECUTIVO

El presente documento define la especificación técnica de arquitectura, modelo de datos, diseño de componentes y roadmap de implementación para tres capacidades avanzadas del sistema **Industrial Control 360**:

1. **Arquitectura de Roles Dinámicos y Gestión Laboral / RRHH de Obra**: Desacoplamiento de la autenticación de infraestructura (Custom Claims Firebase Auth) del organigrama funcional de proyecto. Soporte nativo para 10 cargos especializados O&G PDVSA y módulo integrado de control de asistencia, fichas técnicas de personal, cálculo de HHT (Horas Hombre Trabajadas) y pases de acceso SIHO-A.
2. **Pipeline y Visor de Isométricos CAD/P&ID (`src/components/engineering/IsometricViewer.tsx`)**: Motor de visualización vectorial de planos isométricos (DXF/SVG/PCF) con capa interactiva de juntas de soldadura ($J\text{-}001, J\text{-}002$), trazabilidad de coladas (MTR / Heat Numbers), estado de ensayos NDT (VT, RT, UT, PT, MT) y vinculación directa con el **Capítulo 6 del Dossier de Calidad (Norma PDVSA L-STC-001 / PIC-01-03-05)**.
3. **Matriz de Backlog Acumulado y Roadmap Master de Sprints Futuros**: Planificación metodológica estructurada en 6 Sprints priorizados por impacto operativo, esfuerzo de desarrollo y mitigación de riesgos técnicos.

---

## 🏛️ SECCIÓN 1: ARQUITECTURA DE ROLES DINÁMICOS Y GESTIÓN LABORAL / RRHH DE OBRA

### 1.1 Modelo Conceptual: Custom Claims (Security Auth) vs. Organigrama de Proyecto (Functional Role)

Para garantizar la seguridad de la información y la flexibilidad operativa exigida por los contratos IPC (*Engineering, Procurement, Construction*) de Oil & Gas, la plataforma implementa una **arquitectura de autorización de dos capas independientes**:

```
                       ARQUITECTURA DE AUTORIZACIÓN DE DOS CAPAS
                       
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │ CAPA 1: SEGURIDAD DE INFRAESTRUCTURA & AUTH (Custom Claims Firebase Auth)      │
  │ • Firmada criptográficamente en el JWT Token de sesión del usuario.             │
  │ • Evalúa Firestore Security Rules a nivel de colección y API REST.              │
  │ • Valores inmutables globales: superadmin | gerente | supervisor | inspector   │
  │   | campo | cliente_readonly                                                    │
  └────────────────────────────────────────┬────────────────────────────────────────┘
                                           │
                                           ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │ CAPA 2: ORGANIGRAMA FUNCIONAL DE PROYECTO (Project Functional Role)             │
  │ • Asignado dinámicamente por Obra/Proyecto (/organizations/{org}/projects/{proj})│
  │ • Determina los permisos procedimentales en el organigrama contractual.        │
  │ • Cargos O&G PDVSA: Coordinador SIHO, Inspector QA/QC, Almacenista MTR, etc.  │
  └─────────────────────────────────────────────────────────────────────────────────┘
```

#### Ventajas del Desacoplamiento:
* **Principio de Mínimo Privilegio:** Un usuario con nivel de seguridad de autenticación `inspector` en Firebase Auth no requiere permisos de administrador global de la plataforma para ejercer la autoridad técnica de **Coordinador QA/QC** dentro de un proyecto específico.
* **Movilidad de Personal Multi-Proyecto:** Un mismo ingeniero puede desempeñarse como **Coordinador QA/QC** en el *Proyecto Reemplazo Propanoducto Cardón-Amuay* y como **Inspector QA/QC** en el *Proyecto Mantenimiento Compresora San Joaquín*, manteniendo su misma cuenta de usuario y credenciales seguras.

---

### 1.2 Catálogo Detallado de Cargos O&G PDVSA (Matriz de Permisología y Responsabilidades)

El sistema incorpora 10 cargos operativos predefinidos alineados con las normas **PDVSA SI-S-04**, **PDVSA PIC-01-03-05** y los pliegos de contratación estándar en la industria petrolera:

| Cargo O&G PDVSA | Norma / Estándar | Responsabilidades Clave en el Sistema | Permisos en Módulos IC360 |
| :--- | :--- | :--- | :--- |
| **1. Coordinador SIHO-A** | PDVSA SI-S-04 / PI-02-01-01 | Aprobación final de PTS/AST, auditoría de matrices IPER, control de índices de accidentabilidad HHT, cierre de hallazgos. | Emisión/Aprobación PTS, Reportes de Incidentes, Bloqueo de Áreas. |
| **2. Inspector SIHO-A** | PDVSA SI-S-04 | Elaboración de PTS en sitio, dictado de charlas de 5 min, verificación de detectores multi-gas ($H_2S, LEL, O_2, CO$), inspección de EPP. | Creación PTS/AST, Registro de Lecturas de Gas, Inspecciones EPP. |
| **3. Coordinador QA/QC** | PDVSA PIC-01-03-05 / ISO 9001 | Aprobación del Plan de Control de Calidad (PCC/PIE), control de Puntos Hold/Witness (H/W/R), aprobación de Dossier Final y Punch-Lists. | Certificación de Dossier, Liberación H/W/R, Validación de WPS/PQR. |
| **4. Inspector QA/QC** | API 1104 / ASME IX / ASTM | Inspección visual VT de juntas, solicitud de NDT (RT, UT, PT, MT), reporte de juntas rechazadas/reparadas, seguimiento de solapamiento. | Registro de Juntas ($J\text{-}001$), Asignación NDT, Firma de Protocolos. |
| **5. Coordinador Ambiental** | PDVSA E-TP / Ley Org. Ambiente | Plan de Gestión Ambiental (PGA), permisos de afectación de recursos naturales, disposición de desechos peligrosos y lodos de perforación. | Módulo Ambiental, Manifiestos de Desechos, Evaluaciones de Impacto. |
| **6. Inspector Ambiental** | PDVSA E-TP | Inspección de trampas de grasa, contención de derrames en maquinaria, recolección selectiva de desechos sólidos y monitoreo de vegetación. | Reportes de Inspección Ambiental, Checklists de Maquinaria. |
| **7. Planificador / Avance** | PDVSA GAP-01 / Primavera P6 | Carga y sincronización de cronogramas `.xer`, actualización de Curvas S de avance físico/financiero, cómputos métricos e hitos ROE. | Módulo de Cronogramas, Carga de Avance de Partidas, Reporte Diario. |
| **8. Capataz / Supervisor** | Manual de Inspección Campo | Liderazgo de cuadrillas en frente de trabajo, reporte diario de avance, firma de partes diarios de horas hombre (HHT) y equipos. | Carga de Reporte Diario de Campo, Registro de Asistencia Cuadrilla. |
| **9. Almacenista MTR** | API 5L / ISO 10474 | Recepción, trazabilidad y despacho de materiales vinculados a Mill Test Reports (Heat Numbers / Coladas), consumibles de soldadura y bridas. | Módulo de Procura/Inventario, Asignación de Heat Numbers a Juntas. |
| **10. Analista RRHH** | Ley Orgánica del Trabajo | Fichas de personal, control de asistencia en sitio, vigencia de exámenes médicos ocupacionales y pases de acceso a refinerías/plantas. | Gestión de Personal, Registro de Asistencia HHT, Pases SIHO. |

---

### 1.3 Módulo de Control de Asistencia y Gestión Laboral en Sitio

El módulo de Gestión Laboral consolida los datos de personal en tiempo real para alimentar directamente las valuaciones de mano de obra y los indicadores de seguridad SIHO-A.

```
                   FLUIDO DE DATOS LABORALES Y SEGURIDAD SIHO
                   
  ┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
  │ FICHA DEL TRABAJADOR    │─────►│ CONTROL DE ASISTENCIA   │─────►│ MUNICIÓN DE MÉTRICAS    │
  │ • C.I. / Datos Personal │      │ • Turno (14x14, 5x2)    │      │ • HHT Acumuladas        │
  │ • Estampa Soldador (W)  │      │ • Entrada / Salida GPS  │      │ • Días Sin Accidentes   │
  │ • Apto Médico / Inducc. │      │ • Validación Pase SIHO  │      │ • Valuaciones ROE HHT   │
  └─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

#### Funcionalidades Clave del Módulo:

1. **Ficha Integral del Trabajador (Workforce Master File):**
   * Datos filiatorios: Nombres, Cédula de Identidad, foto de perfil, cargo contractual.
   * Especialidad Técnica: Soldador 6G/6GR, Tubero Pipeliner, Riggar Capataz, Instrumentista, etc.
   * Estampa de Soldador: Código único (ej. `W-042`) con enlace directo a su calificación WPQ (*Welder Performance Qualification*) bajo ASME IX / API 1104.
   * Estatus Médico Ocupacional: Fecha de examen médico, aptitud física y fecha de vencimiento.
   * Estatus de Inducción SIHO-A: Cumplimiento de norma PDVSA SI-S-04 y matriz de EPP entregados.

2. **Cálculo Automático de Horas Hombre Trabajadas (HHT):**
   * Registro diario por cuadrilla y frente de trabajo.
   * Desglose automatizado: $HHT_{\text{Regulares}}$, $HHT_{\text{Sobretiempo}}$ y $HHT_{\text{Nocturnas}}$.
   * Alimentación automática de indicadores clave SIHO-A:
     $$\text{Índice de Frecuencia Bruto (IFB)} = \frac{\text{Nº de Accidentes} \times 1.000.000}{HHT_{\text{Acumuladas}}}$$
     $$\text{Días Sin Accidentes con Tiempo Perdido (CTP)}$$

3. **Gestión de Turnos y Regímenes de Trabajo:**
   * Soporte para esquemas operativos de campo: **14x14**, **21x7**, **5x2** y **8x6**.
   * Control de campamento, pernocta, transporte y viáticos de alimentación.

4. **Matriz de Pases SIHO y Permisos de Ingreso a Plantas:**
   * Control de pases de entrada para refinerías y complejos industriales (ej. Complejo Refinador Paraguaná CRP Cardón-Amuay, Petrocedeño, San Joaquín, Jose).
   * Sistema de semaforización de pases: 🟢 Vigente, 🟡 Por Vencer (< 15 días), 🔴 Vencido / Acceso Bloqueado.

---

### 1.4 Esquemas de Datos Firestore (TypeScript Interfaces)

```typescript
// Path: organizations/{orgId}/projects/{projId}/project_roles/{userId}
export interface ProjectFunctionalRole {
  userId: string;
  projectId: string;
  orgId: string;
  functionalRole: 
    | 'COORDINADOR_SIHO'
    | 'INSPECTOR_SIHO'
    | 'COORDINADOR_QAQC'
    | 'INSPECTOR_QAQC'
    | 'COORDINADOR_AMBIENTAL'
    | 'INSPECTOR_AMBIENTAL'
    | 'PLANIFICADOR_AVANCE'
    | 'CAPATAZ_SUPERVISOR'
    | 'ALMACENISTA_MTR'
    | 'ANALISTA_RRHH';
  assignedAt: string;
  assignedBy: string;
  status: 'ACTIVE' | 'INACTIVE';
  permissionsOverride?: string[];
}

// Path: organizations/{orgId}/workforce/{workerId}
export interface WorkerProfile {
  id: string;
  orgId: string;
  dni: string; // C.I.
  firstName: string;
  lastName: string;
  trade: string; // Especialidad (ej: 'Soldador 6G', 'Tubero Pipeliner')
  welderStamp?: string; // Código de estampa (ej: 'W-042')
  wpqReferenceId?: string; // ID del registro WPQ bajo ASME IX / API 1104
  medicalFitnessStatus: 'APTO' | 'APTO_CON_RESTRICCION' | 'NO_APTO';
  medicalFitnessExpiry: string;
  sihoInductionExpiry: string;
  sihoPassStatus: 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' | 'SUSPENDIDO';
  sihoPassExpiry: string;
  assignedProjectId?: string;
  assignedShift: '14X14' | '21X7' | '5X2' | '8X6';
  createdAt: string;
  updatedAt: string;
}

// Path: organizations/{orgId}/projects/{projId}/hht_records/{recordId}
export interface HHTDailyRecord {
  id: string;
  projectId: string;
  orgId: string;
  date: string; // YYYY-MM-DD
  frontId: string; // Frente de trabajo
  supervisorId: string;
  totalWorkers: number;
  regularHHT: number;
  overtimeHHT: number;
  nightHHT: number;
  totalHHT: number;
  safetyIncidentsCount: number;
  status: 'DRAFT' | 'APPROVED_BY_SIHO';
  approvedBySihoId?: string;
}
```

---

## 📐 SECCIÓN 2: PIPELINE Y VISOR DE ISOMÉTRICOS CAD/P&ID (`IsometricViewer.tsx`)

### 2.1 Arquitectura del Visor Vectorial (`src/components/engineering/IsometricViewer.tsx`)

El componente `IsometricViewer.tsx` se ubica en `src/components/engineering/IsometricViewer.tsx` y proporciona una interfaz gráfica interactiva de alta precisión para inspectores de campo y gerentes de proyecto.

```
                  ARQUITECTURA DEL COMPONENTE ISOMETRICVIEWER
                  
 ┌─────────────────────────────────────────────────────────────────────────────────┐
  │ CONTENEDOR PRINCIPAL REACT (IsometricViewer.tsx)                                │
  │ • Control de Zoom/Pan (Mouse Wheel, Touch Pinch, Fit-to-Screen, Min 10% - Max 800%)│
  │ • Selector de Capas SVG (Ver/Ocultar Juntas, Spools, Cotas, Válvulas, NDT Status) │
  ├─────────────────────────────────────────────────────────────────────────────────┤
  │ CAPAS DE RENDERIZADO VECTORIAL SVG INTERACTIVO                                 │
  │ 1. <g id="layer-grid-titleblock"> -> Membrete PDVSA L-STC-001 y Grilla           │
  │ 2. <g id="layer-piping-geometry"> -> Líneas de tubería, codos, bridas             │
  │ 3. <g id="layer-spools">          -> Delimitación cromática de Spools           │
  │ 4. <g id="layer-weld-hotspots">   -> Nodos interactivos de Juntas (J-001...J-N)  │
  ├─────────────────────────────────────────────────────────────────────────────────┤
  │ PANEL LATERAL DE DETALLES Y TRAZABILIDAD (Weld Hotspot Modal/Drawer)           │
  │ • Estado NDT: 🟢 Aprobado | 🔴 Rechazado | 🟡 Pendiente                         │
  │ • Trazabilidad MTR: Heat Number Tubo A / Tubo B                                 │
  │ • Estampa del Soldador (WPQ) & Reporte Radiográfico / Ultrasónico (DICONDE)     │
  └─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Pipeline de Conversión CAD / DXF / PCF a SVG Interactivo

El proceso de conversión e ingesta de planos isométricos sigue una secuencia automatizada:

```
  ┌──────────────┐     ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
  │ Archivo CAD  │────►│ Parser DXF / PCF     │────►│ Extractor de Juntas  │────►│ JSON de Metadatos    │
  │ (.dxf / .pcf)│     │ (dxf-parser / TS)    │     │ y Atributos Spool    │     │ + SVG Interactivo    │
  └──────────────┘     └──────────────────────┘     └──────────────────────┘     └──────────────────────┘
```

1. **Carga del Archivo de Diseño:** El usuario sube un plano en formato `.dxf` (AutoCAD / SmartPlant) o `.pcf` (ISOGEN).
2. **Parsing Vectorial:** El motor en TypeScript parsea las entidades geométricas (`LINE`, `CIRCLE`, `TEXT`, `LWPOLYLINE`) e identifica los textos etiquetados con la nomenclatura estándar de juntas ($J\text{-}001, J\text{-}002, \dots$).
3. **Generación del SVG Enriquecido:** Se construye el documento SVG inyectando atributos `data-weld-id="J-001"` y `data-spool-id="SP-01"` en los elementos gráficos.
4. **Almacenamiento en Firestore:** Se guarda el documento en `organizations/{orgId}/projects/{projId}/isometrics/{isoId}` asociando la URL del SVG y el listado de juntas parseadas.

---

### 2.3 Mapeo Interactivo de Juntas ($J\text{-}001, J\text{-}002$), Estados NDT y Trazabilidad MTR

Cada nodo de junta ($J\text{-}001$) renderizado en el isométrico es interactivo y posee una codificación de color dinámica basada en su estado real de inspección QA/QC:

#### Código de Colores Visual en el Isométrico:
* 🟢 **Verde (`APPROVED`):** Junta soldada e inspeccionada con Ensayo NDT (VT + RT/UT) APROBADO conforme a API 1104 §9.
* 🔴 **Rojo (`REJECTED`):** Defecto de soldadura detectado (Falta de penetración, Porosidad, Grieta). Junta en estatus de REPARACIÓN ($R_1$).
* 🟡 **Amarillo (`PENDING`):** Junta ejecutada en campo, pendiente por reporte o ejecución de Ensayo NDT.
* ⚪ **Gris (`NOT_WELDED`):** Junta proyectada en plano, pendiente por armado o soldadura.
* 🔵 **Cian (`SHOP_WELD`):** Junta de Taller (Shop Weld) vs 🟣 **Púrpura (`FIELD_WELD`):** Junta de Campo (Field Weld).

```typescript
// Interface para el estado y metadatos de cada Junta en el Visor Isométrico
export interface IsometricWeldNode {
  weldId: string; // ej. "J-001"
  isometricCode: string; // ej. "ISO-CARDON-001-REV-0"
  spoolId: string; // ej. "SP-01"
  weldType: 'BW' | 'SW' | 'FW' | 'FLANGE'; // Butt Weld, Socket Weld, Field Weld
  nominalDiameterInches: number; // ej. 6
  pipeSchedule: string; // ej. "Sch 40"
  materialSpec: string; // ej. "API 5L Gr. X52"
  heatNumberA: string; // Colada Tubo A (Trazabilidad MTR)
  heatNumberB: string; // Colada Tubo B (Trazabilidad MTR)
  welderStamp: string; // Estampa del soldador (ej. "W-042")
  ndtStatus: 'APPROVED' | 'REJECTED' | 'PENDING' | 'NOT_WELDED';
  ndtReportNo?: string; // Reporte NDT (ej. "REP-RT-2026-089")
  ndtType?: 'VT' | 'RT' | 'UT' | 'PT' | 'MT';
  svgCoordinates: { x: number; y: number };
}
```

---

### 2.4 Integración y Vinculación con el Capítulo 6 del Dossier As-Built (PDVSA L-STC-001 / PIC-01-03-05)

El visor de isométricos se conecta directamente con el compilador del Dossier de Calidad (`src/pages/DossierCompiler.tsx`):

1. **Exportación As-Built Automatizada:** Al aprobarse el 100% de las juntas NDT de un plano isométrico, el sistema marca el plano como **As-Built Liberado**.
2. **Generación del Capítulo 6:** El isométrico renderizado con el mapa visual de juntas y la **Matriz Resumen de Trazabilidad de Juntas (Weld Map Table)** se inyectan automáticamente en el **Capítulo 6: Planos As-Built (L-STC-001) y Acta de Recepción Definitiva** del Dossier de Calidad en formato PDF indexado con firmas digitales y Hash SHA-256.

---

## 🗺️ SECCIÓN 3: MATRIZ DE BACKLOG ACUMULADO Y ROADMAP MASTER DE SPRINTS FUTUROS

### 3.1 Matriz Priorizada de Requerimientos Acumulados

| ID | Épica / Módulo | Requerimiento Técnico / Funcional | Prioridad | Est. (SP) | Impacto Operativo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | Roles & Auth | Separación de Roles Security (Custom Claims) y Roles Funcionales de Proyecto. | **P1 - Crítica** | 5 | Ineludible para seguridad multi-tenant y gobernanza. |
| **REQ-02** | RRHH & SIHO | Módulo de Ficha de Trabajador, Control de Asistencia HHT y Pases SIHO. | **P1 - Crítica** | 8 | Permite cálculo exacto de HHT e indicadores de seguridad. |
| **REQ-03** | Ingeniería | Visor de Isométricos Vectoriales SVG/DXF (`IsometricViewer.tsx`). | **P1 - Crítica** | 13 | Digitalización de trazabilidad de soldadura e inspección. |
| **REQ-04** | QA/QC | Mapeo interactivo de Juntas NDT ($J\text{-}001$), MTR y Estampa de Soldador. | **P1 - Crítica** | 8 | Trazabilidad 100% de juntas conforme a API 1104 / ASME IX. |
| **REQ-05** | Dossier | Integración Visor Isométrico ↔ Capítulo 6 Dossier As-Built (PDVSA L-STC-001). | **P2 - Alta** | 5 | Automatización completa del Libro Final de Obra. |
| **REQ-06** | Ingeniería | Parser interactivo de Diagramas P&ID con etiquetado de equipos. | **P2 - Alta** | 8 | Mapeo visual de líneas, válvulas e instrumentos. |
| **REQ-07** | PWA Offline | Sincronización offline-first de inspecciones QA/QC e HHT en sitio sin 4G. | **P2 - Alta** | 13 | Operatividad total en campos remotos de la Faja del Orinoco. |
| **REQ-08** | IA Agentes | Agente IA Auditor de Seguridad SIHO (Norma PDVSA SI-S-04 / PI-02-01-01). | **P3 - Media** | 8 | Verificación automática de cumplimiento de PTS antes de firma. |

---

### 3.2 Plan Metodológico de Sprints Futuros (Sprint 1 a Sprint 6)

```
                              CRONOGRAMA DE SPRINTS FUTUROS
                              
  SPRINT 1 ──► SPRINT 2 ──► SPRINT 3 ──► SPRINT 4 ──► SPRINT 5 ──► SPRINT 6
  Roles Auth    RRHH & HHT   Visor ISO    Juntas NDT   Dossier Cap6  PWA & IA
  & Security    Asistencia   Canvas/SVG   MTR & WPQ    As-Built L-STC P&IDs / RAG
```

#### 🏃 SPRINT 1: Arquitectura de Roles Dinámicos & Data Schema de RRHH
* **Objetivo:** Implementar la infraestructura de roles duales y la base de datos de gestión laboral.
* **Entregables:**
  1. Extensión de `ProjectContext.tsx` con tipo `ProjectFunctionalRole`.
  2. Firestore Security Rules actualizadas para validar roles funcionales por proyecto.
  3. Schemas de Firestore para `project_roles` y `workforce`.

#### 🏃 SPRINT 2: Módulo UI de Gestión Laboral, Ficha de Trabajador y HHT
* **Objetivo:** Construir la interfaz de usuario para administración de personal, control de pases SIHO y cálculo de HHT.
* **Entregables:**
  1. Pantalla de Ficha del Trabajador con estampa de soldador y vigencia de exámenes médicos.
  2. Módulo de control de asistencia diaria por cuadrillas.
  3. Dashboard de cálculo de HHT y generación de reportes SIHO-A.

#### 🏃 SPRINT 3: Engine de Conversión CAD/DXF & Componente Base `IsometricViewer.tsx`
* **Objetivo:** Desarrollar el visor gráfico interactivo de planos isométricos.
* **Entregables:**
  1. Componente `src/components/engineering/IsometricViewer.tsx`.
  2. Controles de Zoom, Pan, Fit-to-Screen y selector de capas SVG.
  3. Parser DXF/PCF para extracción de geometrías y textos de juntas.

#### 🏃 SPRINT 4: Capa Interactiva de Juntas, NDT Status & Trazabilidad MTR
* **Objetivo:** Dotar de interactividad a las juntas del isométrico y conectarlas con el módulo QA/QC.
* **Entregables:**
  1. Renderizado de marcadores hotspot de juntas ($J\text{-}001, J\text{-}002$) con código de colores según NDT status.
  2. Drawer modal de detalle de junta: Estampa de Soldador (WPQ), Heat Numbers MTR y reporte de radiografía.
  3. Sincronización en tiempo real con la colección de juntas en Firestore.

#### 🏃 SPRINT 5: Integración Visor Isométrico ↔ Capítulo 6 Dossier As-Built
* **Objetivo:** Conectar el visor de isométricos con el motor de compilación del Dossier de Calidad.
* **Entregables:**
  1. Exportador SVG/PDF de plano As-Built con la Matriz Resumen de Juntas (Weld Map Table) embebida.
  2. Inyección automática en `DossierCompiler.tsx` para el **Capítulo 6 (PDVSA L-STC-001 / PIC-01-03-05)**.
  3. Firma digital QR/SHA-256 de planos As-Built liberados.

#### 🏃 SPRINT 6: P&IDs Interactivos, PWA Offline Sync & RAG IA de Obra
* **Objetivo:** Extender la visualización a diagramas P&ID y garantizar la operación offline.
* **Entregables:**
  1. Visor de P&IDs interactivos con tagged equipment (Bombas, Tanques, Separadores).
  2. Motor de sincronización Service Worker + IndexedDB para inspecciones NDT y asistencia en sitio sin 4G.
  3. Integración del Agente IA Auditor SIHO-A sobre la base de conocimientos RAG del proyecto.
