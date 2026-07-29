# 📐 BRIEF DE CORRECCIÓN: TICKET IC360-009 — Ajuste Golden Test API 1163 (Propanoducto Cardón-Amuay)

> **ID Ticket:** `IC360-009`
> **Líder:** Antigravity (Arquitecto Principal)
> **Auditor:** Qwen (Orquestador - Auditoría #14)
> **Bibliotecario:** Hermes (Golden Test Data)
> **Ejecutor:** Google AI Studio
> **Riesgo:** 🟡 AMARILLO (Ingeniería / Precision Calibration)

---

## 🎯 TAREA DE CORRECCIÓN PARA GOOGLE AI STUDIO
Ajustar el módulo `src/lib/norms/api1163.ts` para utilizar los datos reales del **Propanoducto Cardón-Amuay 6"** extraídos del vault PDVSA (MAOP 2126 PSI, 3 defectos reales D001, D002, D003) en lugar de valores de ejemplo genéricos, y crear la suite de pruebas unitarias Vitest `src/lib/norms/__tests__/api1163.test.ts`.

⚠️ **REGLA DE SEGURIDAD:** NO tocar `firestore.rules`. NO ejecutar `firebase deploy`.

---

## 📝 INSTRUCCIONES TÉCNICAS EXACTAS

### 1. Actualizar `GOLDEN_CARDON_AMUAY_PRESET` en `src/lib/norms/api1163.ts`
- **Organización:** `prointeca` (PROINTECA C.A.)
- **maopPsi:** `2126` (Fórmula Barlow F=0.72 → 14.66 MPa). *(Era 600 psi)*.
- **lengthKm:** `17.0` *(Era 17.2)*.
- **Anomalías (EXACTAMENTE 3):**
  * **D001 (KP2.4):** Corrosión externa 15% prof × 45mm largo, Metal Loss. `actionRequired`: 'Monitoreo Continuo', `repair`: 'Recubrimiento epóxico'.
  * **D002 (KP8.7):** Abolladura (Dent) 4% OD. `actionRequired`: 'Atención Programada', `repair`: 'Evaluación bajo API 1183 (NO aplica B31G)'.
  * **D003 (KP12.1):** Corrosión externa 35% prof × 80mm largo, Metal Loss. `actionRequired`: 'Acción Inmediata', `repair`: 'Camisa Tipo B (ASME B31.4 §451.3.2 / API 1104)'.

### 2. Corrección del Algoritmo (Bug H5 & H2 en `evaluateAnomaly`)
- **Profundidad Ajustada por Incertidumbre (H5):** El cálculo ASME B31G debe utilizar la profundidad ajustada por incertidumbre (`adjustedDepthPct`), no la profundidad cruda (`depthPercent`):
  ```typescript
  const dInches = ((adjustedDepthPct / 100) * anomaly.nominalWT) / 25.4;
  ```
- **Burst Pressure Ratio (H2):** Incluir en el retorno de `evaluateAnomaly` el campo `burstPressureRatio`:
  ```typescript
  const pRefPsi = (2 * smys * (nominalWT / 25.4) * 0.72) / pipeDiameter;
  const burstPressureRatio = +(pSafePsi / pRefPsi).toFixed(4);
  ```

### 3. Suite de Pruebas Unitarias (`src/lib/norms/__tests__/api1163.test.ts`)
Crear el test en Vitest con 4 casos de validación:
- **VAL-01:** D003 → `burstPressureRatio` < 1.0 (≈0.9385) y `actionRequired === 'Acción Inmediata'`.
- **VAL-02:** D003 → `recommendedRepair` contiene 'tipo b'.
- **VAL-03:** D001 → `burstPressureRatio` > 1.0 y `actionRequired === 'Monitoreo Continuo'`.
- **VAL-05:** D002 → `recommendedRepair` contiene 'API 1183'.

---

## ✅ CRITERIOS DE ACEPTACIÓN
- [ ] `maopPsi === 2126` y 3 anomalías reales (D001, D002, D003) bajo el tenant `prointeca`.
- [ ] `evaluateAnomaly` usa `adjustedDepthPct` y retorna `burstPressureRatio`.
- [ ] `npm test -- api1163` pasa los 4 casos en verde.
- [ ] `npm run lint` pasa con 0 errores.
- [ ] `git diff firestore.rules` está totalmente vacío.
