# 🎨 SISTEMA DE BRANDING DINÁMICO MULTI-TENANT Y KIT DE MARCA CORPORATIVA

**Código del Documento:** `DOC-ARCH-2026-005`  
**Ubicación:** `docs/architecture/SISTEMA_BRANDING_DINAMICO_Y_KIT_DE_MARCA.md`  
**Fecha:** 29 de Julio de 2026  
**Estado:** Norma de Arquitectura Obligatoria para Generación de Documentos y PDF/Excel  

---

## 1. REGLA INQUEBRANTABLE DE BRANDING MULTI-TENANT

**"TODOS LOS DOCUMENTOS Y REPORTES (PDF, EXCEL .XLSX, VISTAS) DEBEN ESTAR IDENTIFICADOS DINÁMICAMENTE CON EL KIT DE MARCA DE LA EMPRESA INQUILINA (BRANDKIT)."**

Queda estrictamente prohibido colocar logos fijos o colores hardcodeados en los generadores de documentos. La apariencia visual, paleta de colores, logos y membretes deben ser inyectados dinámicamente según la organización del usuario (`orgId`).

---

## 2. ESTRUCTURA DEL MODELO DE DATOS (`BrandKit`)

El perfil de cada inquilino en Firestore (`/organizations/{orgId}`) almacena la configuración de su marca corporativa:

```typescript
export interface BrandKit {
  companyName: string;         // Ej: "PROINTECA C.A." o "CONSORCIO O&G CAMPO SUR"
  taxId: string;               // Ej: "RIF: J-30492819-0"
  logoUrl: string;             // URL del logo de la Contratista (Izquierda)
  clientLogoUrl?: string;      // URL del logo de la Empresa Operadora / Cliente (Derecha: PDVSA, Chevron, Repsol)
  primaryColor: string;        // Color Primario (Hexadecimal, Ej: "#0B2239", "#059669")
  secondaryColor: string;      // Color Secundario (Hexadecimal, Ej: "#38BDF8", "#F59E0B")
  accentColor: string;         // Color de Acento / Badges
  fontFamily: string;          // Tipografía (Ej: "Helvetica", "Inter")
  address: string;             // Dirección Fiscal Corta
  contactEmail: string;        // Email de Contacto Corporativo
}
```

---

## 3. INTEGRACIÓN TRANSVERSAL EN GENERADORES DE DOCUMENTOS

### 📄 3.1 Generadores de PDF (`pdf-lib`, `puppeteer`, `HTML-to-PDF`)
- **Doble Membrete Dinámico:**
  - **Izquierda:** Logo de la Contratista (`BrandKit.logoUrl`).
  - **Derecha:** Logo del Cliente / Filial (`BrandKit.clientLogoUrl` o PDVSA/Chevron).
- **Banner de Encabezado:** El fondo de títulos y bástagos toma el color `BrandKit.primaryColor`.
- **Insignias y Estados:** Los acentos de tablas y cajas de dictamen toman el color `BrandKit.secondaryColor`.

### 📊 3.2 Exportaciones NATIVAS en Excel (`.xlsx` via `excelExporter.ts`)
- **Filas 1 a 3 (Membrete):** Inyección del Nombre Legal (`BrandKit.companyName`), RIF y Nombre del Cliente.
- **Estilo de Encabezados:** Relleno de celdas en el color primario de la empresa (`BrandKit.primaryColor`) con texto blanco en negrita.

### 🪪 3.3 Carnets PVC de Personal (`WorkerQrRegistry.tsx`)
- La tarjeta PVC (Frontal y Reverso) y el PDF de impresión consumen el `logoUrl` de la empresa contratista en la cabecera superior y usan su paleta corporativa `primaryColor`.

---

## 4. MOTOR DE RESOLUCIÓN EN TIEMPO DE EJECUCIÓN

Todos los generadores deben usar el resolver global `resolveBrandKit(orgId)`:

```typescript
export function getActiveBrandKit(currentOrganization: any): BrandKit {
  return {
    companyName: currentOrganization?.name || 'CONTRATISTA OPERATIVA C.A.',
    taxId: currentOrganization?.taxId || 'RIF: J-30000000-0',
    logoUrl: currentOrganization?.logoUrl || '/assets/default-contractor-logo.png',
    clientLogoUrl: currentOrganization?.clientLogoUrl || '/assets/pdvsa-logo.png',
    primaryColor: currentOrganization?.primaryColor || '#0B2239',
    secondaryColor: currentOrganization?.secondaryColor || '#059669',
    accentColor: currentOrganization?.accentColor || '#38BDF8',
    fontFamily: 'Helvetica',
    address: currentOrganization?.address || 'Anaco, Estado Anzoátegui, Venezuela',
    contactEmail: currentOrganization?.email || 'contacto@prointeca.com'
  };
}
```
