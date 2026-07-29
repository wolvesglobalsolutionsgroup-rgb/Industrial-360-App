# 📐 BRIEF TÉCNICO: SPRINT 6 — Ingesta Voice-to-JSON en Campo & Visor SVG de Isométricos (`IC360-010`)

> **ID Ticket:** `IC360-010`
> **Líder:** Antigravity (Arquitecto Principal)
> **Co-Auditor:** Qwen (Orquestador)
> **Ejecutor:** Google AI Studio
> **Riesgo:** 🟡 AMARILLO (Feature / UX)

---

## 🎯 Objetivo del Ticket `IC360-010`
1. Implementar la ingesta de notas de voz nativa **Voice-to-JSON** (Web Speech API + Gemini 2.5 Flash) en `FieldReports.tsx` para dictado de inspecciones bajo el sol a $0 costo de infraestructura.
2. Crear el componente `SmartIsometricViewer.tsx` para renderizado interactivo de gráficos SVG con cambio de color en vivo de juntas soldadas (rojo = pendiente, amarillo = soldado, verde = NDT aprobado).

---

## 📝 TAREAS TÉCNICAS EXACTAS PARA GOOGLE AI STUDIO

### 1. Ingesta Voice-to-JSON (`src/components/VoiceDictationModal.tsx`)
- Integrar la Web Speech API nativa (`webkitSpeechRecognition`) del navegador para transcripción local a costo $0.
- Pasar el texto transcrito a `callGeminiStructured<FieldReportIngest>` en `server.ts` para extraer automáticamente:
  * Fecha, Cuadrilla, Diámetro de Tubería, Juntas Inspeccionadas, Desviaciones SIHO.
- Poblar el formulario de `FieldReports.tsx` en 1 clic.

---

### 2. Visor SVG de Isométricos (`src/components/mechanical/SmartIsometricViewer.tsx`)
- Renderizar gráficos de isométricos de tubería en formato SVG vectorial.
- Convertir cada junta en un hotspot interactivo (`<circle data-joint-id="...">`).
- Asignar código de color dinámico leyendo de Dexie / Firestore:
  * 🔴 **Rojo:** Pendiente por soldar.
  * 🟡 **Amarillo:** Soldado, pendiente por ensayo NDT.
  * 🟢 **Verde:** NDT Aprobado e incorporado a la Valuación ROE (`prointeca`).

---

## ✅ CRITERIOS DE ACEPTACIÓN
- [ ] Dictado por voz captura el audio localmente y llena el esquema JSON sin errores.
- [ ] El visor SVG cambia de color las juntas al hacer clic y actualizar su estado NDT.
- [ ] `npm run lint` pasa con 0 errores.
