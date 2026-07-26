# Registro de Decisiones de Arquitectura — Industrial Control 360

| Fecha | Decisión Tomada | Alternativas Consideradas | Razón de la Elección |
|---|---|---|---|
| 2026-07-26 | Sistema de Componentes UI Primitivos (`src/components/ui/`) para normalizar la UI | Mantener estilos Ad-hoc o instalar shadcn completo | Normaliza la interfaz con la estética "Industrial Executive", soportando densidad, border-radius y tokens de color dinámicos del `ThemeContext` sin sobrecargar bundle. |
| 2026-07-26 | Work Board Colaborativo Kanban sobre Firestore en lugar de Socket.io | Servidor WebSocket dedicado / Socket.io | Firestore brinda sincronización reactiva en tiempo real nativa, persistencia multi-tenant (`/tasks` por `projectId`) y soporte offline sin infraestructura adicional. |
