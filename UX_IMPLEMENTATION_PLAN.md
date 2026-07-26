# UX Implementation Plan — Industrial Control 360

Basado en `UX_UI_REFERENCE.md`, este documento traduce la visión UX/UI en arquitectura visual, componentes, layouts, rutas y backlog técnico listo para implementación.

---

## 1. Objetivo

Crear una capa UX/UI enterprise reusable para Industrial Control 360 que soporte:
- operación interna
- control ejecutivo
- portal cliente compartible
- theming configurable
- inbox y notificaciones
- media-rich reporting

---

## 2. Arquitectura de frontend propuesta

```txt
src/
  theme/
    tokens.ts
    presets.ts
    ThemeProvider.tsx
    useTheme.ts
    types.ts
  components/
    ui/
      cards/
        MetricCard.tsx
        ChartCard.tsx
        StatusCard.tsx
        TimelineCard.tsx
        MediaCard.tsx
        DocumentCard.tsx
        AlertCard.tsx
        InboxCard.tsx
      charts/
        KpiRibbon.tsx
        ProgressCurveChart.tsx
        MilestoneTimeline.tsx
        DonutBreakdown.tsx
        TrendAreaChart.tsx
      navigation/
        TopContextBar.tsx
        NotificationsBell.tsx
        ThemeSwitcher.tsx
        SharePortalButton.tsx
      feedback/
        EmptyState.tsx
        SkeletonCard.tsx
        SeverityBadge.tsx
    layout/
      AppShell.tsx
      ExecutiveShell.tsx
      ClientPortalShell.tsx
      WorkspaceSidebar.tsx
  features/
    portal/
      components/
      builder/
      view/
      types.ts
    inbox/
      components/
      hooks/
    notifications/
      components/
      hooks/
    media/
      components/
      hooks/
  pages/
    ExecutiveOverview.tsx
    ClientPortalBuilder.tsx
    ClientPortalView.tsx
    Inbox.tsx
    NotificationsCenter.tsx
    ThemeStudio.tsx
```

---

## 3. Layouts principales

### A. AppShell
Uso general para la aplicación interna.

Incluye:
- sidebar persistente
- top context bar
- quick actions
- theme toggle
- notification bell
- inbox shortcut

### B. ExecutiveShell
Variante enfocada en storytelling visual y KPIs.

Incluye:
- KPI ribbon superior
- filtros de fecha / proyecto / organización
- grid responsive premium para charts y milestones

### C. ClientPortalShell
Variante limpia, compartible y branded.

Incluye:
- hero summary
- logo cliente/contratista
- widgets configurables
- feed de anuncios
- downloads y media highlights

---

## 4. Componentes clave

### Reusable cards
- `MetricCard`
- `ChartCard`
- `StatusCard`
- `MilestoneCard`
- `TimelineCard`
- `MediaCard`
- `DocumentCard`
- `AlertCard`
- `InboxCard`
- `PortalWidgetCard`

### Navegación contextual
- `TopContextBar`
- `ThemeSwitcher`
- `NotificationsBell`
- `InboxShortcut`
- `SharePortalButton`

### Charts prioritarios
- `ProgressCurveChart`
- `MilestoneTimeline`
- `DonutBreakdown`
- `TrendAreaChart`
- `KpiRibbon`

---

## 5. Rutas nuevas

```txt
/executive-overview
/client-portals
/client-portals/:portalId/builder
/portal/:portalSlug
/inbox
/notifications
/theme-studio
```

### Reglas de acceso
- `/executive-overview` → `superadmin`, `gerente`
- `/client-portals` y builder → `superadmin`, `gerente`
- `/portal/:portalSlug` → cliente externo o acceso por invitación/link seguro
- `/inbox` → interno y externo según audiencia
- `/notifications` → todos los usuarios autenticados según rol

---

## 6. Modelo de theming

