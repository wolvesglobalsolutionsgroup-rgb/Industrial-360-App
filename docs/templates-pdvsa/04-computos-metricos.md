## DOCUMENTO 4: CÓMPUTOS MÉTRICOS — AC0131302-CE0D3-CP02001-REVB

### 4.1. Identificación
| Campo | Valor |
|-------|-------|
| **Título** | Cómputos Métricos — [Nombre del Proyecto/Disciplina] |
| **Código** | AC0131302-CE0D3-CP02001-REVB |
| **Revisión** | B |
| **Disciplina** | C — Civil / Estructuras / Tuberías (variable según alcance) |
| **Norma Aplicable** | PDVSA CIED — Procedimiento para Elaboración de Cómputos Métricos |
| **Formato** | Hoja de Cálculo (Excel) / Documento Técnico (PDF) |

### 4.2. Estructura del Documento

#### PORTADA
```
┌──────────────────────────────────────────────────────────────┐
│  [Logo Contratista]                  [Logo PDVSA]           │
│                                                              │
│               CÓMPUTOS MÉTRICOS                              │
│                                                              │
│   PROYECTO: [Nombre del Proyecto]                            │
│   CONTRATO: [N° Contrato]                                    │
│   CONTRATISTA: [Nombre Empresa]                              │
│   CLIENTE: PDVSA [Filial]                                    │
│                                                              │
│   CÓDIGO: AC0131302-CE0D3-CP02001-REVB                       │
│   REVISIÓN: B                     FECHA: DD/MM/AAAA          │
│                                                              │
│   DISCIPLINA: [Mecánica / Civil / Eléctrica / Instrumentos]  │
│   FASE: [D=Definir, I=Implantar]                            │
│                                                              │
│   ELABORÓ: [Nombre]                 FIRMA: ________          │
│   REVISÓ:  [Nombre]                 FIRMA: ________          │
│   APROBÓ:  [Nombre]                 FIRMA: ________          │
│                                                              │
│   DOCUMENTO CONTROLADO                                       │
└──────────────────────────────────────────────────────────────┘
```

#### SECCIÓN 1 — HOJA DE CONTROL DE REVISIONES
| REV | FECHA | DESCRIPCIÓN | ELABORÓ | REVISÓ | APROBÓ |
|-----|-------|-------------|---------|--------|--------|
| A | DD/MM/AA | Emisión Inicial | [Nombre] | [Nombre] | [Nombre] |
| B | DD/MM/AA | Revisión por cambio de alcance | [Nombre] | [Nombre] | [Nombre] |

#### SECCIÓN 2 — RESUMEN GENERAL DE CÓMPUTOS
| Disciplina | Unidad | Cantidad Total | Peso (kg) | Área (m²) | Volumen (m³) | Longitud (m) | Observaciones |
|------------|--------|---------------|-----------|-----------|-------------|-------------|---------------|
| Tubería 24" | m | 1,500.00 | 45,000.00 | — | — | 1,500.00 | API 5L X52 SMLS |
| Tubería 12" | m | 850.00 | 12,750.00 | — | — | 850.00 | API 5L Gr.B ERW |
| Válvulas | und | 45 | 3,600.00 | — | — | — | Gate/Globe/Ball |
| Concreto | m³ | 320.00 | — | — | 320.00 | — | Estructural f'c=250 |
| Acero refuerzo | kg | 28,500.00 | 28,500.00 | — | — | — | ASTM A615 Gr.60 |
| Recubrimiento | m² | 4,200.00 | — | 4,200.00 | — | — | 3LPP / FBE |

#### SECCIÓN 3 — DETALLE DE CÓMPUTOS POR PARTIDA
*Para cada partida del WBS:*

| Ítem | Descripción | Unidad | Cant. de Diseño | Desperdicio (%) | Cant. Total | Dimensiones (mm) | Peso Unit. (kg/m) | Peso Total (kg) | Norma | Plano Ref. |
|------|-------------|--------|-----------------|----------------|-------------|-----------------|------------------|----------------|-------|-----------|
| 1 | TUBERÍA 24" API 5L X52 SMLS SCH 40 | m | 1,450.00 | 3.45% | 1,500.00 | D=609.6, e=15.88 | 235.00 | 352,500.00 | ASME B36.10 | PL-M-001 |
| 1.a | Recta 24" (tramos 12m) | m | 1,380.00 | 2.00% | 1,407.60 | 609.6x15.88 | 235.00 | 330,786.00 | — | — |
| 1.b | Curva 24" 3D R=18.3m | und | 5 | — | 5 | — | 235.00 | 1,175.00 | ASME B16.9 | PL-M-002 |
| 1.c | Brida WN 24" 150# RF | und | 18 | 2.00% | 19 | — | 89.00 | 1,691.00 | ASME B16.5 | PL-M-003 |
| 2 | CONCRETO ESTRUCTURAL f'c=250 kg/cm² | m³ | 310.00 | 3.23% | 320.00 | Variable | — | — | PDVSA JA-252 | PL-C-001 |
| 2.a | Fundación tipo F-1 (4.0x4.0x1.2m) | und | 4 | 3.00% | 4 | 4000x4000x1200 | — | — | — | PL-C-002 |
| 2.b | Dado D-1 (1.2x1.2x1.0m) | und | 8 | 3.00% | 9 | 1200x1200x1000 | — | — | — | PL-C-002 |
| 3 | ACERO DE REFUERZO ASTM A615 Gr.60 | kg | 27,600.00 | 3.26% | 28,500.00 | — | — | 28,500.00 | ASTM A615 | PL-C-003 |

