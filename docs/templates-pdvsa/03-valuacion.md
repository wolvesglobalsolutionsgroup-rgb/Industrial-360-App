## DOCUMENTO 3: VALUACIÓN 10 — RESUMEN DE EJECUCIÓN (ROE)

### 3.1. Identificación
| Campo | Valor |
|-------|-------|
| **Título** | VALUACIÓN 10 — Resumen de Ejecución / Relación de Obra Ejecutada (ROE) |
| **Código PDVSA** | A1C0012601-GD0I5-G0D0100X (Actividad I=5 Contratación, Disciplina G=General) |
| **Contrato** | Variables según proyecto |
| **Período** | Semanal / Quincenal / Mensual (según corte de obra) |
| **Disciplina** | G — General / Gerencia de Proyecto |
| **Origen** | Módulo VALUATIONS de Industrial Control 360 |

### 3.2. Estructura del Documento

#### PORTADA
```
┌────────────────────────────────────────────────────────────────┐
│  [Logo Contratista]                  [Logo PDVSA]              │
│                                                                │
│            RELACIÓN DE OBRA EJECUTADA (ROE)                    │
│                — VALUACIÓN N° [XX] —                           │
│                                                                │
│   PROYECTO: [Nombre del Proyecto]                              │
│   CONTRATO N°: [N° Contrato PDVSA]                             │
│   CONTRATISTA: [Nombre de la Empresa]                          │
│   CLIENTE: PDVSA [Filial]                                      │
│                                                                │
│   PERÍODO: [DD/MM/AAAA] al [DD/MM/AAAA]                       │
│   FECHA DE EMISIÓN: [DD/MM/AAAA]                               │
│   CÓDIGO: A1C0012601-GD0I5-G0D0100X-REV[#]                   │
│                                                                │
│   ELABORÓ: [Nombre]              FIRMA: ________               │
│   REVISÓ:  [Nombre]              FIRMA: ________               │
│   APROBÓ:  [Nombre]              FIRMA: ________               │
│                                                                │
│   [DOCUMENTO CONTROLADO]                                       │
└────────────────────────────────────────────────────────────────┘
```

#### SECCIÓN 1 — RESUMEN EJECUTIVO DE VALUACIÓN
| Concepto | Valor |
|----------|-------|
| **N° Valuación** | XX |
| **Período Valuado** | DD/MM/AAAA - DD/MM/AAAA |
| **Monto Bruto Valuado (USD)** | $ XXX,XXX.XX |
| **Monto Neto a Cobrar (USD)** | $ XXX,XXX.XX |
| **% Avance Físico Período** | XX.XX% |
| **% Avance Físico Acumulado** | XX.XX% |
| **% Avance Financiero** | XX.XX% |
| **Contractual (BAC)** | $ X,XXX,XXX.XX |

#### SECCIÓN 2 — DETALLE DE PARTIDAS EJECUTADAS (Tabla Principal)
| Item | Partida / Actividad | Unidad | Cant. Contratada | Cant. Período | Cant. Acumulada | % Ejec. | Precio Unitario (USD) | Monto Período (USD) | Monto Acum. (USD) |
|------|-----|-------|---------|-----------|------------|------|----------|------------|------------|
| 1.1 | Suministro tubería 24" API 5L X52 | m | 1,500.00 | 120.00 | 980.00 | 65.3% | $250.00 | $30,000.00 | $245,000.00 |
| 1.2 | Soldadura junta 24" | junta | 250 | 18 | 156 | 62.4% | $2,800.00 | $50,400.00 | $436,800.00 |
| 2.1 | Excavación zanja | m³ | 8,500.00 | 450.00 | 5,200.00 | 61.2% | $45.00 | $20,250.00 | $234,000.00 |
| 3.1 | Prueba hidrostática tramo | tramo | 15 | 2 | 9 | 60.0% | $12,000.00 | $24,000.00 | $108,000.00 |
| 4.1 | Recubrimiento anticorrosivo | m² | 4,200.00 | 280.00 | 2,650.00 | 63.1% | $85.00 | $23,800.00 | $225,250.00 |
| | **TOTALES** | | | | | | | **$148,450.00** | **$1,249,050.00** |

#### SECCIÓN 3 — BACKUP DE CÓMPUTOS (Tabla Auxiliar)
| Item Ref. | Descripción | N° Reporte Campo | Fecha | Cant. | Inspector Campo | Notas |
|-----------|-------------|------------------|-------|-------|-----------------|-------|
| 1.1-a | Suministro tubo 24" x 12m tramo A | RF-2026-089 | 15/07/26 | 120 m | J. Pérez | Corte semanal |

