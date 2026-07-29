# 📐 BRIEF TÉCNICO: SPRINT 5 — Diferenciador Normativo API 1163 & Caso Golden Propanoducto Cardón-Amuay (`IC360-009`)

> **ID Ticket:** `IC360-009`
> **Líder:** Antigravity (Arquitecto Principal)
> **Co-Auditor:** Qwen (Orquestador)
> **Bibliotecario:** Hermes (Criterios Vault PDVSA)
> **Ejecutor:** Google AI Studio
> **Riesgo:** 🟡 AMARILLO (Ingeniería / Feature)

---

## 🎯 Objetivo del Ticket `IC360-009`
Implementar el Motor de Verificación de Integridad de Inspección en Línea (ILI) y Criterios de Aceptación API 1163 en la vista `IntegrityIli.tsx` con el caso de prueba real del Propanoducto Cardón-Amuay 6" asignado a la organización **PROINTECA C.A.** (`prointeca`).

---

## 📝 TAREAS TÉCNICAS EXACTAS PARA GOOGLE AI STUDIO

### 1. Motor de Cálculo Normativo (`src/lib/norms/api1163.ts`)
Implementar las funciones de clasificación de anomalías e incertidumbre de inspección según API 1163 / ASME B31G:
- **Tolerancia de profundidad:** Tolerancia de profundidad de herramienta ILI (+/- 10% WT a 80% Nivel de Confianza).
- **Categorización:** Corrosión externa/interna, abolladuras (dents), gouges.
- **Factor de Resistencia de Folias (ERF):** Cálculo de ERF según ASME B31G ($Pf / MAOP$). Si $ERF > 1.0$, reparación prioritaria.

---

### 2. Caso de Prueba Golden — Propanoducto Cardón-Amuay 6" (`prointeca`)
Cargar el preset de prueba del Propanoducto Cardón-Amuay 6" (17.2 km, tubería API 5L Gr. B, 0.280" WT, presión 600 PSI) bajo la organización `prointeca`:
- **Defecto 1 (KM 4+200):** Corrosión externa 65% profundizamiento, ERF 1.15 -> Requiere Camisa de Refuerzo Tipo B (ASME B31.4 / API 1104).
- **Defecto 2 (KM 11+850):** Corrosión interna 25% profundizamiento, ERF 0.62 -> Monitoreo de tasa de corrosión.
- **Defecto 3 (KM 15+100):** Abolladura en generatriz superior 4% OD -> Reparación preventiva.

---

### 3. Vista & Exportador PDF (`src/pages/IntegrityIli.tsx`)
- Graficar la distribución de defectos a lo largo del kilometraje (KPs) con Recharts.
- Botón de exportación: "Generar Informe de Evaluación de Integridad API 1163 / B31G".

---

## ✅ CRITERIOS DE ACEPTACIÓN
- [ ] `npm run lint` pasa con 0 errores.
- [ ] La organización asignada para el caso de prueba es `prointeca`.
- [ ] `IntegrityIli.tsx` renderiza la gráfica de kilometraje y calcula ERF en tiempo real.
