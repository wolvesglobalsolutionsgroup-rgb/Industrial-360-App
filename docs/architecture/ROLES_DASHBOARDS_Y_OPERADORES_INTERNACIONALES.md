# ESPECIFICACIÓN DE ARQUITECTURA: CONSOLA DEL CREADOR (PLATFORM OWNER), GESTIÓN DE ROLES MULTI-TENANT, COMMAND CENTER SUPERADMIN, DASHBOARD CLIENTE Y OPERADORES INTERNACIONALES

**Proyecto:** Industrial Control 360 — The Oil & Gas Operating System  
**Ruta del Archivo:** `docs/architecture/ROLES_DASHBOARDS_Y_OPERADORES_INTERNACIONALES.md`  
**Estado:** Especificación Técnica Maestra v1.1 — Actualizado con Rol Creador del Software  
**Fecha:** Julio 2026  

---

## ÍNDICE DE CONTENIDOS
0. [El Rol Creador del Software (Platform Owner) y Consola Maestra de Plataforma](#0-el-rol-creador-del-software-platform-owner-y-consola-maestra-de-plataforma)
1. [Gestión y Asignación de Roles Multi-Tenant](#1-gestión-y-asignación-de-roles-multi-tenant)
2. [Sala de Control Superadmin (Command Center)](#2-sala-de-control-superadmin-command-center)
3. [Dashboard para el Cliente del Cliente (PDVSA, Petrocedeño, Operadores Internacionales)](#3-dashboard-para-el-cliente-del-cliente)
4. [Investigación de Operadores Internacionales en Venezuela (Chevron, Repsol, ENI, Maurel & Prom)](#4-investigación-de-operadores-internacionales-en-venezuela)

---

## 0. EL ROL CREADOR DEL SOFTWARE (PLATFORM OWNER) Y CONSOLA MAESTRA DE PLATAFORMA

### 0.1 Definición del Rol Creador / Propietario del SaaS (`platform_owner`)
El rol **`platform_owner`** (o **Administrador de Plataforma / Creador del Software**) es la máxima autoridad del sistema **Industrial Control 360**. Es el rol que ostenta la empresa creadora del software (nosotros / PROINTECA Matriz) para operar, licenciar, monitorear y mantener toda la plataforma e infraestructura cloud.

```
                  JERARQUÍA DE AUTORIDAD DE LA PLATAFORMA
                  
        ┌────────────────────────────────────────────────────────┐
        │ PLATFORM OWNER (Creador del Software / Nosotro)       │
        │ • Acceso a la Consola Maestra SaaS                     │
        │ • Gestión global de Tenants (Clientes Contratistas)    │
        │ • Habilitación de Módulos, Cuotas de Disco e Licencias │
        └───────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
        ┌────────────────────────────────────────────────────────┐
        │ ORGANIZACIONES CLIENTES (Tenants: PROINTECA, Semax...)│
        │ • Gerentes de Organización                             │
        │ • Supervisores / Inspectores / Campo                   │
        │ • Cliente Final (PDVSA / Petrocedeño / Chevron)        │
        └────────────────────────────────────────────────────────┘
```

---

### 0.2 Consola Maestra de Gestión de Clientes (SaaS Master Admin Panel)
El panel **`PlatformOwnerConsole.tsx`** provee la interfaz para la administración de clientes y servicios:

```
+---------------------------------------------------------------------------------------+
|  INDUSTRIAL CONTROL 360 — CONSOLA MAESTRA DEL CREADOR (PLATFORM OWNER CONSOLE)        |
+---------------------------------------------------------------------------------------+
| Tenants Activos: 18 | Usuarios Globales: 420 | Almacenamiento: 4.2 TB | MRR: $34,000    |
+---------------------------------------------------------------------------------------+
| [+ Crear Nuevo Cliente/Tenant]  |  Filtro Estatus: [Activos v]  | Buscar: [         ] |
+---------------------------------------------------------------------------------------+
| Cliente / Organización | Plan/Licencia | Proyectos | Storage Usado | Estado  | Acciones|
+------------------------+---------------+-----------+---------------+---------+---------+
| PROINTECA C.A.         | Enterprise    | 12        | 1.2 TB        | ACTIVO  | [Gestionar]
| SEMAX PINO WGS         | Pro Tier      | 4         | 420 GB        | ACTIVO  | [Gestionar]
| CONTRATISTA VZLA 2000  | Starter Tier  | 1         | 15 GB         | PRUEBA  | [Gestionar]
+---------------------------------------------------------------------------------------+
```

---

### 0.3 Funcionalidades de Gestión del Creador del Software

1. **Aprovisionamiento y Alta de Nuevos Clientes (Tenant Provisioning):**
   * Creación de la entidad `/organizations/{orgId}` en Firestore.
   * Asignación del primer usuario Administrador/Gerente del cliente.
   * Generación automática de llaves de cifrado y espacio aislado en Firebase Storage (`gs://app-bucket/organizations/{orgId}/`).

2. **Gestión de Licencias, Planes y Cuotas:**
   * **Control de Módulos (Feature Toggles):** Habilitar o deshabilitar módulos específicos por cliente (ej. Activar/Desactivar *Módulo de Isométricos CAD*, *Módulo de Estimación APU*, *Agentes de IA Gemini*).
   * **Asignación de Cuotas:** Modificar límites de almacenamiento (GB/TB) y número de proyectos autorizados.
   * **Estatus de Suscripción:** Marcaje de estado: `ACTIVO`, `EN_PRUEBA_30_DIAS`, `SUSPENDIDO_POR_PAGO`, `CANCELADO`.

3. **Monitor de Actividad Global (Sin Violación de Privacidad de Datos):**
   * Mapeo de volumen operativo (ej. PTWs creados hoy en la plataforma, valuaciones firmadas, dossieres compilados).
   * Lectura de métricas agregadas mediante Cloud Functions sin acceder a datos sensibles de negocio confidenciales del cliente.

4. **Soporte Técnico y Reset de Accesos:**
   * Restablecimiento de credenciales del Gerente principal del cliente.
   * Registro de auditoría del sistema para resolver incidencias operativas.

---

## 1. GESTIÓN Y ASIGNACIÓN DE ROLES MULTI-TENANT

### 1.1 Diseño del Portal de Administración de Usuarios y Roles
El **Portal de Administración de Usuarios** permite a los roles autorizados (`platform_owner` a nivel global o `gerente` dentro de su `orgId`) gestionar el ciclo de vida del personal operativo, inspectores, supervisores y clientes finales.

#### Características UI/UX Principales:
- **Tabla Centralizada de Usuarios**: Visualización de correo, nombre, rol actual (`platform_owner`, `superadmin`, `gerente`, `supervisor`, `inspector`, `campo`, `cliente`), fecha de último acceso y estado de Custom Claims.
- **Modal de Asignación y Cambio de Rol**: Selector emergente para asignar un nuevo rol a un usuario existente dentro del tenant.
- **Botón de Invalidación Inmediata de Sesión (`Revocar Tokens`)**: Fuerza el refresco o cierre de sesión inmediato del token JWT (`revokeRefreshTokens`).
- **Registro Visible de Auditoría**: Tabla en tiempo real que lista quién cambió el rol de quién, desde qué dirección IP y en qué fecha/hora exactas.

```
+---------------------------------------------------------------------------------------+
|  GESTIÓN DE USUARIOS Y ROLES MULTI-TENANT — [Organización: SEMAX PINO WGS]           |
+---------------------------------------------------------------------------------------+
| + Invitar Nuevo Usuario   |  Filtro por Rol: [Todos v]  | Buscar: [               ] |
+---------------------------------------------------------------------------------------+
| Nombre           | Correo                 | Rol Actual  | Custom Claims | Acciones    |
+------------------+------------------------+-------------+---------------+-------------+
| Ing. Carlos Ruiz | c.ruiz@semaxpino.com    | Gerente     | Synced        | [Editar] [X]|
| Juan Pérez       | j.perez@semaxpino.com   | Supervisor  | Synced        | [Editar] [X]|
| Pedro Gómez      | p.gomez@semaxpino.com   | Inspector   | Synced        | [Editar] [X]|
| Representante    | inspect@pdvsa.com      | Cliente     | Synced        | [Editar] [X]|
+---------------------------------------------------------------------------------------+
```

---

### 1.2 Gestión de Custom Claims en Firebase y Cloud Function de Asignación
Para garantizar que **cero lecturas de documentos Firestore** sean necesarias durante la verificación de permisos en las reglas de seguridad, se utilizan **Firebase Auth Custom Claims**.

#### Estructura del Payload de Custom Claims:
```json
{
  "orgId": "org_semax_pino_2026",
  "role": "gerente",
  "permissions": ["read_all", "write_tasks", "approve_valuations", "compile_dossier"]
}
```

#### Código TypeScript de la Cloud Function Callable (`setUserCustomClaims`):

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const setUserCustomClaims = functions.https.onCall(async (data, context) => {
  // 1. Verificación de Autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'El usuario debe estar autenticado para realizar esta acción.'
    );
  }

  const callerUid = context.auth.uid;
  const callerRole = context.auth.token?.role;
  const callerOrgId = context.auth.token?.orgId;

  const { targetUid, role, orgId, permissions } = data || {};

  // 2. Validación de Parámetros Requeridos
  if (!targetUid || !role || !orgId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan parámetros requeridos: targetUid, role y orgId.'
    );
  }

  // 3. Verificación Estricta de Permisos del Solicitante (Platform Owner o Gerente de la Org)
  const isPlatformOwner = callerRole === 'platform_owner' || callerRole === 'superadmin';
  const isGerenteOfOrg = callerRole === 'gerente' && callerOrgId === orgId;

  if (!isPlatformOwner && !isGerenteOfOrg) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'No tiene permisos suficientes para modificar roles en esta organización.'
    );
  }

  // 4. Asignación de Custom Claims en Firebase Auth
  const customClaims = {
    role,
    orgId,
    permissions: Array.isArray(permissions) ? permissions : []
  };

  await admin.auth().setCustomUserClaims(targetUid, customClaims);

  // 5. Invalidation / Revocación de Tokens de Refresco para Forzar Renovación de JWT
  await admin.auth().revokeRefreshTokens(targetUid);

  // 6. Obtención de Dirección IP Real del Solicitante
  const headers = context.rawRequest?.headers || {};
  const rawIp = headers['x-forwarded-for'] ||
                headers['fastly-client-ip'] ||
                headers['x-real-ip'] ||
                context.rawRequest?.ip || 'unknown';
  const ip = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : String(rawIp);

  // 7. Registro Inmutable en Registro de Auditoría (/organizations/{orgId}/audit_logs)
  const auditRef = admin.firestore().collection(`organizations/${orgId}/audit_logs`);
  await auditRef.add({
    action: 'USER_ROLE_UPDATED',
    callerUid,
    targetUid,
    newRole: role,
    newOrgId: orgId,
    claimsAssigned: customClaims,
    ip,
    userAgent: headers['user-agent'] || 'unknown',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    success: true,
    message: `Custom claims asignados exitosamente al usuario ${targetUid}.`
  };
});
```

---

### 1.3 Registro de Auditoría de Seguridad (`/organizations/{orgId}/audit_logs`)
Cada evento crítico de seguridad se almacena bajo el tenant en la subcolección `/organizations/{orgId}/audit_logs`:

#### Esquema del Documento de Audit Log:
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string | ID autogenerado del log de auditoría |
| `action` | string | `USER_ROLE_UPDATED`, `ROLE_REVOKED`, `PORTAL_ACCESS_REVOKED`, `VALUATION_APPROVED` |
| `callerUid` | string | UID de Firebase del usuario que realizó la acción |
| `targetUid` | string | UID de Firebase del usuario afectado |
| `newRole` | string | Rol asignado (`platform_owner`, `superadmin`, `gerente`, `supervisor`, `inspector`, `campo`, `cliente`) |
| `ip` | string | IP pública de origen extraída de cabeceras HTTP de confianza |
| `userAgent` | string | Browser/Device fingerprint del cliente |
| `timestamp` | timestamp | `FieldValue.serverTimestamp()` inmutable |

---

### 1.4 Matriz RBAC / ABAC por Módulo del Sistema

| Módulo / Funcionalidad | Platform Owner | Gerente | Supervisor | Inspector | Campo | Cliente |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Consola Maestra Creador** | 🟢 Total | 🔴 No Access | 🔴 No Access | 🔴 No Access | 🔴 No Access | 🔴 No Access |
| **Command Center Global** | 🟢 Total | 🔴 No Access | 🔴 No Access | 🔴 No Access | 🔴 No Access | 🔴 No Access |
| **Ajustes de Org & Kit Marca** | 🟢 Total | 🟢 Total | 👁️ Ver Solo | 👁️ Ver Solo | 🔴 No Access | 👁️ Ver Solo |
| **Gestión Usuarios & Roles** | 🟢 Total | 🟢 En Org | 🔴 No Access | 🔴 No Access | 🔴 No Access | 🔴 No Access |
| **WBS / Tasks Cronograma** | 🟢 Total | 🟢 Total | 🟢 Crear/Edit | 👁️ Ver Solo | ✏️ Status Campo | 👁️ Ver Solo |
| **Valuaciones & Facturación** | 🟢 Total | 🟢 Aprobación | ✏️ Borrador | 🔴 No Access | 🔴 No Access | 👁️ Ver Solo* |
| **Gastos & Control Costos** | 🟢 Total | 🟢 Total | ✏️ Registrar | 🔴 No Access | 🔴 No Access | 🔴 No Access |
| **SIHO-A & Permisos PTW** | 🟢 Total | 🟢 Total | 🟢 Emitir/Aprobar | 🟢 Inspeccionar | ✏️ Lecturas/Firma | 👁️ Audit |
| **QA/QC Juntas & NDT** | 🟢 Total | 🟢 Total | 🟢 Crear Juntas | 🟢 Firmar NDT | 👁️ Ver Solo | 👁️ Audit |
| **Corridas ILI Pigging & FFS** | 🟢 Total | 🟢 Total | 🟢 Cargar ILI | 🟢 Cargar ILI | 🔴 No Access | 👁️ Informes |
| **Bóveda Dossier As-Built** | 🟢 Total | 🟢 Compilar | ✏️ Aportar | ✏️ Aportar | 🔴 No Access | 👁️ Ver/Descargar |

---

## 2. SALA DE CONTROL SUPERADMIN (COMMAND CENTER)

### 2.1 Visión General del Command Center Global
La **Consola Maestra del Creador (Platform Owner)** y el **Command Center Superadmin** representan el panel exclusivo para los propietarios de la plataforma **Industrial Control 360**. Proporciona supervisión multi-tenant a nivel macro sin comprometer el aislamiento de datos entre organizaciones.

---

## 3. DASHBOARD PARA EL CLIENTE DEL CLIENTE (PDVSA, PETROCEDEÑO, OPERADORES INTERNACIONALES)

### 3.1 Centro de Control Ejecutivo para Empresas Operadoras
Diseñado específicamente para las contrapartes gerenciales de las **Empresas Operadoras y Mixtas** (PDVSA, Petrocedeño, Petropiar, Petroboscán, Chevron, Repsol, ENI, Maurel & Prom). Presenta una visión de alto nivel limpia, ejecutiva y libre de complejidad operativa de campo.

---

## 4. INVESTIGACIÓN DE OPERADORES INTERNACIONALES EN VENEZUELA (CHEVRON, REPSOL, ENI, MAUREL & PROM)

### 4.1 Matriz Comparativa de Normas y Entregables (PDVSA vs Especificaciones Internacionales)

| Dominio Técnico | Norma PDVSA | Chevron (EE.UU. / Venezuela) | Repsol (España / Venezuela) | ENI (Italia / Venezuela) | Maurel & Prom (Francia / Vzla) | Estándares Internacionales (ISO/ASME/API) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Seguridad & HSE** | PDVSA SI-S-04 / IR-S-04 (PTS y AST) | OEMS / Chevron HSE Standard / JSA & Work Permit | NORMA Repsol HSE / Criterios de Seguridad en Obra | ENI STEA / Directivas de Seguridad Ambiental | M&P Safety Manual & Permit to Work | ISO 45001:2018 / ISO 14001:2015 |
| **Aseguramiento Calidad** | PDVSA PI-02-01-01 / Manual de Calidad | Chevron CES (Chevron Engineering Standards) | Repsol Especificaciones de Inspección | ENI Technical Directives & Quality Manual | M&P Quality Assurance Guidelines | ISO 9001:2015 Quality Systems |
| **Tuberías de Proceso** | PDVSA O-201 / H-221 | CES Piping Standards / ASME B31.3 | Repsol Especificación Tuberías / ASME B31.3 | ENI STEA Tuberías de Planta / ASME B31.3 | M&P Process Piping Code | ASME B31.3 / ASME B31.4 / ASME B31.8 |
| **Soldadura & NDT** | PDVSA K-301 / PI-02-04 | API 1104 / ASME Secc. IX / AWS D1.1 | Repsol Criterios Soldadura / API 1104 | ENI Spec. Welding & NDT / ASME IX | M&P Welding Specification | ASME IX / API 1104 / ASTM DICONDE |
| **Pruebas Hidrostáticas** | PDVSA L-TP-1.1 / L-TP-1.3 | Chevron Hydrotest Standard / ASME B31.3 | Repsol Prueba de Presión Tuberías | ENI Collaudo Idraulico Directives | M&P Pressure Test Standard | ASME B31.3 Sec. 345 / API 570 |
| **Tanques de Almacenamiento**| PDVSA 90616.1.024 | API 650 / API 653 / CES Tank Standards | Repsol Inspección Tanques API 650 | ENI STEA Serbatoi API 650 | M&P Tank Integrity Code | API 650 / API 653 / API 620 |
| **Dossier de Calidad** | Manual PDVSA Tomos I-VIII | Chevron As-Built Turnover Data Book | Dossier Final de Obra Repsol | Libro de Calidad Final ENI (Folder Teknik) | Handover Quality Book M&P | ISO 10005:2018 Quality Plans |
