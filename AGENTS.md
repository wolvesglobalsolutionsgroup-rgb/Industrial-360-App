# AGENTS.md — Industrial Control 360
### Instrucciones de rigor técnico para el agente de Google AI Studio

*Reemplaza el AGENTS.md actual (solo tenía una línea de idioma) por este. Pégalo completo en la configuración de "Custom Instructions" / "System Instructions" de tu app en AI Studio, y además guárdalo como `AGENTS.md` en la raíz del repo para que quede versionado.*

---

## 0. Idioma y tono
Comunícate siempre con el usuario en español. Sé directo sobre limitaciones técnicas — nunca describas una función como "completa" o "lista" si tiene datos de ejemplo, simulación, o lógica pendiente.

---

## 1. Regla central — esto no es un mockup, es software de producción

Este proyecto ya tuvo un problema real: varias pantallas se veían terminadas porque la UI estaba completa, pero no tenían ningún motor detrás (arrays hardcodeados, funciones `handleSimulate*`, `Math.random()` generando datos falsos). Un ingeniero de campo o un cliente de Oil & Gas detecta esto en la primera hora de uso. **A partir de ahora, ninguna función se declara terminada solo porque la interfaz se ve bien.**

### Definición de "terminado" para cualquier feature nueva o modificada:
1. Está conectado a datos reales (Firestore, Storage, o un parser real de archivo) — no a un array de ejemplo.
2. Maneja el estado vacío (¿qué se ve si no hay datos todavía?) y el estado de error (¿qué se ve si falla la escritura/lectura?).
3. Si hace un cálculo de ingeniería, la fórmula está citada (norma + sección) en un comentario, no solo aproximada.
4. Si necesita IA, pasa por el proxy de servidor (`src/lib/geminiProxy.ts` → `/api/callGeminiProxy`) — **nunca** llama a `@google/genai` directo desde un componente de `src/pages/`.
5. Si es multi-tenant, lee/escribe bajo `/organizations/{orgId}/projects/{projId}/...` — nunca crea una colección nueva en la raíz de Firestore.
6. Respeta los roles ya definidos en `ProtectedRoute.tsx` / `firestore.rules` — no inventa un rol nuevo sin actualizar ambos archivos a la vez.

---

## 2. Patrones prohibidos — si el agente está por escribir esto, debe detenerse

- ❌ `Math.random()` para generar cualquier dato que se muestre como si fuera real (anomalías, KPIs, montos, fechas). Si necesitas datos de ejemplo para desarrollo, créalos explícitamente como *seed data* documentado, nunca inline en el componente.
- ❌ Funciones nombradas `handleSimulate*`, `mockData`, `fakeResponse`, o similares que reemplacen lógica real sin decirlo claramente en el nombre y en un comentario `// TODO: reemplazar con parser real antes de producción`.
- ❌ Arrays de datos hardcodeados dentro de un componente que representen "estado actual" de algo que debería venir de Firestore (ej. `progressData`, `budgetData` con valores fijos).
- ❌ Cualquier `apiKey` o secreto pasado a `vite.config.ts` vía `define`, o expuesto en cualquier archivo bajo `src/`. Las claves viven solo en variables de entorno del servidor (`server.ts` / `functions/`).
- ❌ Reglas de Firestore donde el fallback de un rol o permiso faltante sea el nivel más alto (`superadmin`). El fallback de cualquier función `is*()` en `firestore.rules` debe ser **denegar**, nunca conceder.
- ❌ Colecciones nuevas en la raíz de Firestore (`/algo/{id}`) — todo dato de proyecto va bajo `/organizations/{orgId}/projects/{projId}/...`.
- ❌ Agregar un ítem al menú de `Layout.tsx` que apunte a una ruta sin implementar (`ModulePlaceholder`). Si un módulo no está listo, no aparece en el menú — mejor eso que un cliente descubriéndolo vacío en una demo.

---

## 3. Arquitectura ya establecida — reusar, no reinventar

Antes de escribir una pantalla o función nueva, el agente debe revisar si ya existe un patrón equivalente y seguirlo:

| Necesidad | Patrón ya existente a reusar |
|---|---|
| Llamar a Gemini | `src/lib/geminiProxy.ts` → `callGeminiProxy()` |
| Verificar permisos de una pantalla | `<ProtectedRoute allowedRoles={[...]}>` |
| Leer/escribir datos de proyecto | `/organizations/{orgId}/projects/{projId}/...` vía `ProjectContext.tsx` |
| Parsear un archivo de formato externo | `src/lib/parsers/` (ver `xerParser.ts`, `bc3Parser.ts` como plantilla) |
| Branding por organización | `BrandKit` en `ProjectContext.tsx` / `Settings.tsx` |
| Exportar a PDF | patrón ya usado en `Dashboard.tsx` (`jsPDF` + `toPng`) |
| Trabajo offline | `src/lib/offlineSync.ts` + `public/sw.js` |
| Tema visual | `src/theme/ThemeContext.tsx` + `themePresets.ts` |

Si una tarea nueva necesita algo que no encaja en ninguno de estos patrones, es una decisión de arquitectura — el agente debe señalarlo explícitamente en su respuesta antes de improvisar una solución nueva, no decidirlo en silencio.

---

## 4. Antes de dar por cerrada una tarea, el agente debe verificar (auto-checklist)

1. ¿Esta función escribe o lee de una colección que respeta la jerarquía multi-tenant?
2. ¿Hay algún dato mostrado en pantalla que en realidad es un valor fijo o aleatorio?
3. ¿La regla de Firestore correspondiente ya existe y es coherente con el rol que debería tener acceso?
4. ¿Si esto falla (sin internet, sin permisos, colección vacía), qué ve el usuario? ¿Se probó ese caso?
5. ¿Esto expone alguna clave o secreto al bundle del cliente?
6. Si se agregó una fórmula de ingeniería, ¿está citada la norma exacta (ej. "ASME B31.3 Ec. 3a", "ASME B31G Sec. 3")?

Si la respuesta a cualquiera de estas es "no lo sé" o "no lo verifiqué", el agente debe decirlo explícitamente en su respuesta al usuario en vez de asumir que está bien.

---

## 5. Seguridad — no negociable

- Ninguna clave de API en código de cliente (`src/`), nunca. Todo vía proxy de servidor.
- Todo default de permisos en `firestore.rules` es "denegar", nunca "permitir".
- Cualquier `console.log`/`console.warn` que exponga IDs de usuario, tokens, o datos de clientes se elimina antes de considerar la tarea terminada.
- Datos de un `orgId` nunca deben ser legibles desde un `orgId` distinto — si el agente agrega una regla `allow read: if isAuthenticated()` sin verificar pertenencia a la organización, debe marcarlo como pendiente de revisión, no darlo por bueno.

---

## 6. Cuando el agente no está seguro

Si una instrucción del usuario es ambigua entre "hazlo rápido para la demo" y "hazlo bien para producción", el agente debe preguntar explícitamente cuál de las dos aplica **antes** de escribir código — no asumir "rápido" solo porque es más simple de generar. El costo de una demo que se cae en producción es mayor que el costo de una pregunta.

---

## 7. Registro de decisiones

Cada vez que se tome una decisión de arquitectura no trivial (elegir una librería de mapas, un formato de parser, una estructura de rol nuevo), el agente debe agregar una línea a un archivo `DECISIONS.md` en la raíz (crearlo si no existe) con: fecha, decisión tomada, alternativas consideradas, y por qué. Esto evita que decisiones se reviertan sin querer en sesiones futuras de AI Studio.