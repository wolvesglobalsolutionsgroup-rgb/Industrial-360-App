# 🎯 PROMPTS ACTIVOS PARA GOOGLE AI STUDIO (Industrial Control 360)

> **Orquestador Principal:** Antigravity AI
> **Coordinación:** Qwen & Hermes
> **Fuente de verdad:** `docs_ic360/planificacion/`
> **📌 DIRECTIVA DE CLIENTE:** Cuando se usen ejemplos de organizaciones/contratistas secundarios en pruebas o datos de demostración, utilizar SIEMPRE **`prointeca`** (PROINTECA C.A.).

---

## 🟢 PROMPT ACTUAL: BRIEF DE CORRECCIÓN PARA TICKET `IC360-009` (Golden Test Propanoducto Cardón-Amuay API 1163)

```text
Actúa como Especialista en Ingeniería Mecánica O&G e Integridad de Tuberías (API 1163 / ASME B31G).

Necesitamos corregir el preset de prueba del módulo `src/lib/norms/api1163.ts` (`IC360-009`) para calibrarlo exactamente con los datos reales del Propanoducto Cardón-Amuay 6" extraídos del vault PDVSA para la organización `prointeca`:

⚠️ REGLA DE SEGURIDAD: NO tocar firestore.rules. NO ejecutar firebase deploy.

1. ACTUALIZAR GOLDEN_CARDON_AMUAY_PRESET en `src/lib/norms/api1163.ts`:
   - maopPsi: 2126 (fórmula Barlow F=0.72 → 14.66 MPa). (Era 600).
   - lengthKm: 17.0 (era 17.2).
   - Anomalías (EXACTAMENTE 3):
     * D001 (KP2.4): Corrosión externa 15% prof x 45mm largo, Metal Loss. actionRequired: 'Monitoreo Continuo', repair: 'Recubrimiento epóxico'.
     * D002 (KP8.7): Abolladura (Dent) 4% OD. actionRequired: 'Atención Programada', repair: 'Evaluación bajo API 1183 (NO aplica B31G)'.
     * D003 (KP12.1): Corrosión externa 35% prof x 80mm largo, Metal Loss. actionRequired: 'Acción Inmediata', repair: 'Camisa Tipo B (ASME B31.4 §451.3.2 / API 1104)'.

2. CORRECCIÓN DEL ALGORITMO (evaluateAnomaly):
   - Ajuste por Incertidumbre (H5): En evaluateAnomaly, el cálculo B31G debe usar la profundidad ajustada por incertidumbre:
     const dInches = ((adjustedDepthPct / 100) * anomaly.nominalWT) / 25.4;
   - Burst Pressure Ratio (H2): Agregar al retorno de evaluateAnomaly el campo burstPressureRatio:
     const pRefPsi = (2 * smys * (nominalWT / 25.4) * 0.72) / pipeDiameter;
     const burstPressureRatio = +(pSafePsi / pRefPsi).toFixed(4);

3. PRUEBAS UNITARIAS (src/lib/norms/__tests__/api1163.test.ts):
   Crea la suite de pruebas unitarias en Vitest con 4 casos:
   - VAL-01: D003 → burstPressureRatio < 1.0 (≈0.9385) y actionRequired === 'Acción Inmediata'.
   - VAL-02: D003 → recommendedRepair contiene 'tipo b'.
   - VAL-03: D001 → burstPressureRatio > 1.0 y actionRequired === 'Monitoreo Continuo'.
   - VAL-05: D002 → recommendedRepair contiene 'API 1183'.

4. VERIFICACIÓN:
   Asegura que `npm test -- api1163` pase los 4 tests y `npm run lint` esté limpio en verde. Realiza el commit.
```
