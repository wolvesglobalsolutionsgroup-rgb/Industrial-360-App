# GUÍA DE INTEGRACIÓN — TEMPLATES EN LA APP EXISTENTE

## Archivos existentes que ya implementan parcialmente estas estructuras

| Documento | Archivo Existente | Estado |
|-----------|------------------|--------|
| PIC-01-03-05 | `src/lib/data/pdvsa/codificacion.ts` | ✅ **Completo** — Sistema de codificación completo |
| Carátula PDVSA | `src/lib/dossier/coverGenerator.ts` | ✅ **Completo** — HTML cover con logos, revisiones, firmas |
| Tipos Dossier | `src/lib/data/pdvsa/dossierTypes.ts` | ✅ **Completo** — Interfaces TypeScript |
| Compilador Dossier | `src/lib/dossier/dossierCompiler.ts` | ⚠️ **Parcial** — Compila docs, falta generación individual |
| Valuaciones | Módulo VALUATIONS en app | ⚠️ **Parcial** — UI existe, falta template PDF completo |
| Plan de Calidad | No implementado | ❌ **Pendiente** |
| Cómputos Métricos | No implementado | ❌ **Pendiente** |

## Dependencias entre documentos

```
Cómputos Métricos (insumo) ───► Valuaciones ROE (producto)
Cómputos Métricos (insumo) ───► Procura de Materiales
Plan de Calidad ───────────────► ITPs ───► NDT ───► Dossier de Calidad
PIC-01-03-05 ──────────────────► Todos los documentos (código único)
```

## Hoja de Ruta de Implementación

### Fase 1 — PIC-01-03-05 (YA IMPLEMENTADO)
- ✅ Sistema de codificación estándar y simplificado
- ✅ Parser de códigos (standard y short field)
- ✅ Catálogos completos (Anexos C, D, E/F)
- ✅ Carátula oficial con control de revisiones y firmas

### Fase 2 — Valuaciones ROE
- [ ] Template PDF basado en `pdfReport.ts` o `coverGenerator.ts`
- [ ] Tabla de partidas con montos calculados automáticamente
- [ ] Cálculo de indicadores EVM (SPI, CPI, SV, CV, EAC)
- [ ] Curva S gráfica (reutilizar `SCurveChart` de Dashboard)
- [ ] Integración con Firestore collection `valuations`
- [ ] Importación de cantidades desde Cómputos Métricos
- [ ] Flujo de firmas digitales (Elaboró → Revisó → Aprobó Cliente)

### Fase 3 — Plan de Calidad
- [ ] Template HTML/PDF con estructura de 10 secciones
- [ ] Editor de ITPs por disciplina (tabular)
- [ ] Organigrama de calidad (subir imagen o diagrama)
- [ ] Control de documentos y registros
- [ ] Gestión de No Conformidades
- [ ] Plantilla de Matriz de Calidad

### Fase 4 — Cómputos Métricos
- [ ] Template hoja de cálculo / tabla detallada
- [ ] Cálculos automáticos: cantidad total con % desperdicio
- [ ] Cálculos de peso según tablas estándar (ASME B36.10, B36.19)
- [ ] Desglose por área/instalación
- [ ] Integración con módulo de Procura (Material Take-Off)
- [ ] Exportar a Excel/PDF
- [ ] Vínculo bidireccional con planos de ingeniería

## Arquitectura de Generación de Documentos

```
┌──────────────────────────┐
│     Interfaz de Usuario   │  React 19 + TypeScript
│  (Formularios de datos)   │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   Template Engine         │  TypeScript
│   (Datos → HTML/PDF)      │
│                           │
│  coverGenerator.ts        │  → Carátula genérica
│  pdfReport.ts             │  → Reportes de cálculo
│  documentTemplates/*.ts   │  → NUEVOS templates
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   jsPDF / html-to-image   │  Librerías de renderizado
│   @react-pdf/renderer     │  Alternativa para PDFs complejos
│   jspdf-autotable         │  Para tablas con estilo PDVSA
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   Firebase Storage        │  Almacenamiento de PDFs
│   Firestore               │  Metadatos y estados
└──────────────────────────┘
```

## Interfaces Compartidas (reutilizar de dossierTypes.ts)

```typescript
// Ya existentes en src/lib/data/pdvsa/dossierTypes.ts
interface Firma {
  cargo: 'Elaboró' | 'Revisó' | 'Aprobó' | 'Aprobó Cliente' | 'Inspector QA/QC';
  nombre: string;
  cedulaOrFirmaId: string;
  fecha: string;
  status: 'Pendiente' | 'Firmado' | 'Rechazado';
  hashQr?: string;
}

interface Revision {
  rev: string;
  fecha: string;
  descripcion: string;
  por: string;
  revisadoPor: string;
  aprobadoPor: string;
}

type FasePDVSA = 'V' | 'C' | 'D' | 'I' | 'O';
```
