# 🎯 PROMPTS ACTIVOS PARA GOOGLE AI STUDIO (Industrial Control 360)

> **Orquestador Principal:** Antigravity AI
> **Coordinación:** Qwen & Hermes
> **Fuente de verdad:** `docs_ic360/planificacion/`
> **📌 DIRECTIVA DE CLIENTE:** Cuando se usen ejemplos de organizaciones/contratistas secundarios en pruebas o datos de demostración, utilizar SIEMPRE **`prointeca`** (PROINTECA C.A.).

---

## 🟢 PROMPT ACTUAL: TICKET `IC360-009` (Sprint 5 — Diferenciador Normativo API 1163 / API 653)

```text
Actúa como Especialista en Ingeniería Mecánica O&G e Integridad de Tuberías / Tanques (API 1163 / API 653 / ASME B31G).

Necesitamos implementar el Motor de Verificación de Integridad de Inspección en Línea (ILI) y Criterios de Aceptación API 1163 en la vista `IntegrityIli.tsx` (`IC360-009`):

📌 NOTA DE CONFIGURACIÓN DE TENANT: Para organizaciones secundarias o de prueba de contratistas, utiliza `prointeca` (PROINTECA C.A.) como contratista de ejemplo.

1. MOTOR DE CÁLCULO NORMATIVO (`src/lib/norms/api1163.ts`):
   - Implementa los algoritmos de clasificación de anomalías e incertidumbre de inspección según API 1163:
     * Nivel de Confianza (Confidence Level): Tolerancia de profundidad según especificación del vendedor ILI (ej. +/- 10% WT a 80% certidumbre).
     * Categorización de anomalías: Pérdida de metal por corrosión externa/interna, abolladuras (dents), y gouges.
     * Criterio de reparación inmediata vs monitoreo en el tiempo (ERF > 1.0 según ASME B31G).

2. CASO DE PRUEBA GOLDEN — PROPANODUCTO CARDÓN-AMUAY 6" (PROINTECA):
   - Carga el preset de prueba del caso real Propanoducto Cardón-Amuay 6" (17.2 km, tubería API 5L Gr. B, 0.280" WT, presión 600 PSI) bajo la organización `prointeca`:
     * Defecto 1 (KM 4+200): Corrosión externa 65% profundizamiento, ERF 1.15 -> Requiere Camisa de Refuerzo Tipo B (API 1104 / ASME B31.4).
     * Defecto 2 (KM 11+850): Corrosión interna 25% profundizamiento, ERF 0.62 -> Monitoreo de tasa de corrosión.
     * Defecto 3 (KM 15+100): Abolladura en generatriz superior 4% OD -> Reparación preventiva.

3. VISTA Y EXPORTACIÓN (`src/pages/IntegrityIli.tsx`):
   - Muestra el resumen ejecutivo del reporte ILI con gráfica de distribución de defectos a lo largo del kilometraje (KPs).
   - Genera el botón de exportación "Generar Informe de Evaluación de Integridad API 1163 / B31G".

4. VERIFICACIÓN:
   Asegura que `npm run lint` pase sin advertencias ni errores y realiza el commit para IC360-009.
```
