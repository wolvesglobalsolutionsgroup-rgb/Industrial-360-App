# ⚡ HALLAZGO DE KIMI K3 MAX: CORRECCIÓN DE SECUENCIA DE DEPENDENCIAS RBAC

**Código del Documento:** `DOC-GOV-2026-012`  
**Ubicación:** `docs/governance/REVISION_CRITICA_KIMI_DEPENDENCIAS_RBAC.md`  
**Fecha:** 29 de Julio de 2026  
**Auditor:** Kimi K3 Max (Verificado por Antigravity)  

---

## 💥 EL ERROR DE SECUENCIA DETECTADO POR KIMI K3 MAX

Kimi K3 Max identificó un fallo de ordenamiento técnico de alto riesgo en la propuesta inicial de reglas de seguridad:

> ⚠️ **ALERTA DE BLACKOUT (PERMISSION DENIED):**  
> Si se endurecen las `firestore.rules` (Sprint 15) exigiendo `request.auth.token.role` y `request.auth.token.orgId` **ANTES** de que la Cloud Function emita los Custom Claims y **ANTES** de que el cliente (`src/firebase.ts`) ejecute `getIdTokenResult(true)` para refrescar el JWT token, **TODOS LOS USUARIOS RECIBIRÁN UN ERROR `permission-denied` INMEDIATAMENTE AL DESPLEGAR Y LA APLICACIÓN QUEDARÁ 100% INOPERABLE.**

---

## 🛡️ ORDEN RIGUROSO DE DEPENDENCIAS DE CERO CAÍDAS (ZERO DOWNTIME)

Para evitar la rotura de la aplicación durante la migración Zero-Trust, el Sprint debe ejecutarse en el siguiente orden estricto de 3 pasos:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                SECUENCIA ATÓMICA DE IMPLEMENTACIÓN DE ROLES Y REGLAS                     │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ PASO 1 (SERVIDOR) : Crear Cloud Function `setUserCustomClaims` en `functions/src/index.ts`│
│                     que asigne `orgId` y `role` en los JWT Claims del usuario.            │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ PASO 2 (CLIENTE)  : Actualizar `src/firebase.ts` y `ProtectedRoute.tsx` para hacer       │
│                     `await user.getIdTokenResult(true)` y obtener las claims reales.     │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ PASO 3 (REGLAS)   : Endurecer `firestore.rules` para validar `request.auth.token`.       │
│                     Como el token ya posee las claims, NINGÚN usuario legítimo cae.      │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 ACCIÓN ADOPTADA

1. **Reordenamiento del Sprint 15:** El prompt para Google AI Studio (GAIS) exigirá implementar primero la emisión de Claims en Cloud Functions y la recepción en el cliente ANTES de activar el bloqueo estricto en `firestore.rules`.
2. **Ambiente de Emulador Obligatorio:** Todos los tests de reglas se ejecutarán con `firebase emulators:exec` simulando usuarios con y sin claims para confirmar 0 errores de `permission-denied` antes de cualquier despliegue.
