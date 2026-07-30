# 🏛️ INFORME EXHAUSTIVO DE ESTADO GENERAL DEL PROYECTO INDUSTRIAL CONTROL 360 Y MATRIZ MULTI-DISCIPLINAR

**Código del Documento:** `DOC-REP-2026-001`  
**Ubicación de Destino:** `docs/planificacion/INFORME_GENERAL_DEL_PROYECTO_Y_MATRIZ_MULTIDISCIPLINAR.md`  
**Fecha:** 29 de Julio de 2026  
**Estado del Repositorio:** `main` @ `ef46ddc` (`feat(siho): expand gas monitoring and add AST form`)  

---

## 1. ESTADO GENERAL DE SPRINTS Y SALUD DEL PROYECTO

### 1.1 Resumen de Sprints Completados (Sprint 0.5 a Sprint 6)

El desarrollo del sistema **Industrial Control 360 (The Oil & Gas Operating System)** ha seguido una metodología ágil rigurosa con entrega de incrementos funcionales 100% conectados a datos reales y sin mock data en producción:

* **🏃 Sprint 0.5 — Core Foundation & Arquitectura Multi-Tenant (Tickets IC360-001 a IC360-004):**
  - **Jerarquía Firestore Multi-Tenant:** Implementación de la estructura inmutable `/organizations/{orgId}/projects/{projId}/...`.
  - **Reglas de Seguridad isoladas:** Configuración de `firestore.rules` basada en Custom Claims (`orgId`, `role`).
  - **Sistema de UI Primitivo y Tema:** Estandarización estética "Industrial Executive" (`src/components/ui/`), migración a `@theme` CSS dinámico en `src/index.css` controlado por `ThemeContext.tsx` y soporte nativo para Modo Oscuro real.
  - **Branding Organizacional:** Soporte de Kit de Marca corporativo (`BrandKit`) por inquilino en `Settings.tsx`.

* **🏃 Sprint 1 — Motor de Interoperabilidad & Parsers Financieros/Cronogramas (Tickets IC360-005 a IC360-007):**
  - **Parser Primavera P6 & MS Project:** Ingesta e interpretación real de cronogramas `.xer` y `.xml` en `src/lib/parsers/xerParser.ts` e `InteroperabilityEngine.tsx`.
  - **Parser Presto FIEBDC-3 (`.bc3`):** Extracción de árbol de partidas y Análisis de Precios Unitarios (APU) desglosados en Equipos, Materiales, Mano de Obra e Indirectos (`src/lib/parsers/bc3Parser.ts`).
  - **Visualizador WBS/Gantt:** Carga interactiva de avance físico y financiero.

* **🏃 Sprint 2 — Multi-Tenant Deep Integration & Security Rules Verification (Ticket IC360-008):**
  - **Pruebas de Aislamiento en Emulador:** Cobertura automatizada en `src/__tests__/securityRules.test.ts` mediante `@firebase/rules-unit-testing`.
  - **Validación Cross-Tenant:** Garantía de bloqueo absoluto (`PERMISSION_DENIED`) ante intentos de acceso entre organizaciones distintas (`prointeca` vs `semax_pino`).
  - **CollectionGroup Isolation:** Reglas de consulta agregada filtradas obligatoriamente por `where('orgId', '==', orgId)`.

* **🏃 Sprint 3 — QA/QC Soldadura, Trazabilidad de Juntas & NDT DICONDE (Tickets IC360-009 a IC360-011):**
  - **Módulo `QaQcWelding.tsx`:** Registro y seguimiento individual de juntas de tubería ($J\text{-}001, J\text{-}002, \dots$).
  - **Trazabilidad MTR / Heat Numbers:** Vinculación de coladas de tubos/bridas con Certificados de Calidad de Materiales.
  - **Bóveda de Calificación de Soldadura:** Registro de especificaciones WPS, PQR y estampa de soldador WPQ (ASME IX / API 1104).
  - **Ensayos No Destructivos (NDT):** Módulo de reporte para VT, RT, UT, PT y MT con integración del estándar ASTM DICONDE (`.dcm`).

