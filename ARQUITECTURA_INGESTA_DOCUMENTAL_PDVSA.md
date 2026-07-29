# 🏗️ ARQUITECTURA DE INGESTA & GENERACIÓN DE DOCUMENTOS PDVSA (PIC-01-03-05)

```mermaid
graph TD
  %% DEFINICIÓN DE ESTILOS DE NODOS
  classDef actor fill:#0b2239,stroke:#ff6b00,stroke-width:2px,color:#ffffff;
  classDef ingesta fill:#1e293b,stroke:#3b82f6,stroke-width:1px,color:#ffffff;
  classDef core fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#ffffff;
  classDef doc fill:#18181b,stroke:#eab308,stroke-width:1px,color:#ffffff;

  %% 1. ACTORES Y DEPENDENCIAS DE CAMPO / OFICINA
  subgraph ACTORES ["👥 ACTORES & DEPENDENCIAS (Ingesta de Datos)"]
    A1["🛡️ Inspector SIHO-A / HSE"]:::actor
    A2["📐 Topógrafo / Geodesta"]:::actor
    A3["⚙️ Ingeniero de Proceso / Mecánico"]:::actor
    A4["🚜 Supervisor de Campo"]:::actor
    A5["💼 Analista de Procura / Costos"]:::actor
    A6["👔 Gerente de Proyecto"]:::actor
  end

  %% 2. FORMULARIOS DE CAPTURA DE DATOS (INPUTS)
  subgraph INPUTS ["📥 FORMULARIOS DE CAPTURA EN LA APP (Inputs)"]
    I1["Captura ARTs, PTW, Matriz de Riesgos y HHT"]:::ingesta
    I2["Ingesta GPS, Altimetría, KML y Suelos"]:::ingesta
    I3["Hojas de Datos, Cómputos y P&IDs"]:::ingesta
    I4["Partes Diarios, Cuadrillas, Fotos y Avance WBS"]:::ingesta
    I5["Requisiciones, Cotizaciones, Gastos y Facturas"]:::ingesta
    I6["Hitos, Actas y Fase del Proyecto (V-C-D-I-O)"]:::ingesta
  end

  %% CONEXIÓN ACTORES A INPUTS
  A1 --> I1
  A2 --> I2
  A3 --> I3
  A4 --> I4
  A5 --> I5
  A6 --> I6

  %% 3. MOTOR DE DATOS & CODIFICACIÓN
  subgraph CORE ["🧠 MOTOR DE DATOS CENTRAL IC360"]
    DATA["🗄️ Firestore Database & Data Engine\n• Codificación Automática: AABBCCDDEE-FFGHI-JKLLMMM\n• Control de Revisiones: Rev. A/B ➔ Rev. 0 ➔ Rev. 1"]:::core
  end

  I1 & I2 & I3 & I4 & I5 & I6 --> DATA

  %% 4. DOCUMENTOS GENERADOS SEGÚN NORMA PDVSA PIC-01-03-05
  subgraph OUTPUTS ["📄 GENERACIÓN AUTOMÁTICA DE ENTREGABLES (Outputs)"]
    subgraph FASE_V ["Visualizar (Fase V)"]
      D1["• DSD1 (Soporte de Decisión)\n• Fichas de Control\n• Análisis Preliminar de Peligro\n• PEP Clase V"]:::doc
    end

    subgraph FASE_C ["Conceptualizar (Fase C)"]
      D2["• DSD2 (Soporte de Decisión)\n• DFP / Balances de Masa\n• Estudio Impacto Ambiental\n• Levantamiento de Campo"]:::doc
    end

    subgraph FASE_D ["Definir (Fase D)"]
      D3["• DSD3 (Soporte de Decisión)\n• P&IDs e Hojas de Datos\n• Cómputos Métricos Clase III/II\n• Requisiciones de Compras"]:::doc
    end

    subgraph FASE_I ["Implantar (Fase I)"]
      D4["• DSD4 (Soporte de Decisión)\n• Planos Aprobados APC\n• Manuales de Operación/PLC\n• Planos As-Built"]:::doc
    end

    subgraph FASE_O ["Operar (Fase O)"]
      D5["• Completación Mecánica\n• Actas de Recepción Prov./Def.\n• Balance Final Materiales\n• Dossier de Obra Final"]:::doc
    end
  end

  DATA --> FASE_V & FASE_C & FASE_D & FASE_I & FASE_O
```

---

## 📊 MATRIZ DE INGESTA VS. DOCUMENTOS SALIDA (PIC-01-03-05)

| Actor / Dependencia | Módulo de Captura en App | Ingesta de Datos (Inputs) | Documentos PIC-01-03-05 Generados (Outputs) |
| :--- | :--- | :--- | :--- |
| **🛡️ Inspector SIHO-A** | `src/pages/SihoPtw.tsx` | Permisos PTW, ART, AST, Charlas, HHT, Incidentes | - **S-01:** Plan de Seguridad y Salud<br>- **APP:** Análisis Preliminar de Peligros<br>- **SIHO-03:** Reportes de Auditorías HSE |
| **📐 Topógrafo / Geodesta** | `src/pages/LogisticsMap.tsx` | Coordenadas GPS, archivos KML/KMZ, Altimetría, Ensayos de Suelos | - **O-01:** Informes de Levantamiento de Campo<br>- **O-03/04:** Planos de Ubicación y Perfiles Longitud |
| **⚙️ Ingeniero de Proceso** | `src/pages/EngineeringTools.tsx` | Bases de Diseño, Presiones, Caudales, Diámetros, Especificaciones | - **P-01:** Hojas de Datos de Procesos<br>- **P-13:** Diagrama de Flujo de Procesos (DFP)<br>- **M-01:** Memorias de Cálculo |
| **🚜 Supervisor Campo** | `src/pages/FieldReports.tsx` | Parte Diario, Asistencia Cuadrillas, Horas Maquinaria, Fotos Evidencia | - **G-02:** Cronograma de Ejecución Real<br>- **G-03:** Informes de Gestión Semanal/Mensual<br>- **G-04:** Registros de Avance Físico |
| **💼 Procura & Costos** | `src/pages/Expenses.tsx` | Cotizaciones, Requisiciones, Facturas, Certificados de Recepción | - **G-05:** Estimados de Costos (Clase V a I)<br>- **PRO-01:** Requisiciones de Materiales y Equipos<br>- **PRO-02:** Evaluación de Ofertas Técnicas |
| **👔 Gerente / Calidad** | `src/pages/Valuations.tsx` | Hitos, Actas, Ensayos NDT Soldadura, Avance Ponderado | - **DSD1 a DSD4:** Documentos Soporte de Decisión<br>- **Q-01:** Planes de Calidad y Puntos de Inspección<br>- **O-01/14:** Actas de Completación Mecánica y Recepción |

---

> [!TIP]
> **Formato de Portada Estandarizado (Anexo A):** Todos los documentos PDF/Word generados por este motor incluyen automáticamente el logo oficial, la estructura de código `AABBCCDDEE-FFGHI-JKLLMMM`, la tabla de revisiones (`Rev. A/B/0/1/2`) y las firmas de Elaborado, Revisado y Aprobado.
