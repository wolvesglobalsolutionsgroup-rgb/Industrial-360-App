# Flujos de Trabajo Principales — Industrial Control 360

## 1. Flujo de Valuaciones de Obra (ROE)

```text
[ Inspector / Residente ]
       │
       ▼
1. Crea Valuación ("Borrador") con fotos de avance y cálculo de deducciones
       │
       ▼
2. Firma y Avanza Estado ➔ "En Revisión"
       │
       ▼
[ Supervisor de Contrato ]
       │
       ▼
3. Revisa soporte técnico, firma y aprueba ➔ "Aprobada"
       │
       ▼
[ Gerente de Proyecto / Finanzas ]
       │
       ▼
4. Ejecuta la orden de pago y firma final ➔ "Pagada"
```

## 2. Flujo de Inspección y Evaluación ILI (API 1163)

```text
1. Carga / Selección de Datos ILI (Preset Cardón-Amuay o archivo procesado)
2. Cálculo de profundidad ajustada con tolerancia instrumental de herramienta
3. Evaluación de Presión Segura (P_safe) y Ratio de Presión de Ruptura (P_safe / P_ref)
4. Clasificación de Acción:
   - Burst Ratio < 1.0 ➔ Acción Inmediata (Camisa Tipo B / API 1104 / ASME B31.4)
   - Depth >= 40% o ERF >= 0.80 ➔ Atención Programada (Envolvente Compuesta / Camisa Tipo A)
   - Monitoreo Continuo
5. Exportación de Informe Técnico PDF de Integridad
```

## 3. Flujo de Cliente & Fiscalización Externa (Portal Cliente)

```text
1. Configuración de Portal en ClientPortalBuilder (Asignación de Proyectos & Vencimiento)
2. Envío de Enlace Seguro al Cliente
3. Registro Automático de Log de Acceso en /organizations/{orgId}/client_portal_access_logs
4. Despliegue de Dashboard Consolidado con Avance, Valuaciones, PTW SIHO y Dossier Compilado
```
