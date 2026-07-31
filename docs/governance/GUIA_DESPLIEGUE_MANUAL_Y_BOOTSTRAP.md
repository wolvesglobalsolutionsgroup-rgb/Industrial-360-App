# Guía de Despliegue Manual, Compilación y Bootstrapping

**Proyecto:** Industrial Control 360  
**Versión:** 1.0.0 Zero-Trust Architecture  
**Fecha:** Julio 2026  

---

## 1. Verificación de Compilación Local

Antes de proceder al despliegue en producción o entornos de staging, se debe validar que el código TypeScript no contenga errores de tipado o discrepancias de sintaxis.

### Pasos:
1. **Instalar dependencias del proyecto raíz:**
   ```bash
   npm install
   ```

2. **Ejecutar verificación de compilación sin emisión:**
   ```bash
   npx tsc --noEmit
   ```
   *(También disponible mediante `npm run lint`)*

3. **Verificar y compilar el módulo de Cloud Functions:**
   ```bash
   cd functions
   npm install
   npm run build
   cd ..
   ```

---

## 2. Despliegue de Reglas Zero-Trust

### A. Firestore Rules (`firestore.rules`)
Las reglas de seguridad de Firestore imponen una denegación por defecto y regulan el acceso multi-tenant a través de la jerarquía de organizaciones (`/organizations/{orgId}`).

Se protegen 19 colecciones específicas bajo **Collection Group Queries**:
1. `tasks`
2. `expenses`
3. `valuations`
4. `siho_ptw`
5. `weld_joints`
6. `field_reports`
7. `documents`
8. `inventory`
9. `routes`
10. `engineering_calcs`
11. `client_portals`
12. `client_portal_access_logs`
13. `hot_tap_interventions`
14. `procurement`
15. `apus`
16. `quantity_takeoffs`
17. `workers`
18. `worker_attendance`
19. `settings`

### B. Storage Rules (`storage.rules`)
- **BrandKit Público**: Permitido en `/organizations/{orgId}/brandkit_public/{allPaths=**}` (máx 2MB, tipos png/jpeg/svg).
- **Archivos Operativos Multi-Tenant**: En `/organizations/{orgId}/{allPaths=**}` (máx 20MB, formato imagen o PDF).
- **Denegación por Defecto**: Todo acceso no explícito es bloqueado.

### C. Comando de Despliegue de Reglas:
```bash
firebase deploy --only firestore:rules,storage
```

---

## 3. Compilación y Despliegue de Cloud Functions

El backend serverless en `functions/src/index.ts` administra lógica autoritativa, proxies seguros y firmas documentales.

### Comandos de Despliegue:
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

---

## 4. Registro de Secretos (Secret Manager)

Configurar los secretos necesarios para los servicios externos:

```bash
# Clave API para motor IA Gemini
firebase functions:secrets:set GEMINI_API_KEY

# Clave API para envíos de correo Resend
firebase functions:secrets:set RESEND_API_KEY
```

---

## 5. Script de Bootstrapping de Superadministrador Inicial

Para aprovisionar la primera cuenta administradora global sin depender de interfaces públicas de registro:

1. Establecer la variable de entorno con la clave de cuenta de servicio:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/ruta/a/serviceAccountKey.json"
   ```

2. Ejecutar el script especificando el Email o UID del usuario:
   ```bash
   node scratch/bootstrapSuperadmin.js admin@industrialcontrol360.com
   ```

3. **Acción Posterior:** El usuario debe cerrar sesión y re-ingresar a la plataforma para renovar su token JWT con los Custom Claims (`role: 'superadmin'`, `orgId: 'industrial-360-admin'`).
