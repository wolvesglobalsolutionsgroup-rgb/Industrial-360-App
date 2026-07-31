# 🏛️ PLAN MAESTRO 200 — FASE 2: ESPECIFICACIÓN DE ARQUITECTURA TÉCNICA
## MOTOR DE OFERTA, APU, MULTI-OPERADOR NORMADO, UX/UI INDUSTRIAL Y COMMAND CENTER DE MONETIZACIÓN B2B

---

**Documento:** Especificación Arquitectónica Definitiva — PLAN MAESTRO 200 (Fase 2)  
**Proyecto:** Industrial Control 360 (Industrial OS)  
**Versión:** 2.0.0 — Production Grade  
**Estado:** Aprobado para Implementación de Sprints S15 a S22  
**Dominio:** Oil & Gas / EPC / Refinación / Petroquímica / Plataformas & Marítimo-Lacustre  

---

## 📋 TABLA DE CONTENIDO MAESTRA

1. [Información General y Metadatos Arquitectónicos](#1-información-general-y-metadatos-arquitectónicos)
2. [Sección 1: Motor de Oferta y Presupuestos (APU / BC3 / SIDCON)](#sección-1-motor-de-oferta-y-presupuestos-apu--bc3--sidcon)
   - 1.1 Arquitectura Matemática y Tridimensional del APU
   - 1.2 Estructura WBS y Codificación Normada (COVENIN / PDVSA)
   - 1.3 Motor de Costo de Mano de Obra: CCPP y Tabulador Petrolero (LOTTT)
   - 1.4 Motor de Costo Horario de Equipos y Maquinaria Crítica
   - 1.5 Motor de Materiales, Mermas, Fletes y Almacenamiento
   - 1.6 Factor de Costos Indirectos, Financiamiento, Imprevistos y Utilidad (FCIU)
   - 1.7 Fórmulas Polinómicas de Reajuste de Precios
   - 1.8 Matriz de Interoperabilidad BC3 (FIEBDC-3) / SIDCON / Excel
3. [Sección 2: Arquitectura Multi-Operador e Identidad Dinámica (BrandKit)](#sección-2-arquitectura-multi-operador-e-identidad-dinámica-brandkit)
   - 2.1 Kit de Marca Dinámico y Modelo de Datos Firestore
   - 2.2 Motor de Doble Membrete (Contratista + Empresa Mixta)
   - 2.3 Matriz Normativa por Operadora (PDVSA, Chevron CES/HSE, Repsol NORMA, ENI STEA)
   - 2.4 Generador de Documentos Normados y Firma Digital SHA-256
4. [Sección 3: Adaptabilidad UX/UI y Diseño Industrial Multi-Dispositivo](#sección-3-adaptabilidad-uxui-y-diseño-industrial-multi-dispositivo)
   - 3.1 Sala de Control (Command Wall / TV 4K High-Density - 3840x2160+)
   - 3.2 Laptops / Workstations de Escritorio (High-Productivity DataGrid)
   - 3.3 Tablets & Móviles Ruggedized de Campo (Touch-First & High-Contrast Sunlight)
   - 3.4 Arquitectura de Resiliencia Offline (IndexedDB + PWA Sync Queue)
5. [Sección 4: Command Center del Propietario (Monetización y Gobernanza SaaS)](#sección-4-command-center-del-propietario-monetización-y-gobernanza-saas)
   - 4.1 Owner SuperAdmin Dashboard & Métricas SaaS (MRR, ARR, LTV, CAC, NRR)
   - 4.2 Telemetría de Infraestructura por Inquilino (Storage, Firestore R/W, Functions, AI Tokens)
   - 4.3 Auditoría Global de Seguridad y Detección de Anomalías
   - 4.4 Motor de Tiers, Cuotas (Quotas/Limits) y Facturación B2B
6. [Sección 5: Prompts Ejecutables de Sprints Fase 2 (S15 a S22)](#sección-5-prompts-ejecutables-de-sprints-fase-2-s15-a-s22)
   - Prompt Sprint 15: APU Engine & BC3/SIDCON Parser
   - Prompt Sprint 16: Labor Cost Engine & Tabulador CCPP
   - Prompt Sprint 17: Equipment Hourly Cost & Materials Engine
   - Prompt Sprint 18: Multi-Operator Branding (Chevron, Repsol, ENI) & Dual Header Engine
   - Prompt Sprint 19: High-Density Command Wall 4K Dashboard UI
   - Prompt Sprint 20: Touch-First Field App & Offline Resilience Engine
   - Prompt Sprint 21: Platform Owner Command Center & Monetization Engine
   - Prompt Sprint 22: B2B Marketplace Procura, Data Escrow & As-Built Dossier Engine
7. [Sección 6: Matriz de Trazabilidad y Criterios de Aceptación Técnica](#sección-6-matriz-de-trazabilidad-y-criterios-de-aceptación-técnica)

---

## 1. INFORMACIÓN GENERAL Y METADATOS ARQUITECTÓNICOS

El **PLAN MAESTRO 200 (Fase 2)** define los estándares de ingeniería de software, arquitectura de datos, UX/UI industrial y gobernanza financiera para la consolidación de **Industrial Control 360** como la plataforma empresarial definitiva en Oil & Gas y grandes obras EPC en Venezuela y América Latina.

### Metadatos del Sistema
* **Stack Principal:** React 19, TypeScript 5.6+, Vite 6+, Tailwind CSS v4, Firebase (Auth, Firestore, Cloud Storage, Cloud Functions).
* **AI Engine:** Gemini 3.1 Pro / Claude 3.5 Sonnet / Multi-LLM mediante Proxy Agnóstico (`/api/callGeminiProxy`).
* **Multi-Tenancy:** Firestore `/organizations/{orgId}/projects/{projectId}/...`
* **Cumplimiento Normativo Integrado:**
  * **PDVSA:** SI-S-04, PI-02-01-01, Manual de Inspectores, Normas L-TP, ROE.
  * **Chevron:** Chevron Environmental & Safety (CES), CHESM (Contractor Health, Environment & Safety Management), JSA/SWA.
  * **Repsol:** Repsol EHS Management System, NORMA Repsol.
  * **ENI:** STEA (Sistema Técnico de Evaluación y Auditoría), Eni Safety Golden Rules.
  * **Laboral:** Contrato Colectivo Petrolero (CCPP) Ley Orgánica del Trabajo, los Trabajadores y las Trabajadoras (LOTTT).
  * **Presupuestos:** Estándar FIEBDC-3 (BC3), SIDCON PDVSA, COVENIN 2000.

---

## SECCIÓN 1: MOTOR DE OFERTA Y PRESUPUESTOS (APU / BC3 / SIDCON)

### 1.1 Arquitectura Matemática y Tridimensional del APU

El cálculo del Análisis de Precios Unitarios (APU) se basa en la desagregación de costos directos en tres componentes fundamentales (Mano de Obra, Equipos, Materiales) afectados por la matriz de rendimiento de la partida WBS y multiplicados por el Factor de Costos Indirectos, Imprevistos, Financiamiento y Utilidad (FCIU).

$$\text{PUD} = \text{CMO} + \text{CEQ} + \text{CMAT}$$

$$\text{PUT} = \text{PUD} \times (1 + \text{FCIU})$$

Donde:
* $\text{PUD}$: Precio Unitario Directo ($\text{USD/Unidad}$ o $\text{VED/Unidad}$).
* $\text{CMO}$: Costo Directo de Mano de Obra por unidad de medida.
* $\text{CEQ}$: Costo Directo de Equipos y Herramientas por unidad de medida.
* $\text{CMAT}$: Costo Directo de Materiales e Insumos por unidad de medida.
* $\text{FCIU}$: Factor de Costos Indirectos, Financiamiento, Imprevistos y Utilidad (expresado en decimal, ej. $0.28 = 28\%$).
* $\text{PUT}$: Precio Unitario Total de Oferta.

---

### 1.2 Estructura WBS y Codificación Normada (COVENIN / PDVSA)

La Estructura de Desglose de Trabajo (WBS - *Work Breakdown Structure*) soporta 5 niveles jerárquicos inmutables y la codificación estandarizada para obras petroleras y civiles:

```text
Nivel 1: Fase / Proyecto (Ej: REEMPLAZO DE TUBERÍA 24" OLEODUCTO LAGO DE MARACAIBO)
  └── Nivel 2: Sub-Proyecto / Área (Ej: FRENTE SUR - MOVIMIENTO DE TIERRA Y PILOTANTE)
        └── Nivel 3: Disciplina (Ej: OBRAS MECÁNICAS Y TUBERÍAS)
              └── Nivel 4: Sub-Disciplina / Capítulo (Ej: SOLDADURA Y MONTAJE DE SPOOLS)
                    └── Nivel 5: Partida APU Individual (Ej: M-361-102-024 Soldadura de junta 24" SCH 80 API 5L X65)
```

---

### 1.3 Motor de Costo de Mano de Obra: CCPP y Tabulador Petrolero (LOTTT)

El costo de Mano de Obra representa uno de los rubros más complejos en Oil & Gas en Venezuela debido al Contrato Colectivo Petrolero (CCPP) y la Ley Orgánica del Trabajo, los Trabajadores y las Trabajadoras (LOTTT).

#### A. Fórmula del Costo Diario por Trabajador ($CDT$)

$$CDT = (SB + DB) \times (1 + FCMO) + TEA + AC + DT$$

Donde:
* $SB$: Salario Básico Diario (según Tabulador Petrolero vigente por cargo/clasificación).
* $DB$: Devengo Diario Adicional (Horas extras contractuales, prima por noche, bono nocturno 30%, prima de altura/marítima).
* $FCMO$: Factor de Costo de Mano de Obra (expresado en decimal).
* $TEA$: Ticket de Alimentación Petrolero (Tarjeta Electrónica de Alimentación) en valor diario no salarial.
* $AC$: Ayuda de Ciudad / Tiempo de Viaje contractual.
* $DT$: Viáticos de Per Diem / Alimentación de campo.

---

### 1.4 Motor de Costo Horario de Equipos y Maquinaria Crítica

El costo de equipos desglosa los costos de posesión (fijos) y los costos de operación (variables).

#### A. Costo Horario de Posesión ($CHP$)

$$CHP = C_{dep} + C_{int} + C_{seg}$$

#### B. Costo Horario de Operación ($CHO$)

$$CHO = C_{mant} + C_{comb} + C_{lub} + C_{desg} + C_{oper}$$

---

## SECCIÓN 2: ARQUITECTURA MULTI-OPERADOR E IDENTIDAD DINÁMICA (BRANDKIT)

### 2.1 Kit de Marca Dinámico y Modelo de Datos Firestore

Cada organización posee una configuración centralizada de identidad visual y normativa de seguridad operativa que se inyecta en caliente en la UI y reportes PDF.

#### Ruta Firestore: `/organizations/{orgId}/settings/brandkit`

```json
{
  "orgId": "org_prointeca_01",
  "companyName": "PROINTECA C.A.",
  "rif": "J-30495821-0",
  "logoPrimaryUrl": "https://storage.googleapis.com/.../primary_logo.png",
  "logoSecondaryUrl": "https://storage.googleapis.com/.../iso_9001_logo.png",
  "primaryColor": "#0b57d0",
  "secondaryColor": "#1e293b",
  "accentColor": "#f59e0b",
  "headerType": "DUAL_OPERATOR",
  "activeOperatorPreset": "CHEVRON_CES",
  "contactInfo": {
    "address": "Av. Intercomunal Sector Las Morochas, Ojeda, Zulia",
    "phone": "+58 265 555 1234",
    "email": "contacto@prointeca.com"
  }
}
```

---

### 2.2 Motor de Doble Membrete (Contratista + Empresa Mixta)

En la industria petrolera venezolana, los documentos técnicos (Valúos, AST, PTS, Certificados NDT, Actas) requieren un **Doble Membrete**:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                 MEMBRETE DUAL DINÁMICO                                 │
 ├───────────────────────────────────────────┬────────────────────────────────────────────┤
 │ LOGO CONTRATISTA (LADO IZQUIERDO)         │ LOGO OPERADORA / MIXTA (LADO DERECHO)      │
 │ PROINTECA C.A.                            │ PETROBOSCAN S.A. / CHEVRON CES             │
 │ RIF: J-30495821-0                         │ RIF: J-00123456-7                          │
 │ Certificados: ISO 9001 / ISO 45001        │ Campo Boscán - División Occidente          │
 ├───────────────────────────────────────────┴────────────────────────────────────────────┤
 │ PROYECTO: REEMPLAZO DE TUBERÍA DE 24" EN EL ESTRECHO DE MARACAIBO                     │
 │ CONTRATO NO: 4600098212 | HOJA DE VALUACIÓN NO: 04 | FECHA: 31/07/2026                 │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## SECCIÓN 3: ADAPTABILIDAD UX/UI Y DISEÑO INDUSTRIAL MULTI-DISPOSITIVO

### 3.1 Sala de Control (Command Wall TV 4K - 3840x2160+)
Grid rígido de 6 columnas x 4 filas sin scroll vertical ni horizontal (`overflow: hidden`), interfaz OLED Dark (`bg-[#0b0f19]`), indicadores neón fluorescentes y telemetría por WebSockets / Firestore `onSnapshot`.

### 3.2 Laptops / Workstations de Escritorio (Full HD / 2K)
Datagrid virtualizado (`tanstack-query`), atajos de teclado estilo Excel (`Ctrl+C`, `Ctrl+V`, `F2`), split view para auditoría de partidas APU y pliego licitatorio.

### 3.3 Tablets & Móviles Ruggedized de Campo (Touch-First & High Contrast)
Zonas táctiles de mínimo **48x48px**, "Modo Sol Directo" (Sunlight High-Contrast Mode) en blanco/negro puro de alta legibilidad, georreferenciación GPS obligatoria y captura OCR.

---

## SECCIÓN 4: COMMAND CENTER DEL PROPIETARIO (MONETIZACIÓN Y GOBERNANZA SaaS)

Consola global de administración ejecutiva accesible en `/platform_admin/telemetry/tenants` para el dueño/fundador de la plataforma:
- **KPI Financial Wall:** MRR, ARR, LTV, CAC, NRR, Active Tenants.
- **Telemetría de Infraestructura:** Cloud Storage por tenant (GBs), Firestore Reads/Writes, Cloud Functions, AI Tokens (Gemini, Claude, GPT-4o).
- **Seguridad:** Registro de intentos de violación de Firestore Rules por IP y mapa de accesos globales.
- **Tiers B2B:** Starter ($490/mes), Pro EPC ($1,850/mes), Enterprise Mixta ($4,900/mes).

---

## SECCIÓN 5: PROMPTS EJECUTABLES DE SPRINTS FASE 2 (S15 A S22)

### 📋 PROMPT SPRINT 15 (S15) — Engine de APU, WBS 5 Niveles & Parser BC3 / SIDCON
```text
Desarrolla el Motor Completo de Análisis de Precios Unitarios (APU) e Interoperabilidad BC3/SIDCON en el módulo `src/pages/ApuEstimation.tsx` y la librería `src/lib/parsers/bc3Parser.ts`.

1. Implementa el cálculo tridimensional del APU: PUT = (CMO + CEQ + CMAT) * (1 + FCIU).
2. Construye la vista de árbol para la Estructura WBS de 5 niveles (Proyecto -> Frente -> Disciplina -> Capítulo -> Partida COVENIN/PDVSA).
3. Escribe el parser bidireccional FIEBDC-3 (archivos .bc3): lectura y generación de registros ~C, ~D, ~T, ~M.
4. Persistencia estricta en Firestore bajo `/organizations/{orgId}/projects/{projectId}/apu_items/{apuId}`.
```

### 📋 PROMPT SPRINT 16 (S16) — Motor de Labor & Tabulador CCPP Petrolero (LOTTT)
```text
Implementa el Motor de Cálculo Completo de Costo de Mano de Obra basado en el Contrato Colectivo Petrolero (CCPP) y la LOTTT en `src/lib/engines/laborCostEngine.ts` e intégralo en `ApuEstimation.tsx`.

1. Implementa el Salario Integral Petrolero y FCMO: CDT = (SalarioBasico + Devengo) * (1 + FCMO) + TEA + AyudaCiudad + PerDiem.
2. Desglosa la matriz de incidencias (Prestaciones Art 142, Intereses, Vacaciones, Utilidades, IVSS, FAOV, INCES, HCM, EPP).
3. Crea la tabla interactiva de Tabuladores Petroleros por Clasificación de Cargo con importación desde Excel.
```

### 📋 PROMPT SPRINT 17 (S17) — Costo Horario Equipos & Fórmulas Polinómicas
```text
Construye el Motor de Costo Horario de Equipos, Maquinarias, Materiales y Fórmulas Polinómicas en `src/lib/engines/equipmentCostEngine.ts` y `src/lib/engines/polynomialEngine.ts`.

1. Implementa Costo Horario de Posesión (CHP) y Operación (CHO: combustible por HP, lubricantes, depreciación).
2. Construye la matriz de Materiales con porcentaje de merma por rubro, fletes y almacenaje.
3. Desarrolla la Fórmula Polinómica de Reajuste de Precios: K = a*(M/M0) + b*(EQ/EQ0) + c*(MO/MO0) + d*(IND/IND0).
```

### 📋 PROMPT SPRINT 18 (S18) — Multi-Operador (Chevron, Repsol, ENI) & Doble Membrete
```text
Implementa el Motor de Identidad Dinámica Multi-Operador y Doble Membrete Normado en `src/pages/Settings.tsx` y el generador de reportes PDF `src/lib/pdfGenerator.ts`.

1. Módulo BrandKit en `Settings.tsx` en `/organizations/{orgId}/settings/brandkit`.
2. Presets normativos: PDVSA, CHEVRON (CES/CHESM/JSA), REPSOL (EHS/NORMA), ENI (STEA/Golden Rules).
3. Genera e inyecta un código QR inmutable en el PDF con el Hash SHA-256 del documento guardado en Firestore.
```

### 📋 PROMPT SPRINT 19 (S19) — Dashboard UI Sala de Control (TV 4K Command Wall)
```text
Diseña e implementa la vista de Sala de Control de Alta Densidad para Pantallas 4K (3840x2160) en `src/pages/Dashboard.tsx` habilitando el modo "Command Wall".

1. Layout de grid rígido 6x4 sin scroll a resolución 3840x2160 (`overflow-hidden`).
2. Sistema visual OLED Dark (`bg-[#0b0f19]`) con indicadores neón fluorescentes de alta visibilidad.
3. Firestore listeners en tiempo real (`onSnapshot`) para telemetría de GIS 3D, Días sin LTI y Curva S.
```

### 📋 PROMPT SPRINT 20 (S20) — Touch-First Field Mobile App & Offline Engine
```text
Optimiza el comportamiento móvil y la resiliencia offline de las pantallas de campo (`src/pages/SihoPtw.tsx`, `FieldReports.tsx`, `QaQcWelding.tsx`).

1. Diseño Touch-First: botones de mínimo 48x48px.
2. "Modo Sol Directo" (Sunlight High-Contrast Mode) en blanco/negro puro.
3. Cola de sincronización diferida IndexedDB + Service Worker Background Sync (`sync-field-reports`).
```

### 📋 PROMPT SPRINT 21 (S21) — Platform Owner Command Center (Monetización & Billing)
```text
Desarrolla la consola ejecutiva del dueño de la plataforma en `src/pages/PlatformOwnerConsole.tsx`.

1. Dashboard Financiero SaaS: MRR, ARR, LTV, CAC, NRR, Tenants Activos.
2. Telemetría de consumo: Storage, Firestore Reads/Writes, Cloud Functions, AI Tokens (Gemini, Claude, GPT-4o).
3. Auditoría de seguridad: accesos por IP, mapa geolocalizado, alertas de seguridad.
4. Gestor de suscripciones, Tiers B2B (Starter, Pro, Enterprise) y límites de cuota.
```

### 📋 PROMPT SPRINT 22 (S22) — B2B Marketplace & As-Built Dossier Final
```text
Desarrolla la Fusión Final de Módulos: B2B Marketplace Procura en `ProcurementInventory.tsx` y el Ensamblador de Dossier As-Built en `DossierCompiler.tsx`.

1. Marketplace Procura B2B con emisión de RFQs automáticos desde el presupuesto APU.
2. Ensamblador de Dossier As-Built PDF con marca de agua, índice interactivo y Hash SHA-256 de custodia final.
```

---

## 7. MATRIZ DE TRAZABILIDAD Y CRITERIOS DE ACEPTACIÓN TÉCNICA

Todo código de los Sprints 15 al 22 debe cumplir estrictamente con:
1. **Aisleamiento Multi-Tenant:** Toda consulta lee/escribe en `/organizations/{orgId}/projects/{projId}/...`
2. **Cero Mock Data:** Prohibido el uso de datos aleatorios. Todo proviene de Firestore o parsers reales.
3. **Seguridad de Claves API:** Invocación de IA exclusivamente vía `/api/callGeminiProxy`.
4. **Sistema de Tema Unificado:** Uso exclusivo de tokens del block `@theme` en `index.css`.
5. **Rigor en Fórmulas:** Citas explícitas de norma (ASME, API, LOTTT, CCPP) en comentarios del código.