Columnas de la tabla detallada:
- **Ítem**: Jerarquía WBS (1, 1.a, 1.b, ...)
- **Descripción**: Especificación completa del material/actividad
- **Unidad**: m, m², m³, kg, und, hr
- **Cant. de Diseño**: Cantidad según planos/ingeniería
- **Desperdicio (%)**: % estimado según tipo de material
- **Cantidad Total**: Cant. diseño × (1 + despercicio/100)
- **Dimensiones**: Largo×Ancho×Alto, Diámetro×Espesor
- **Peso Unitario**: kg/m, kg/und (según tablas de pesos estándar)
- **Peso Total**: Cant. Total × Peso Unitario
- **Norma**: Código de norma de referencia
- **Plano Referencia**: N° de plano de ingeniería

#### SECCIÓN 4 — HOJA DE CANTIDADES DE OBRA (TOM)
*Breakdown por instalación / área:*

| Área / Sistema | Descripción | Unidad | Cant. | Plano | Norma Aplicable |
|---------------|-------------|--------|-------|-------|-----------------|
| ÁREA 100 - CPF | Tubería 24" Gas | m | 520.00 | PL-G-100 | ASME B31.8 |
| ÁREA 100 - CPF | Válvula Gate 24" 150# | und | 6 | PL-G-100 | API 600 |
| ÁREA 200 - PATIO TANQUES | Tubería 12" Crudo | m | 280.00 | PL-G-200 | ASME B31.4 |
| ÁREA 300 - ESTACIÓN BOMBEO | Bomba centrífuga 500HP | und | 3 | PL-G-300 | API 610 |

#### SECCIÓN 5 — CRITERIOS DE CUANTIFICACIÓN
- 5.1 Criterios generales de medición
- 5.2 Normas de desperdicio por tipo de material
- 5.3 Tablas de peso estándar aplicadas
- 5.4 Bases de cálculo (suposiciones y exclusiones)

#### SECCIÓN 6 — ANEXOS
- Anexo A: Planos de referencia con marcado de áreas
- Anexo B: Tablas de peso unitario (ASME B36.10, B36.19)
- Anexo C: Reportes de campo con medidas verificadas
- Anexo D: Cálculos de respaldo (hojas de cálculo)

### 4.3. Firmas Requeridas

| Rol | Tipo | Entidad |
|-----|------|---------|
| **Elaboró** | Firma digital | Especialista de Cómputos / Planificador |
| **Revisó** | Firma digital | Líder de Ingeniería o Líder de Disciplina |
| **Aprobó** | Firma digital | Gerente de Proyecto (Contratista) |
| **Validó** | Firma digital | Inspector Técnico PDVSA |

### 4.4. Campos para Template en App

```typescript
interface ComputosMetricosTemplate {
  // Identificación
  projectId: string;
  codigoPDVSA: string;
  revision: string;
  fechaEmision: string;
  disciplina: 'Mecanica' | 'Civil' | 'Electrica' | 'Instrumentacion' | 'Tuberias' | 'Estructuras';
  fase: FasePDVSA;
  
  // Proyecto
  nombreProyecto: string;
  contratoNo: string;
  contratista: string;
  cliente: string;
  
  // Control revisiones
  revisiones: Revision[];
  
  // Resumen por disciplina
  resumenGeneral: ResumenComputo[];
  
  // Partidas detalladas
  partidas: PartidaComputo[];
  
  // Áreas / Instalaciones
  areas: AreaComputo[];
  
  // Criterios de cuantificación
  criterios: string;
  desperdicios: Record<string, number>;  // material -> % desperdicio
  tablasPesoRef: string;
  basesCalculo: string;
  
  // Firmas
  firmas: Firma[];
}

interface ResumenComputo {
  disciplina: string;
  unidad: string;
  cantidadTotal: number;
  pesoKg: number;
  areaM2: number;
  volumenM3: number;
  longitudM: number;
  observaciones: string;
}

interface PartidaComputo {
  item: string;           // e.g. "1.a"
  descripcion: string;
  unidad: string;
  cantidadDiseno: number;
  desperdicioPorc: number;
  cantidadTotal: number;
  dimensiones: string;    // e.g. "D=609.6, e=15.88"
  pesoUnitario: number;   // kg/m o kg/und
  pesoTotal: number;
  norma: string;
  planoRef: string;
  materialTag?: string;
}

interface AreaComputo {
  area: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  plano: string;
  normaAplicable: string;
}
```

### 4.5. Reglas de Negocio

1. **R1** — Cantidad Total = Cantidad de Diseño × (1 + Desperdicio / 100)
2. **R2** — Peso Total = Cantidad Total × Peso Unitario
3. **R3** — Desperdicios estándar: Tubería 3.0-3.5%, Acero refuerzo 3.0-5.0%, Concreto 2.0-3.0%, Recubrimiento 5.0-10.0%, Válvulas/Bridas 0-2.0%
4. **R4** — Cada partida se vincula a un plano de ingeniería de referencia
5. **R5** — Los cómputos alimentan directamente las valuaciones (ROE)
6. **R6** — Los cómputos son la base para la procura de materiales (Material Take-Off)
