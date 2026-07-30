# 📐 MATRIZ MULTIDISCIPLINAR Y HOJA DE RUTA MANUAL DE INGENIERÍA PDVSA

**Código del Documento:** `DOC-PLAN-2026-008`  
**Ubicación:** `docs/planificacion/MATRIZ_MULTIDISCIPLINAR_Y_MANUAL_INGENIERIA.md`  
**Fecha:** 29 de Julio de 2026  
**Estado:** Hoja de Ruta de Expansión Disciplinar O&G  

---

## 1. ALCANCE MULTIDISCIPLINAR DE PROYECTOS INDUSTRIALES OIL & GAS

Los proyectos petroleros de superficie (macollas, estaciones de flujo, plantas compresoras, oleoductos) requieren la integración de **7 Disciplinas Industriales**. La plataforma Industrial Control 360 ha sido estructurada para cubrir los requerimientos normativos de cada área:

```
                                  ┌─────────────────────────────────────────┐
                                  │      INDUSTRIAL CONTROL 360 PLATFORM    │
                                  └────────────────────┬────────────────────┘
                                                       │
         ┌───────────────┬───────────────┬─────────────┼─────────────┬───────────────┬───────────────┐
         ▼               ▼               ▼             ▼             ▼               ▼               ▼
   ┌───────────┐   ┌───────────┐   ┌───────────┐ ┌───────────┐ ┌───────────┐   ┌───────────┐   ┌───────────┐
   │ MECÁNICA  │   │   CIVIL   │   │ELECTRICI. │ │INSTRUMEN. │ │ ESTÁTICOS │   │  SIHO-A   │   │ AMBIENTAL │
   │ & TUBERÍAS│   │ & TIERRAS │   │  & E&I    │ │ & CONTROL │ │ & PROCESO │   │ Y RIESGO  │   │  & RASDA  │
   └───────────┘   └───────────┘   └───────────┘ └───────────┘ └───────────┘   └───────────┘   └───────────┘
```

---

## 2. COBERTURA DE DISCIPLINAS SEGÚN NORMAS PDVSA Y MANUAL DE INGENIERÍA

### 🛠️ 2.1 Disciplina 1: Mecánica, Tuberías y Soldadura (100% Implementado)
- **Normas:** ASME B31.3, ASME B31.4, ASME B31.8, API 1104, ASME IX.
- **Entregables en App:** Trazabilidad de Juntas ($J-001$), Isométricos CAD/SVG, Registro de Soldadores WPQ, Certificado As-Built NDT.

### 🏗️ 2.2 Disciplina 2: Civil, Movimiento de Tierra y Estructuras (Implementado & Enriqueciendo)
- **Normas:** PDVSA L-TP-001, COVENIN 2000-92, ACI 318.
- **Entregables en App:** Cómputos Métricos de Excavación de Zanja, Volumen de Concreto para Fundaciones de Bombas y Macollas, Valuaciones SIDCON.
- **Próximo Desarrollo (Sprint 13):** Registro de Ensayos de Densidad de Campo (Proctor / Cono de Arena).

### ⚡ 2.3 Disciplina 3: Electricidad & Clasificación de Áreas (Próximo Desarrollo)
- **Normas:** PDVSA N-201, NFPA 70 (NEC), IEEE 80.
- **Entregables en App:** Mapeo de Clasificación de Áreas Peligrosas (Clase I, Div 1/2), Protocolo de Megado de Cables, Puesta a Tierra y Diagramas Unifilares.

### 🎛️ 2.4 Disciplina 4: Instrumentación, Automatización & Control (Próximo Desarrollo)
- **Normas:** PDVSA K-301, ISA 5.1, ISA 84 (SIL).
- **Entregables en App:** Hoja de Datos de Instrumentos (Transmisores de Presión/Temperatura), Lazos de Control P&ID, Certificados de Calibración de Válvulas de Alivio (PSV) y SCADA PAMS.

### 🛢️ 2.5 Disciplina 5: Equipos Estáticos, Separadores & Proceso (100% Implementado)
- **Normas:** API 650, API 653, API 510, PDVSA 906 (Separadores de Producción).
- **Entregables en App:** Inspección de Tanques de Almacenamiento, Hot Tap & Stopple PAMS (API RP 2201), Cálculo de Espesores Mínimos y Vida Remanente.

### 🛡️ 2.6 Disciplina 6: Seguridad Industrial SIHO-A & LOTO (100% Implementado)
- **Normas:** PDVSA SI-S-04, PDVSA HO-H-02 (AST), PDVSA SI-S-28 (LOTO).
- **Entregables en App:** PTW 6 Gases, AST 8 Pasos, Carnet PVC QR en Portón, Bloqueo Candados Digitales LOTO.

### 🌿 2.7 Disciplina 7: Gestión Ambiental & RASDA (100% Implementado)
- **Normas:** PDVSA MA-01-02-12, Anexo A MA-02-01-12.
- **Entregables en App:** Plan de Gestión Ambiental (PGA), Manifiesto RASDA para Desechos Peligrosos, Inspección de Trampas de Grasa.

---

## 3. ADMINISTRACIÓN DE COSTOS Y CONTRATOS (100% CUBIERTO SEGÚN HERMES Y vault)

Confirmamos que la suite de Costos y Contratos cubre la totalidad de la normativa nacional:
- **APU 4 Rubros:** Mano de Obra, Equipos, Materiales, Indirectos + Utilidad.
- **FCAS / FCO:** Matriz de Prestaciones de la Convención Colectiva Petrolera CPTT (425.8%).
- **BC3:** Importación y exportación normalizada FIEBDC-3 (`.bc3`).
- **Valuaciones ROE:** Hojas de Valuación SIDCON conforme a **PDVSA PIC-03-01-19**.
- **Standby & MOC:** Reclamos por tiempos muertos imputables conforme a **PDVSA IR-S-06**.