### Token strategy
Usar semantic tokens, no colores hardcodeados en cada pantalla.

Archivos:
- `tokens.ts` → nombres semánticos
- `presets.ts` → presets por tema
- `ThemeProvider.tsx` → inyecta variables CSS
- `useTheme.ts` → hook de consumo

### Estado recomendado
```ts
interface ThemeState {
  mode: 'light' | 'dark' | 'auto';
  preset: 'midnight-executive' | 'slate-industrial' | 'arctic-glass' | 'sandstone-pro' | 'contractor-brand';
  accentColor?: string;
  chartPalette?: string[];
  density: 'compact' | 'comfortable' | 'presentation';
  radius: 'sharp' | 'balanced' | 'soft';
}
```

---

## 7. Client Portal Builder

### Builder experience
El contractor configura visualmente qué comparte.

### Secciones del builder
1. Información general del portal
2. Branding y tema
3. Selección de proyectos
4. Selección de widgets
5. Visibilidad de datos
6. Permisos de acceso
7. Publicación y preview

### Widgets configurables
- KPI ribbon
- progress curve
- milestone timeline
- photo gallery
- video highlight
- documents shelf
- safety snapshot
- quality snapshot
- alerts summary
- announcements feed
- inbox/messages
- dossier status

---

## 8. Inbox y notificaciones

### Inbox UX
La bandeja debe funcionar como centro de comunicación contextual, no como correo tradicional.

Vistas:
- all
- unread
- approvals
- milestones
- reports
- client updates
- alerts

### Notifications center UX
Panel lateral o página completa con:
- filtros por categoría
- prioridad
- estado leído/no leído
- vínculo a entidad relacionada

---

## 9. Rollout por fases

### UX-1
- ThemeProvider
- tokens y presets
- card primitives
- AppShell y TopContextBar
- aplicar a `Dashboard.tsx` y `Settings.tsx`

### UX-2
- ExecutiveShell
- `ExecutiveOverview.tsx`
- KPI ribbon
- milestone timeline
- progress curve
- notification bell e inbox shortcut

### UX-3
- `ClientPortalBuilder.tsx`
- `ClientPortalView.tsx`
- `ClientPortalShell.tsx`
- widgets configurables
- branding por portal

### UX-4
- `Inbox.tsx`
- `NotificationsCenter.tsx`
- message/announcement cards
- role-aware notifications

### UX-5
- aplicar el sistema visual a `Documents.tsx`, `Tasks.tsx`, `QaQcWelding.tsx`, `SihoPtw.tsx`, `DossierCompiler.tsx`, `ProjectBrain.tsx`

---

## 10. Backlog técnico sugerido

- [ ] UX-001 — ThemeProvider + semantic tokens
- [ ] UX-002 — Theme presets + ThemeSwitcher
- [ ] UX-003 — Reusable card system
- [ ] UX-004 — AppShell + TopContextBar + sidebar refinement
- [ ] UX-005 — Dashboard redesign sobre `Dashboard.tsx`
- [ ] UX-006 — `ExecutiveOverview.tsx`
- [ ] UX-007 — `ClientPortalBuilder.tsx`
- [ ] UX-008 — `ClientPortalView.tsx`
- [ ] UX-009 — `ClientPortalShell.tsx`
- [ ] UX-010 — `Inbox.tsx`
- [ ] UX-011 — `NotificationsCenter.tsx`
- [ ] UX-012 — `ThemeStudio.tsx`
- [ ] UX-013 — Media widgets and gallery experience
- [ ] UX-014 — Share portal permissions and visibility matrix UI
- [ ] UX-015 — Apply design system to existing modules

---

## 11. Acceptance criteria

- Internal users experience a premium but productive workspace
- Executive users can read project health in one screen
- Contractor admins can configure a branded client portal without code
- Clients can see curated KPIs, reports, media, milestones, and messages
- Theme switching is global and stable
- New UI primitives reduce duplication across pages