* **🏃 Sprint 4 — Integridad de Tuberías ILI & PAMS Transversal (Tickets IC360-012 a IC360-013):**
  - **Ingesta de Inspección Interna ILI (Pigging):** Importación de corridas ROSEN ROSOFT (`.POF`/`.UPT`) en `IntegrityIli.tsx`.
  - **Evaluación de Resistencia Remanente:** Implementación del motor de cálculo $P_{safe}$ bajo norma **ASME B31G (Ec. 3a) / RSTRENG** con factor Folias $M$.
  - **Hot-Tap & Stopple (`HotTapSchemes.tsx`):** Intervenciones en caliente bajo presión acorde a **API 2201**, cálculo de espesor mínimo de pared para soldadura y tasa de enfriamiento.
  - **PAMS & Red SCADA D3.js:** Dashboard con gráfico de red interactivo D3 y gestión de fases de proyecto (GPG / FEL V/C/D/I/O).

* **🏃 Sprint 5 — Dossier As-Built & B2B Client Portal (Ticket IC360-014):**
  - **Compilador del Dossier de Calidad (`DossierCompiler.tsx`):** Ensamblaje automatizado del Libro Final de Obra conforme a **PDVSA L-STC-001** y **PDVSA PIC-01-03-05**.
  - **Firma Digital & Inmutabilidad:** Generación de PDFs indexados con Hash criptográfico SHA-256 e indicativo QR de autenticidad.
  - **Portal del Cliente / Fiscalizador (`ClientPortalBuilder.tsx` / `ClientPortalView.tsx`):** Vista de supervisión en tiempo real con permisos de lectura `cliente_readonly` para entes contratantes (PDVSA, Chevron, Repsol).

* **🏃 Sprint 6 — Permisología SIHO-A Avanzada, 6 Gases & Formulario AST (Ticket IC360-015):**
  - **Monitoreo Multigas en PTW (`SihoPtw.tsx`):** Control estricto de 6 gases ($H_2S$, $LEL$, $O_2$, $CO$, $VOC$, $SO_2$), bloqueo automático si $H_2S > 10$ ppm o $LEL > 0\%$, y trazabilidad de serie/calibración del Gasotester.
  - **Formulario AST de 8 Pasos (`AstForm.tsx`):** Estandarización de Análisis de Seguridad en el Trabajo acorde a **PDVSA HO-H-02**.
  - **Matriz de Riesgo Inicial vs. Residual:** Cálculo $R = P \times C$ con firma digital obligatoria del Coordinador SIHO-A si el Riesgo Residual es $\ge 10$.

---

### 1.2 Estado de Compilación, Pruebas y Arquitectura Multi-Tenant

| Dimensión Técnica | Estado Actual | Detalles de Verificación |
| :--- | :---: | :--- |
| **Compilación TypeScript (`tsc --noEmit`)** | 🟢 **0 Errores (Clean)** | Código 100% tipado, sin advertencias de tipos implícitos `any` ni errores de sintaxis. |
| **Pruebas Unitarias & Normativas (Vitest)** | 🟢 **23 Tests Aprobados** | 7 suites de pruebas ejecutadas con éxito: cálculos normativos ASME B31G, ASME B31.3 ($t_{min}$), API 570 y reglas de seguridad multi-tenant. |
| **Arquitectura Multi-Tenant** | 🟢 **Aislamiento Total** | Jerarquía `/organizations/{orgId}/projects/{projId}` forzada en `firestore.rules` y soportada por arquitectura de dos capas (Security Claims + Functional Roles). |
| **Integración IA Proxy** | 🟢 **100% Proxy Servidor** | Todas las llamadas a modelos Gemini pasan por `src/lib/geminiProxy.ts` → `/api/callGeminiProxy`, protegiendo la clave de API. |
| **Sistema de Tema & Dark Mode** | 🟢 **Unificado** | Bloque único `@theme` en `src/index.css`, con overrides `.dark` en `<html>` mediante `ThemeContext.tsx`. |

---

## 2. MATRIZ MULTIDISCIPLINAR DE COBERTURA DE LA INDUSTRIA PETROLERA (PDVSA / INTERNACIONAL)

La plataforma **Industrial Control 360** integra de forma nativa las 7 disciplinas fundamentales de la ingeniería de proyectos en Oil & Gas:

```
                           MATRIZ MULTIDISCIPLINAR DE 7 CAPAS
                           
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │ 1. Mecánica y Tuberías   │ ASME B31.3 / B31.4 / B31.8, API 1104, ASME IX, ISO  │
  ├──────────────────────────┼──────────────────────────────────────────────────────┤
  │ 2. Civil y Superficie    │ Cómputos, Movimiento de Tierra, Macollas, Concreto    │
  ├──────────────────────────┼──────────────────────────────────────────────────────┤
  │ 3. E & I                 │ P&ID, Lazos, PDVSA N-201 Clasif. Áreas, SCADA D3     │
  ├──────────────────────────┼──────────────────────────────────────────────────────┤
  │ 4. Equipos Estáticos     │ API 650/653, PDVSA 906 Separadores, API 510, B31G    │
  ├──────────────────────────┼──────────────────────────────────────────────────────┤
  │ 5. Seguridad SIHO-A      │ PDVSA SI-S-04, PTW 6 Gases, AST HO-H-02, HHT         │
  ├──────────────────────────┼──────────────────────────────────────────────────────┤
  │ 6. Gestión Ambiental     │ PDVSA MA-01-02-12, Anexo A (PGA), Trampas/Lodos      │
  ├──────────────────────────┼──────────────────────────────────────────────────────┤
  │ 7. Contratos y Control   │ SIDCON, APU BC3, Valuaciones PIC-03-01-19, Standby   │
  └─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 🛢️ DISCIPLINA 1: MECÁNICA Y TUBERÍAS (*PIPING & PIPELINES*)

* **Normas y Estándares Integrados:**
  - **ASME B31.3:** Tuberías de Proceso en Refinerías y Plantas Químicas.
  - **ASME B31.4 / B31.8:** Tuberías de Transporte de Hidrocarburos Líquidos y Gas Natural.
  - **API 1104:** Soldadura de Tuberías e Instalaciones Relacionadas.
  - **ASME Secc. IX:** Calificación de Procedimientos de Soldadura (WPS), PQR y WPQ.
  - **PDVSA L-STC-001:** Estandarización de Planos As-Built e Isométricos de Tubería.

* **Funcionalidades en el Sistema (`QaQcWelding.tsx`, `IsometricViewer.tsx`, `EngineeringTools.tsx`):**
  1. **Visor Vectorial de Isométricos (`IsometricViewer.tsx`):** Carga y renderizado SVG/DXF de planos isométricos con marcadores interactivos de juntas ($J\text{-}001, J\text{-}002$).
  2. **Trazabilidad 100% de Juntas & MTR:** Control de diámetro, cédula (Schedule), coladas (*Heat Numbers*) del tubo A y tubo B, y código de estampa del soldador (`W-042`).
  3. **Código de Colores NDT en Isométrico:** 🟢 Aprobado (VT + RT/UT), 🔴 Rechazado / En Reparación ($R_1$), 🟡 Pendiente NDT, ⚪ Proyectado / Sin Soldar.
  4. **Hot Tapping API 2201 (`HotTapSchemes.tsx`):** Cálculo de espesor mínimo de pared para soldadura en caliente bajo presión y prevención de perforación por quemadura (*burn-through*).
  5. **Calculadora de Bridas y Torque (ASME B16.5 / B16.47 / API 6A):** Matriz completa de clases 150# a 2500# (ANSI) y 2K a 15K (API), diámetros 1/2" a 48", número de espárragos, longitud, tamaño de dados y procedimiento de apriete en estrella (Star Torquing) a 30%, 60% y 100%.

---

### 🏗️ DISCIPLINA 2: CIVIL Y OBRAS DE SUPERFICIE

* **Normas y Estándares Integrados:**
  - **PDVSA O-CIV:** Especificaciones Técnicas Generales para Obras Civiles en Estaciones y Plantas.
  - **COVENIN 2000-92:** Carreteras, Edificaciones y Obras Hidráulicas (Cómputos Métricos y Partidas).
  - **COVENIN 1756:** Edificaciones Sismorresistentes.

* **Funcionalidades en el Sistema (`FieldReports.tsx`, `EngineeringTools.tsx`, `Tasks.tsx`):**
  1. **Cómputos Métricos & Movimiento de Tierra:** Calculadora integrada de volumen de excavación de zanjas para tuberías enterradas, relleno compresión, conformación de taludes ($1:1$, $1:1.5$) y esponjamiento del suelo.
  2. **Macollas de Perforación y Producción (*Well Pads*):** Mantenimiento y nivelación de parcelas de localización de pozos en la Faja Petrolífera del Orinoco (FPO).
  3. **Obras Civiles de Superficie:** Registro y control de vaciado de concreto ($\text{m}^3$, resistencia $f'c = 210, 250, 280\text{ kg/cm}^2$) para pedestales de compresores, fundaciones de separadores, bases de bombas de cavidad progresiva (BCP) y diques de contención secundario en patios de tanques (110% del volumen del tanque mayor).
  4. **Geolocalización & Vialidad (`LogisticsMap.tsx`):** Control GIS de frentes de trabajo, rutas de acceso, puentes y planación topográfica.

---

### ⚡ DISCIPLINA 3: ELECTRICIDAD E INSTRUMENTACIÓN (E&I)

* **Normas y Estándares Integrados:**
  - **PDVSA N-201:** Clasificación de Áreas Peligrosas en Instalaciones Petroleras.
  - **API RP 500 / API RP 505:** *Recommended Practice for Classification of Locations for Electrical Installations at Petroleum Facilities*.
  - **ISA-5.1:** Símbolos e Identificación de Instrumentación (Diagramas P&ID).
  - **IEEE 142 / NFPA 70 (NEC):** Puesta a Tierra e Instalaciones Eléctricas Industriales.

* **Funcionalidades en el Sistema (`EngineeringTools.tsx`, `IntegrityIli.tsx`, `HotTapSchemes.tsx`):**
  1. **Diagramas P&ID & Lazos de Control:** Mapeo de instrumentación de campo (Transmisores de Presión PIT, Temperatura TIT, Nivel LIT, Válvulas de Cierre de Emergencia ESD/SDV).
  2. **Clasificación de Áreas Peligrosas (PDVSA N-201):** Validación de especificación de equipos eléctricos (encerramientos Ex-d a prueba de explosión, tableros NEMA 4X / NEMA 7, barreras intrínsecamente seguras).
  3. **PAMS Red SCADA D3.js:** Visualización interactiva de topología de red industrial, enlaces Ethernet IP, Modbus RTU / Fieldbus Foundation y estado de RTUs en cabezales de pozo.
  4. **Certificación de Lazos de Instrumentación:** Protocolos de pruebas de continuidad, meggado de cables de fuerza y calibración de instrumentos de medición.

---

### 🛢️ DISCIPLINA 4: EQUIPOS ESTÁTICOS Y PROCESO

* **Normas y Estándares Integrados:**
  - **API 650:** *Welded Tanks for Oil Storage*.
  - **API 653:** *Tank Inspection, Repair, Alteration, and Reconstruction*.
  - **PDVSA 906-5-E-01:** Especificación de Diseño de Separadores de Producción y Prueba.
  - **API 510:** *Pressure Vessel Inspection Code*.
  - **ASME Secc. VIII Div. 1/2:** Reglas para la Construcción de Recipientes a Presión.
  - **ASME B31G / RSTRENG:** Resistencia Remanente de Tuberías y Equipos Corroídos.

* **Funcionalidades en el Sistema (`IntegrityIli.tsx`, `EngineeringTools.tsx`, `FleetEquipment.tsx`):**
  1. **Cálculo de Tanques API 650/653:** Calculadora de volumetría de tanques verticales de almacenamiento de crudo/agua, tabla de aforo, evaluación de espesor de envolvente (*Shell Course*) y cálculo de vida remanente según tasa de corrosión ($\text{mm/año}$).
  2. **Separadores de Producción (PDVSA 906):** Monitoreo de operabilidad de separadores de prueba/producción en macollas, control de bafles, malla atrapaniebla (*Demister Pad*) y depuradores de gas.
  3. **Evaluación de Resistencia Remanente $P_{safe}$ (ASME B31G):** Algoritmo automatizado que procesa profundidad de corrosión ($d$), longitud de pérdida de metal ($L$) y diámetro exterior ($D$) para determinar la presión operativa máxima admisible (MAOP) reducida.
  4. **Inspección Interna ILI Pigging (ROSEN ROSOFT):** Mapeo 3D de picaduras de corrosión internas/externas, abolladuras (*dents*) y grietas en líneas de flujo.

---

### 🛡️ DISCIPLINA 5: SEGURIDAD INDUSTRIAL (SIHO-A)

* **Normas y Estándares Integrados:**
  - **PDVSA SI-S-04:** Requisitos de Seguridad Industrial, Higiene Ocupacional y Ambiente para Contratistas.
  - **PDVSA PI-02-01-01:** Guía para la Elaboración del Plan de SIHO-A en Proyectos.
  - **PDVSA HO-H-02:** Guía Técnica para el Análisis de Seguridad en el Trabajo (AST).
  - **OSHA 1910.146:** Trabajos en Espacios Confinados.

* **Funcionalidades en el Sistema (`SihoPtw.tsx`, `AstForm.tsx`):**
  1. **Permisos de Trabajo Seguro (PTS / PTW):** Emisión digital por tipo de trabajo con flujo emisor/receptor y firma electrónica inalterable.
  2. **Monitoreo Continuo de 6 Gases:** Registros obligatorios de gasotester calibrado para $H_2S$ (ppm), $LEL$ (%), $O_2$ (%), $CO$ (ppm), $VOC$ (ppm) y $SO_2$ (ppm). Bloqueo automático del PTS si $H_2S > 10\text{ ppm}$, $LEL > 0\%$ u $O_2 < 19.5\%$.
  3. **AST de 8 Pasos (`AstForm.tsx`):** Desglose estructurado de Secuencia de Pasos, Peligros Identificados, Riesgos Asociados, Medidas de Control y Riesgo Inicial vs Residual ($R = P \times C$). Exige aprobación del Coordinador SIHO-A si Riesgo Residual $\ge 10$.
  4. **Control de Horas Hombre Trabajadas (HHT) & Accidentabilidad:** Cálculo automático de Índices de Frecuencia Bruta (IFB), Frecuencia Neta (IFN), Severidad (IS) y Días Sin Accidentes CTP.

---

### 🌿 DISCIPLINA 6: GESTIÓN AMBIENTAL

* **Normas y Estándares Integrados:**
  - **PDVSA MA-01-02-12:** Manejo y Disposición Final de Desechos Sólidos y Peligrosos.
  - **PDVSA MA-02-01-12 (Anexo A):** Guía para la Elaboración del Plan de Gestión Ambiental (PGA).
  - **Ley Orgánica del Ambiente & Decreto 2635:** Normas para el Control de Manejo de Desechos Peligrosos.

* **Funcionalidades en el Sistema (`FieldReports.tsx`, `SihoPtw.tsx`):**
  1. **Plan de Gestión Ambiental (PGA):** Matriz de Aspectos e Impactos Ambientales en frentes de construcción y paradas de planta.
  2. **Manifiestos de Traza de Desechos Peligrosos:** Trazabilidad de recolección, transporte y disposición final de lodos de perforación, aguas de producción y aceites usados.
  3. **Contención de Derrames & Trampas de Grasa:** Checklist de verificación pre-operativa para maquinaria pesada, bandejas antiderrames y mantenimiento de trampas de grasa.

---

### 📜 DISCIPLINA 7: CONTRATOS, ESTIMACIÓN Y CONTROL DE PROYECTOS

* **Normas y Estándares Integrados:**
  - **PDVSA PIC-03-01-19:** Normas para la Elaboración y Presentación de Valuaciones de Obra.
  - **Sistema SIDCON:** Sistema de Control de Contratos PDVSA.
  - **Estándar FIEBDC-3 (Formato `.bc3`):** Intercambio de Presupuestos y APU.
  - **Primavera P6 / MS Project:** Gestión de WBS, Ruta Crítica (CPM) y Curva S.

* **Funcionalidades en el Sistema (`Valuations.tsx`, `InteroperabilityEngine.tsx`, `StandbyMoc.tsx`):**
  1. **Valuaciones de Obra SIDCON (`Valuations.tsx`):** Generación de valuaciones periódicas, Cuadro de Partidas Contractuales, Aumentos / Disminuciones, Obras Extraordinarias y Amortización de Anticipo.
  2. **Motor de Presupuestos & APU (`InteroperabilityEngine.tsx`):** Importación/exportación `.bc3`, `.xer` y `.xml` con desglose en Equipos, Materiales, Mano de Obra e Indirectos.
  3. **Escudo Stand-By Claims & MOC (`StandbyMoc.tsx`):** Registro inalterable de retrasos imputables al ente contratante, cálculo de costo Stand-by de cuadrillas/equipos y redacción automatizada con IA de cartas legales de reclamo.