#### SECCIÓN 4 — CURVA S DE AVANCE (Gráfico)
- 4.1 Curva Planificada (PV) vs. Ejecutada (EV) vs. Real (AC)
- 4.2 Indicadores EVM
  - **SPI** (Schedule Performance Index) = EV / PV
  - **CPI** (Cost Performance Index) = EV / AC
  - **SV** (Schedule Variance) = EV - PV
  - **CV** (Cost Variance) = EV - AC
  - **EAC** (Estimate at Completion) = BAC / CPI

#### SECCIÓN 5 — FIRMAS Y APROBACIONES
| Rol | Entidad | Firma |
|-----|---------|-------|
| **Elaboró** — Ing. Residente / Valuador Contratista | Contratista | Firma digital |
| **Revisó** — Líder de Planeación y Control | Contratista | Firma digital |
| **Aprobó** — Gerente de Proyecto (Contratista) | Contratista | Firma digital |
| **Verificó** — Inspector de Campo PDVSA | Cliente | Firma digital |
| **Aprobó** — Gerente de Obra / Ingeniería PDVSA | Cliente | Firma digital |

### 3.3. Datos de Entrada para el Template

```typescript
interface ValuacionTemplate {
  // Encabezado
  valuationNo: number;
  periodoInicio: string;
  periodoFin: string;
  fechaEmision: string;
  codigoPDVSA: string;
  revision: string;
  
  // Proyecto
  projectId: string;
  nombreProyecto: string;
  contratoNo: string;
  contratista: string;
  cliente: string;
  bac: number;  // Budget at Completion (Monto Contractual)
  
  // Partidas
  partidas: PartidaValuacion[];
  
  // Resumen
  montoBruto: number;
  montoNeto: number;
  avanceFisicoPeriodo: number;
  avanceFisicoAcumulado: number;
  avanceFinanciero: number;
  
  // EVM indicadores
  pv: number;
  ev: number;
  ac: number;
  spi: number;
  cpi: number;
  
  // Firmas
  firmas: Firma[];
}

interface PartidaValuacion {
  item: string;
  descripcion: string;
  unidad: string;
  cantidadContratada: number;
  cantidadPeriodo: number;
  cantidadAcumulada: number;
  precioUnitario: number;
  
  // Computados
  montoPeriodo: number;
  montoAcumulado: number;
  
  // Backups (reportes campo de soporte)
  reportesSoporte: ReporteCampoRef[];
}

interface ReporteCampoRef {
  reporteNo: string;
  fecha: string;
  cantidad: number;
  inspector: string;
  notas: string;
}
```

### 3.4. Reglas de Negocio para la App
1. **R1** — El monto de período = cantidad de período × precio unitario
2. **R2** — El monto acumulado = cantidad acumulada × precio unitario
3. **R3** — % avance físico período = cantidad período / cantidad contratada × 100
4. **R4** — % avance físico acumulado = cantidad acumulada / cantidad contratada × 100
5. **R5** — SPI = EV / PV (donde EV = monto acumulado, PV = planificado a fecha)
6. **R6** — CPI = EV / AC (donde AC = costo real incurrido)
7. **R7** — EAC = BAC / CPI (proyección financiera)
8. **R8** — Toda valuación requiere mínimo 1 firma del contratista y 1 del cliente
9. **R9** — El período no puede solaparse con valuaciones anteriores

### 3.5. Interfaz de Usuario para Carga de Datos
```
┌─── Período ──────────────────────────────────────────────┐
│  Desde: [date picker]    Hasta: [date picker]             │
├─── Partidas ──────────────────────────────────────────────┤
│  [+ Agregar Partida Manual]  [Importar de Cómputos]       │
│  [Importar de Reportes de Campo]                          │
│                                                            │
│  ┌─ Tabla de Partidas ─────────────────────────────────┐  │
│  │ Item │ Descripción │ Unidad │ Cant. Período │ P.U. │  │
│  │ 1.1  │ Tubería 24" │ m      │ 120           │ $250 │  │
│  │ 1.2  │ Soldadura   │ junta  │ 18            │ $2.8K│  │
│  └────────────────────────────────────────────────────┘  │
├─── Indicadores EVM ───────────────────────────────────────┤
│  SPI: 0.92  CPI: 1.05  EAC: $XX  [Auto-calculado]       │
├─── Firmas ────────────────────────────────────────────────┤
│  Elaboró: [select user]  Aprobó Cliente: [select user]    │
├─── Acción ────────────────────────────────────────────────┤
│  [Previsualizar PDF]  [Generar Valuación]  [Enviar a Firma]│
└───────────────────────────────────────────────────────────┘
```
