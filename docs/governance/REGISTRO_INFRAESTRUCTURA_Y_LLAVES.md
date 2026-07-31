# 🔐 REGISTRO OFICIAL DE INFRAESTRUCTURA Y SERVICIOS DEDICADOS
## INDUSTRIAL CONTROL 360 (INDUSTRIAL OS)

---

**Documento:** Registro de Configuración de Entorno, Proyectos y Claves API  
**Proyecto:** Industrial Control 360  
**Fecha de Actualización:** 31 de Julio de 2026  
**Propósito:** Desvinculación de entornos personales/globales y centralización de servicios dedicados.  

---

## 📌 1. PROYECTO DEDICADO EN GOOGLE CLOUD / AI STUDIO

* **Nombre del Proyecto en GCP/AI Studio:** `Proyecto I-360 App`
* **Número de Proyecto GCP:** `820771818710`
* **Nivel de Facturación Actual:** Nivel Gratuito / Free Tier ($0 Costos fijos de infraestructura)
* **Dominio Institucional:** Pendiente de adquisición (operando en entornos de prueba / Vercel sin dominio propio por ahora)

---

## 🔑 2. CLAVES DE API REGISTRADAS (DEDICADAS)

### A. Google AI Studio / Gemini API
* **Nombre de la Clave:** `Gemini I-360 App`
* **Proyecto Asociado:** `Proyecto I-360 App` (`820771818710`)
* **Propósito:** Invocación de proxy de inteligencia artificial para generación de informes, análisis de corrosión e ingesta de normativas.
* **Estado en Secret Manager:** Configurado para Cloud Functions.

### B. Resend Email Transaccional API
* **Nombre de la Clave:** `RESEND I-360 App`
* **Permisos:** Full Access (Todos los dominios)
* **Propósito:** Envío de notificaciones operativas, alertas SIHO, solicitudes de firma y enlaces de acceso al Portal Cliente.
* **Estado en Secret Manager:** Configurado para Cloud Functions.

---

## 🛠️ 3. ARQUITECTURA DE EXPORTACIÓN Y EDITABILIDAD DE ENTREGABLES

Para garantizar que los clientes e ingenieros puedan personalizar, extender o terminar manualmente los entregables (del 80% generado por la app al 100% final exigido por el cliente), el sistema soporta 4 motores de exportación editables:

```text
                  MATRIZ DE EXPORTACIÓN Y EDITABILIDAD
                  
 ┌──────────────────────┬──────────────────────┬──────────────────────┐
 │ FORMATO              │ LIBRERÍA MOTOR       │ USO Y EDITABILIDAD   │
 ├──────────────────────┼──────────────────────┼──────────────────────┤
 │ Excel (.xlsx)        │ exceljs              │ Cómputos, APU, Valúos│
 │                      │                      │ 100% editable        │
 ├──────────────────────┼──────────────────────┼──────────────────────┤
 │ Word (.docx)         │ docx / docxtemplater │ AST, PTS, Contratos, │
 │                      │                      │ Informes de Campo    │
 ├──────────────────────┼──────────────────────┼──────────────────────┤
 │ PowerPoint (.pptx)   │ pptxgenjs            │ Presentaciones KPI,  │
 │                      │                      │ Curva S para Directiva│
 ├──────────────────────┼──────────────────────┼──────────────────────┤
 │ PDF Oficial (.pdf)   │ pdf-lib / jsPDF      │ Sello inmutable, QR  │
 │                      │                      │ y Hash SHA-256       │
 └──────────────────────┴──────────────────────┴──────────────────────┘
```

---

## 📝 4. HISTORIAL DE CAMBIOS Y GOBERNANZA

- **31/07/2026:** Creación del proyecto dedicado `Proyecto I-360 App` en Google Cloud y generación de claves API exclusivas (`Gemini I-360 App` y `RESEND I-360 App`).
- **31/07/2026:** Integración de la estrategia de exportación editable (.docx, .xlsx, .pptx) en la especificación del Plan Maestro.
