# INFORME MAESTRO DE ESQUEMAS DE ENTREGABLES, INGESTA NORMATIVA Y DOSSIER DE CALIDAD PDVSA

> **Documento de Gobernanza Normativa y Planificación para Industrial-360**
> Extraído de las normas reales del Vault PDVSA (PIC-01-03-05 Rev.12 / Noviembre 2014, SI-S-04, HO-H-02, PI-02-08-01, API 1104, ASME B31G)

---

## 🎨 DIRECTRIZ MAESTRA DE BRANDING Y ENCABEZADOS EN ENTREGABLES PDF

### 1. Regla de Doble Membrete / Doble Logo en Reportes
Todas las plantillas de entregables, certificados, permisos (PTW), listas de verificación y reportes PDF generados por la aplicación **conservarán la estructura y campos exactos exigidos por PDVSA y sus filiales**, pero adaptarán su membrete visual superior incorporando **DOS LOGOTIPOS**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ [LOGO CONTRATISTA / USUARIO APP]       [TÍTULO DEL DOCUMENTO Y CÓDIGO]      [LOGO CLIENTE FINAL / OWNER]│
│      (Extremo Izquierdo)               (PDVSA PIC-01-03-05 / REV. 0)             (Extremo Derecho)   │
│   Ej. PROINTECA C.A. (Contratista)                                          Ej. PDVSA / Petrocedeño │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ PROYECTO: [TÍTULO Y CÓDIGO DEL PROYECTO EN PDVSA]                                           │
│ ORGANIZACIÓN RESPONSABLE DEL PROYECTO (ORP): [FILIAL DE PDVSA / DISTRITO]                   │
├───────────────┬─────────────────┬───────────────────┬───────────────────┬───────────────────┤
│ REVISIÓN: 0   │ FECHA: DD/MM/AA │ ELABORADO POR:    │ REVISADO POR:     │ APROBADO POR:     │
└───────────────┴─────────────────┴───────────────────┴───────────────────┴───────────────────┘
```

- **Logo Izquierdo:** Logotipo del Usuario de la App / Contratista (ej. PROINTECA C.A.).
- **Logo Derecho:** Logotipo de la Empresa Pagadora / Cliente Final (ej. PDVSA, PDVSA Gas, Petrocedeño, Chevron).
- **Validez Legal Normativa:** Cumple 100% con PDVSA PIC-01-03-05 Anexo A y B, ya que la norma exige identificar a la Empresa Consultora/Cooperativa/Contratista a la izquierda y la ORP/PDVSA a la derecha sin alterar la matriz de datos.

---

## 📑 2. ESTRUCTURA MAESTRA DE LOS 6 CAPÍTULOS DEL DOSSIER DE CALIDAD (PDVSA PIC-01-03-05)

Toda la ingesta de datos capturada en las pantallas de la aplicación se compilará automáticamente en la siguiente estructura normada de 6 Capítulos:

### 📁 CAPÍTULO 1: DATOS GENERALES Y ALCANCE
- **Portada Oficial con Doble Membrete (Anexo A):** Título del Proyecto, Código PDVSA, Código Consultora, Tabla de Revisiones (A-Z, Rev.0 Aprobado para Construcción, Rev.1..N Como Construido / As-Built), Firmas de Aprobación.
- **Encabezado y Pie (Anexo B):** Título, ORP, Código Documento, Revisión, Fecha, Página X de Y.
- **Acta de Inicio de Obra** y Memoria Descriptiva del Proyecto.

### 📁 CAPÍTULO 2: GESTIÓN DE CALIDAD Y PLANES (PCC)
- **Plan de Control de Calidad (PCC):** Matriz de Puntos de Inspección (H = Hold Point, W = Witness Point, R = Review Point).
- **Procedimientos Operativos Aprobados (SOP).**

### 📁 CAPÍTULO 3: TRAZABILIDAD Y CERTIFICADOS DE MATERIALES
- **Libro de MTR (Material Test Reports):** Certificados de Calidad de Tuberías, Válvulas y Accesorios con Heat Numbers.
- **Certificados de Electrodos y Consumibles de Soldadura** (PDVSA PI-06-06-04, E7018-H4).
- **Fichas de Inspección de Recepción de Materiales en Almacén.**

### 📁 CAPÍTULO 4: REGISTROS DE CONSTRUCCIÓN, NDT Y PRUEBAS
- **Permisos de Trabajo Seguro (PTW - PDVSA SI-S-04 Anexos A a H)** y AST (HO-H-02).
- **Calificación de Soldadores (WPQ)** y Especificación del Procedimiento de Soldadura (WPS/PQR).
- **Informes de Inspección NDT:** Inspección Visual (VT), Ultrasonido (UT), Partículas Magnéticas (MT), Tintes Penetrantes (PT) y Radiografía (RT) según API 1104 §9.
- **Certificado y Gráfica de Prueba Hidrostática/Neumática** (PDVSA PI-02-08-01, 1.5xP_diseño).

### 📁 CAPÍTULO 5: CERTIFICADOS DE CALIBRACIÓN DE EQUIPOS
- **Calibración de Gasotester:** 6 parámetros obligatorios (H2S, LEL, O2, CO, VOC, SO2).
- **Calibración de Registradores de Presión (Barton) y Manómetros.**
- **Calibración de Equipos NDT y Máquinas de Soldar.**

### 📁 CAPÍTULO 6: PLANOS AS-BUILT Y ACTA DE RECEPCIÓN
- **Planos "Como Construido" (As-Built)** codificados según PDVSA L-STC-001 / L-E-4.7 (Catálogo Anexo F).
- **Acta de Recepción Definitiva de la Obra** firmada por el Custodio de la Instalación.

---

## 🛡️ 3. ANEXOS SIHO-A: FORMATOS DE PERMISOLOGÍA (PDVSA SI-S-04 / HO-H-02)

### Permisos de Trabajo (SI-S-04 Anexos A a H):
- **Anexo A (Frío):** Trabajos manuales sin generación de chispa.
- **Anexo B (Caliente):** Esmerilado, corte, soldadura, oxicorte. Requiere medición de gasotester y manguera contra incendio cargada.
- **Anexo C (Espacio Confinado):** Entradas a tanques, excavaciones >1.2m, recipiente. Requiere vigía continuo y medición de gasteser 6 gases.
- **Anexo D (Excavación):** Requiere plano de interferencias subterráneas.
- **Anexo E (Radiografía):** Delimitación de zona radioactiva.
- **Anexo F (Izamiento de Cargas):** Plan de Rigging (PI-15-02-01).
- **Anexo G (Eléctrico):** Desconexión y enclavamiento.
- **Anexo H (LOTO / Aislamiento de Energía):** PDVSA SI-S-28.

### Formato de AST (HO-H-02 Anexo B):
- **Estructura de 8 Pasos:**
  1. Secuencia del Trabajo
  2. Peligros Existentes o Potenciales
  3. Consecuencias / Riesgo
  4. Controles / Medidas Preventivas
  5. Responsable de Ejecución
  6. Evaluación del Riesgo Inherentemente (Frecuencia x Consecuencia)
  7. Evaluación del Riesgo Residual
  8. Escalamiento de Firma: Si Riesgo Residual $\ge 10$, requiere firma obligatoria del Jefe de Operaciones/Planta.
