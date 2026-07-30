# 🏛️ INVENTARIO MAESTRO DE PLANTILLAS Y ENTREGABLES OFICIALES

**Código del Documento:** `DOC-GOV-2026-003`  
**Ubicación:** `docs/governance/INVENTARIO_MAESTRO_PLANTILLAS_Y_ENTREGABLES.md`  
**Fecha:** 29 de Julio de 2026  
**Estado:** Auditado conforme a Normas PDVSA, API, ASME, COVENIN y Leyes de la República Bolivariana de Venezuela  

---

## 1. INTRODUCCIÓN Y REGLA DE CERO ALUCINACIÓN

El presente inventario codifica la totalidad de los formatos, reportes en PDF y exportaciones en Excel (`.xlsx`) generados determinísticamente por la plataforma **Industrial Control 360**. Cada documento cuenta con una estructura inmutable, normativas asociadas, campos obligatorios y protocolo de firma digital conforme a la Norma **SUSCERTE N° 045**.

---

## 2. CATÁLOGO DE ENTREGABLES POR MÓDULO OPERATIVO

### 🛡️ MÓDULO 1: SEGURIDAD INDUSTRIAL, SALUD Y AMBIENTE (SIHO-A)

#### 1.1 Permiso de Trabajo Seguro (PTS / PTW)
- **Código de Formato:** `FOR-SIHO-001` (Norma PDVSA IR-S-04 / SI-S-20).
- **Formato:** PDF Dinámico Vectorial A4 / Carta.
- **Campos Obligatorios:** N° Consecutivo PTS, Tipo de Maniobra (Frío, Caliente, Espacio Confinado, Izamiento), Descripción del Trabajo, Lecturas de 6 Gases ($H_2S$, $LEL$, $O_2$, $CO$, $VOC$, $SO_2$), Serie/Calibración del Gasotester, EPP Requeridos, Firma del Custodio de Instalación (Receptor) y Firma del Ejecutor (Emisor).
- **Protocolo de Validación:** Bloqueo automático si $H_2S > 10\text{ ppm}$ o $LEL > 0\%$. Hash SHA-256 e indicativo QR.

#### 1.2 Análisis de Seguridad en el Trabajo (AST)
- **Código de Formato:** `FOR-SIHO-002` (Norma PDVSA HO-H-02).
- **Formato:** PDF Hoja Horizontal (Landscape) A4.
- **Campos Obligatorios:** 8 Pasos de Maniobra, Peligros Identificados, Riesgos Asociados, Medidas de Control, Evaluación de Riesgo Inicial vs Residual ($R = P \times C$), y Firma Digital obligatoria del Coordinador SIHO-A si Riesgo Residual $\ge 10$.

---

### ⚙️ MÓDULO 2: CALIDAD, SOLDADURA Y DOSSIER TÉCNICO (QA/QC)

#### 2.1 Certificado de Liberación As-Built de Isométrico
- **Código de Formato:** `FOR-QAQC-006` (Norma PDVSA L-STC-001 / PIC-01-03-05 / API 1104).
- **Formato:** PDF Vertical A4 con Márgenes de 15mm y Doble Membrete (PROINTECA C.A. / PDVSA).
- **Campos Obligatorios:** N° de Isométrico, Tag de Línea, Presión/Temp de Diseño, Matriz de Trazabilidad de Juntas (Junta, Spool, Estampa de Soldador WPQ, N° de Colada MTR, Especificación del Material, Método NDT, N° de Informe NDT, Status 🟢 Aprobado) y Dictamen Final de Liberación.

#### 2.2 Dossier de Calidad en 6 Capítulos (Libro Final de Obra)
- **Código de Formato:** `DOSSIER-PIC-01-03-05` (Norma PDVSA PIC-01-03-05 / MPIC-02-01-03).
- **Formato:** Compilación PDF Indexada de 1,000+ Páginas con Marcas de Agua, Hipervínculos e Índice Navegable.
- **Capítulos Incluidos:**
  1. Capítulo 1: Datos Generales, Actas de Inicio/Entrega y Contrato.
  2. Capítulo 2: Plan de Control de Calidad (PCC) y Certificados de Equipos/Herramientas.
  3. Capítulo 3: Registro MTR de Materiales y Trazabilidad de Coladas (Heat Numbers).
  4. Capítulo 4: Calificación de Procedimientos (WPS/PQR) y Estampas de Soldadores (WPQ - ASME IX).
  5. Capítulo 5: Informes de Ensayos No Destructivos (NDT: VT, RT, UT, PT, MT) e Inspección DICONDE.
  6. Capítulo 6: Planos As-Built e Isométricos Liberados.

---

### 📜 MÓDULO 3: CONTRATOS, VALUACIONES Y CÓMPUTOS MÉTRICOS

#### 3.1 Boleta de Valuación de Obra SIDCON
- **Código de Formato:** `FOR-VAL-001` (Norma PDVSA PIC-03-01-19 / Sistema SIDCON).
- **Formato:** PDF Vertical / Horizontal A4 y Exportación NATIVA Excel `.xlsx` estilizado.
- **Campos Obligatorios:** N° de Valuación, Período, Cuadro de Partidas WBS, Cantidad Contratada vs Ejecutada, Aumentos/Disminuciones, Amortización de Anticipo, Retención Laboral (5%), Fondo de Garantía (10%) y Monto Neto a Pagar en USD.

#### 3.2 Libro de Cómputos Métricos
- **Código de Formato:** `FOR-COM-002` (Norma COVENIN 2000-92 / PDVSA O-CIV).
- **Formato:** Archivo Excel NATIVO `.xlsx` con Membrete Corporativo, Encabezados Azul Oscuro (#0f172a), Anchos Auto-ajustados y Fórmulas `=SUM(...)`.
- **Campos Obligatorios:** Partida WBS, Descripción, Ubicación/Tramo, Unidad de Medida, N° de Piezas, Dimensiones (Largo, Ancho, Alto), Cantidad Total y Memoria de Cálculo.

---

## 3. PROTOCOLO DE EXPORTACIÓN EXCEL NATIVO `.XLSX`

Para garantizar el máximo nivel de presentación ejecutiva:
1. **Membrete Corporativo:** Filas 1 a 3 reservadas para el Nombre de la Contratista (PROINTECA C.A.), Empresa Cliente (PDVSA/Chevron) y Título del Libro.
2. **Estilo de Encabezados:** Relleno Azul Industrial `#0f172a`, fuente blanca en negrita, bordes finos.
3. **Formato de Celdas:** Números con separadores de miles y 2 decimales (`#,##0.00`), valores de moneda en USD (`$#,##0.00`) y unidades explícitas ($m^3, m, kg$).
4. **Fórmulas Dinámicas:** Fila final de Totales utilizando fórmulas nativas `=SUM(C6:C25)`.
