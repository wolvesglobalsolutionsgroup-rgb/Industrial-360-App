# 🚀 PLAN MAESTRO DE EJECUCIÓN FASE 2: SPRINTS S15 A S22
## Industrial Control 360 (Industrial OS) — Guía Completa de Prompts y Validación
### Repositorio: `wolvesglobalsolutionsgroup-rgb/Industrial-360-App` — Branch `main`

> **Instrucciones para Freddy:** Abre este archivo en el panel lateral de Antigravity. Para cada Sprint (desde S15 hasta S22), solo copia el **Prompt Executable para GAIS**, pégalo en Google AI Studio y deja que ejecute el código. Luego avísame para sincronizar (`git pull`) y correr las pruebas de verificación.

---

## 📌 ÍNDICE DE SPRINTS FASE 2

- [Sprint 15: Motor de APU, CCPP Petrolero y Factor K](#sprint-15-motor-de-apu-ccpp-petrolero-y-factor-k)
- [Sprint 16: Gestión Laboral RRHH de Obra y Control QR](#sprint-16-gestión-laboral-rrhh-de-obra-y-control-qr)
- [Sprint 17: Motor de Costos de Equipos (CHO/CHP) y Combustibles](#sprint-17-motor-de-costos-de-equipos-chochp-y-combustibles)
- [Sprint 18: Multi-Operator BrandKit y Doble Membrete](#sprint-18-multi-operator-brandkit-y-doble-membrete)
- [Sprint 19: Exportadores Editables Avanzados (.docx, .xlsx, .pptx)](#sprint-19-exportadores-editables-avanzados-docx-xlsx-pptx)
- [Sprint 20: Interfaces 3 Entornos (Sala Control, Laptop, Sol)](#sprint-20-interfaces-3-entornos-sala-control-laptop-sol)
- [Sprint 21: Resiliencia Offline Avanzada y Sync Center](#sprint-21-resiliencia-offline-avanzada-y-sync-center)
- [Sprint 22: Command Center del Propietario y Monetización](#sprint-22-command-center-del-propietario-y-monetización)

---

## SPRINT 15: MOTOR DE APU, CCPP PETROLERO Y FACTOR K

### 🎯 Objetivo del Sprint:
Construir el motor de Análisis de Precios Unitarios (APU) para obras de infraestructura y petróleo, integrando el Contrato Colectivo de la Industria Petrolera (CCPP), Ley Orgánica del Trabajo (LOTTT), Factor de Costos Indirectos y Utilidad (FCIU), y Reajuste Polinómico por Factor K y Tasa BCV.

### 📋 PROMPT EJECUTABLE PARA GAIS (Copiar y Pegar en AI Studio):

```text
🎯 SPRINT 15: MOTOR DE ANÁLISIS DE PRECIOS UNITARIOS (APU) Y CONTRATO COLECTIVO PETROLERO (CCPP)

Estimado GAIS, implementa el Motor de Cálculo de APU para la industria petrolera respetando las normas PDVSA SIDCON, CCPP y Ley Orgánica del Trabajo (LOTTT).

REGLAS OBLIGATORIAS:
- Cero valores hardcodeados (`semax_pino` o `PROJ-001`). Obtén orgId y projectId de la sesión (`useRequiredProject()`).
- Cero tipos `any` en funciones numéricas o de cálculo económico.

REQUERIMIENTOS A IMPLEMENTAR:
1. Crea `src/types/apu.ts` definiendo las estructuras para:
   - Partidas WBS (código, descripción, unidad, cantidad, precioUnitarioDirecto, fciuPct, precioUnitarioTotal).
   - Insumos de APU (Mano de Obra según CCPP, Equipos CHO/CHP, Materiales y Transporte).
   - Parámetros de Reajuste: Tasa BCV (VES/USD), Factor Polinómico K y alícuota IGTF (3%).

2. Crea la calculadora `src/lib/engineering/apuCalculator.ts`:
   - Cálculo de Costo Directo (CD) = Suma(Mano de Obra + Equipos + Materiales + Transporte).
   - Cálculo de Factor de Costos Indirectos y Utilidad (FCIU) = CD * (% Indirectos + % Utilidad).
   - Precio Unitario Total (PUT) = CD * (1 + FCIU).
   - Conversión a VES usando Tasa BCV y aplicación del Factor Polinómico K: Total VES = (Monto USD * BCV) * K.

3. Conecta el módulo `src/pages/ApuEstimation.tsx` para que permita a los ingenieros ajustar rendimientos de cuadrilla y ver la actualización de montos en tiempo real.

Al terminar, verifica que `npx tsc --noEmit` pase con 0 errores y reporta los archivos creados/modificados.
```

### 🧪 Checklist de Validación Post-Commit (Sprint 15):
- [ ] `src/types/apu.ts` sin tipos `any`.
- [ ] Fórmulas CCPP / LOTTT respetan 25% utilidades y alícuotas vacacionales.
- [ ] `Total VES = (Monto USD * Tasa BCV) * K`.
- [ ] Cero fallbacks hardcodeados en `ApuEstimation.tsx`.
- [ ] `npx tsc --noEmit` = 0 errores.
- [ ] `npx vitest run` = 100% pasado.

---

## SPRINT 16: GESTIÓN LABORAL RRHH DE OBRA Y CONTROL QR

### 🎯 Objetivo del Sprint:
Implementar el módulo de gestión de personal en sitio, control de Horas-Hombre Trabajadas (HHT), turnos rotativos, pases SIHO-A y escaneo de credenciales con código QR.

### 📋 PROMPT EJECUTABLE PARA GAIS (Copiar y Pegar en AI Studio):

```text
🎯 SPRINT 16: CONTROL LABORAL EN SITIO, HHT Y REGISTRO QR DE TRABAJADORES

Estimado GAIS, implementa el Módulo de Control de Asistencia y Gestión Laboral en Sitio con escaneo QR conforme a las normas SIHO-A PDVSA y LOTTT.

REQUERIMIENTOS:
1. Crea/Actualiza `src/types/labor.ts`:
   - Ficha de Trabajador (cédula, nombres, cargo petrolero, empresa contratista, pase SIHO status, fecha examen médico, QR token).
   - Registro de Asistencia HHT (timestamp entrada/salida, frente de trabajo WBS, horas normales, horas extras, sobretiempo nocturno).

2. Actualiza `src/pages/WorkerQrRegistry.tsx`:
   - Lector QR con cámara para marcaje rápido de cuadrilla en campo.
   - Cálculo automático de HHT Sin Accidentes acumuladas por frente de obra.
   - Generador de carnet digital imprimible en PDF/Imagen con QR inmutable.

3. Asegura que la colección en Firestore sea `/organizations/{orgId}/projects/{projectId}/labor_attendance`.

Verifica compilación con `npx tsc --noEmit`.
```

### 🧪 Checklist de Validación Post-Commit (Sprint 16):
- [ ] Escaneo QR opera offline con Dexie DB.
- [ ] Clasificación de horas (Normal, Extra, Nocturna) según LOTTT.
- [ ] Trazabilidad de HHT Sin Accidentes para indicadores SIHO.
- [ ] `npx tsc --noEmit` = 0 errores.

---

## SPRINT 17: MOTOR DE COSTOS DE EQUIPOS (CHO/CHP) Y COMBUSTIBLES

### 🎯 Objetivo del Sprint:
Construir la calculadora de Costo Horario de Operación (CHO) y Costo Horario de Posesión (CHP) para maquinaria pesada (grúas, jumbos, generadores, motocompresores) con trazabilidad de combustible e insumos.

### 📋 PROMPT EJECUTABLE PARA GAIS (Copiar y Pegar en AI Studio):

```text
🎯 SPRINT 17: MOTOR DE COSTOS DE EQUIPOS (CHO / CHP), MANTENIMIENTO Y COMBUSTIBLE

Estimado GAIS, implementa la Calculadora de Costo Horario de Equipos (CHO/CHP) para la industria petrolera y de construcción.

REQUERIMIENTOS:
1. Crea `src/lib/engineering/equipmentCostEngine.ts`:
   - CHP (Costo Horario de Posesión): Depreciación, Inversión, Seguros y Mantenimiento Mayor.
   - CHO (Costo Horario de Operación): Combustible (litros/hora * precio), Lubricantes, Cauchos/Orugas y Operador.
   - Tarifa Horaria Total = CHP + CHO.

2. Actualiza `src/pages/Inventory.tsx` y `src/pages/EquipmentRegistry.tsx` (o componentes afines):
   - Registro de horómetro inicial/final por jornada.
   - Consumo real de diésel/gasolina por equipo y alerta de mantenimiento preventivo cada 250h.

Verifica compilación limpia con `npx tsc --noEmit`.
```

### 🧪 Checklist de Validación Post-Commit (Sprint 17):
- [ ] Separación estricta entre CHP y CHO.
- [ ] Alerta de mantenimiento preventivo automática por horómetro.
- [ ] `npx tsc --noEmit` = 0 errores.

---

## SPRINT 18: MULTI-OPERATOR BRANDKIT Y DOBLE MEMBRETE

### 🎯 Objetivo del Sprint:
Integrar el sistema de Doble Membrete (EPC + Operadora), presets corporativos para PDVSA, Chevron, Repsol y ENI, y el estampado de Sello Criptográfico Inmutable SHA-256 con QR.

### 📋 PROMPT EJECUTABLE PARA GAIS (Copiar y Pegar en AI Studio):

```text
🎯 SPRINT 18: BRANDKIT MULTI-OPERADOR, DOBLE MEMBRETE Y SELLO CRIPTOGRÁFICO SHA-256

Estimado GAIS, conecta la visualización del Doble Membrete (EPC + Operadora) en todos los visores de reportes y permisos.

REQUERIMIENTOS:
1. Utiliza `src/types/brandkit.ts`, `src/lib/brandkits/presets/pdvsa.ts` y `src/components/documents/DualHeader.tsx`.
2. Actualiza los visores de permisos PTW (`src/pages/SihoPtw.tsx`), Informes QA/QC (`src/pages/QaQcWelding.tsx`) y Valuaciones (`src/pages/Valuations.tsx`) para incluir el componente `<DualHeader />` en el encabezado.
3. Asegura que el sello `<DocumentSeal />` muestre el código QR de validación con URL `VERIFIER_BASE_URL`.

Verifica compilación con `npx tsc --noEmit`.
```

### 🧪 Checklist de Validación Post-Commit (Sprint 18):
- [ ] Visores de PTW, QA/QC y Valuaciones renderizan Doble Membrete.
- [ ] QR de verificación de sello es visible y legible.
- [ ] Presets de PDVSA, Chevron, Repsol y ENI integrados.

---

## SPRINT 19: EXPORTADORES EDITABLES AVANZADOS (.DOCX, .XLSX, .PPTX)

### 🎯 Objetivo del Sprint:
Generar documentos editables vivos (.docx, .xlsx con fórmulas activas, .pptx) que preserven el Doble Membrete y permitan a las inspecciones modificar datos en MS Office / LibreOffice.

### 📋 PROMPT EJECUTABLE PARA GAIS (Copiar y Pegar en AI Studio):

```text
🎯 SPRINT 19: GENERACIÓN DE DOCUMENTOS EDITABLES (.DOCX, .XLSX CON FÓRMULAS, .PPTX)

Estimado GAIS, implementa los exportadores de documentos vivos de producción en `src/lib/exporters/`:

REQUERIMIENTOS:
1. `dualHeaderDocx.ts`: Exporta informes técnicos en `.docx` con tabla de 3 columnas para el Doble Membrete y firmantes.
2. `dualHeaderXlsx.ts`: Exporta valuaciones y APU en `.xlsx` usando `exceljs`, incluyendo fórmulas reales (p. ej. `D2*E2`, `SUM(I2:I5)`), BCV e IGTF. Prohibido usar el paquete deprecado `xlsx`.
3. `dualHeaderPptx.ts`: Exporta presentaciones ejecutivas en `.pptx` usando `pptxgenjs` con layout 16:9 y Doble Membrete.

Verifica que no existan errores de compilación con `npx tsc --noEmit`.
```

### 🧪 Checklist de Validación Post-Commit (Sprint 19):
- [ ] `.docx` editable en MS Word y LibreOffice.
- [ ] `.xlsx` contiene fórmulas reales recalculables, no valores planos.
- [ ] `.pptx` preserva layout 16:9 con Doble Membrete.

---

## SPRINT 20: INTERFACES 3 ENTORNOS (SALA CONTROL, LAPTOP, SOL)

### 🎯 Objetivo del Sprint:
Adaptar toda la suite de UI a los 3 entornos de trabajo reales: Sala de Control (Dark Mode 1920x1080), Laptops/Tablets (1024x768) y Campo al Sol (Sunlight Mode de alto contraste WCAG AAA).

### 📋 PROMPT EJECUTABLE PARA GAIS (Copiar y Pegar en AI Studio):

```text
🎯 SPRINT 20: ADAPTABILIDAD UX/UI A 3 ENTORNOS (SALA DE CONTROL, LAPTOP Y CAMPO AL SOL)

Estimado GAIS, implementa la conmutación de entornos de visualización en `src/ProjectContext.tsx` y la barra superior:

REQUERIMIENTOS:
1. Entorno 1: Sala de Control (Dark Mode industrial profundo, métricas de alta densidad).
2. Entorno 2: Laptop/Tablet (Luminosidad estándar, formularios navegables).
3. Entorno 3: Campo al Sol (Sunlight Mode: fondo blanco puro, bordes negros gruesos, contraste 12.5:1 WCAG AAA, botones de 48px+ para uso con guantes industriales).

Aplica las clases CSS universales en `src/index.css`.
Verifica con `npx tsc --noEmit`.
```

### 🧪 Checklist de Validación Post-Commit (Sprint 20):
- [ ] Botón de alternancia entre Sala de Control, Laptop y Campo al Sol.
- [ ] Sunlight Mode cumple WCAG AAA y botones >= 48px.
- [ ] `npx tsc --noEmit` = 0 errores.

---

## SPRINT 21: RESILIENCIA OFFLINE AVANZADA Y SYNC CENTER

### 🎯 Objetivo del Sprint:
Fortalecer el motor offline en Dexie DB con id de operación inmutable (`operationId` UUID v4), centro de sincronización visual (Sync Center) y resolución de conflictos.

### 📋 PROMPT EJECUTABLE PARA GAIS (Copiar y Pegar en AI Studio):

```text
🎯 SPRINT 21: RESILIENCIA OFFLINE, SYNC CENTER Y RESOLUCIÓN DE CONFLICTOS

Estimado GAIS, perfecciona el motor offline en `src/lib/offline/syncEngine.ts` y `src/lib/offline/outbox.ts`:

REQUERIMIENTOS:
1. Agrega una modal/panel de Sync Center en la barra de navegación para mostrar operaciones pendientes, fallidas o sincronizadas.
2. Garantiza la idempotencia criptográfica: cada operación enviada a Firestore incluye `operationId` para evitar duplicados en reintentos por mala conexión.
3. Si ocurre un conflicto de edición en un PTW o Valuación, muestra la interfaz de resolución de conflictos para el usuario de campo.

Verifica con `npx tsc --noEmit`.
```

### 🧪 Checklist de Validación Post-Commit (Sprint 21):
- [ ] Modal de Sync Center funcional en la barra superior.
- [ ] `operationId` garantiza 0 duplicados en Firestore.
- [ ] `npx vitest run` pasa al 100%.

---

## SPRINT 22: COMMAND CENTER DEL PROPIETARIO Y MONETIZACIÓN

### 🎯 Objetivo del Sprint:
Construir la Sala de Control Master para el Creador/Propietario de Industrial Control 360, permitiendo la gestión global de tenants, consumo de almacenamiento, Firestore reads/writes, licencias y auditorías de seguridad.

### 📋 PROMPT EJECUTABLE PARA GAIS (Copiar y Pegar en AI Studio):

```text
🎯 SPRINT 22: COMMAND CENTER DEL PROPIETARIO (MONETIZACIÓN Y CONTROL MULTI-TENANT)

Estimado GAIS, completa la consola master de administración en `src/pages/PlatformOwnerConsole.tsx`:

REQUERIMIENTOS:
1. Dashboard de métricas globales: Total de Organizaciones (Tenants) activas, MRR ($), lecturas/escrituras Firestore por día y GB de almacenamiento usados.
2. Control de Licencias y Suscripciones: Cambio de planes (Enterprise O&G, Industrial Pro) y suspensión temporizada por impago.
3. Audit Log Global de Seguridad: Registro inmutable de eventos críticos (intentos de escalada de rol, overrides de firma).

Verifica compilación con `npx tsc --noEmit`.
```

### 🧪 Checklist de Validación Post-Commit (Sprint 22):
- [ ] Panel de control exclusivo para `superadmin`.
- [ ] Monitoreo de cuotas e inmutabilidad de logs globales.
- [ ] `npx tsc --noEmit` = 0 errores.

---

# 🏛️ PROMPT DE AUDITORÍA POST-SPRINT (Para enviar a GPT 5.6, Claude 5 o Kimi)

```text
🏛️ AUDITORÍA DE INGENIERÍA: CUMPLIMIENTO DEL SPRINT [INSERTAR NÚMERO]

Estimado Experto del Consejo:

Google AI Studio ha entregado el código del Sprint [INSERTAR NÚMERO] en la rama `main` del repositorio `wolvesglobalsolutionsgroup-rgb/Industrial-360-App`.

Por favor revisa la implementación y responde:
1. ¿El módulo cumple 100% con los estándares de ingeniería y normas aplicables?
2. ¿Se mantiene el aislamiento multi-tenant sin fallbacks ni hardcodes?
3. ¿Otorgas tu sign-off oficial de producción?
```
