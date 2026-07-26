# UX/UI Reference — Industrial Control 360 Client Portal & Theming

## Objective
Extract the essence of the reference UI and adapt it to Industrial Control 360 as a premium industrial, executive, and client-facing experience. This document defines the design language, theming system, portal-sharing model, and module mapping for implementation.

---

## 1. Essence of the Reference UI

The reference UI is not valuable because it is "finance" themed; it is valuable because it combines:

- A **premium executive dashboard aesthetic**
- Strong use of **modular cards** with hierarchy
- **Dense information** presented in a calm, readable way
- A **themeable visual system** that works in dark, light, and soft modes
- Clear separation between **summary KPIs**, **charts**, **filters**, and **detail drill-downs**
- A "client-ready" look that feels safe to present in meetings

### Core visual principles to preserve
- Rounded cards with subtle depth
- Strong chart presence as primary storytelling layer
- High contrast KPI blocks
- Compact top navigation for context switching
- Calm spacing, not cluttered despite high density
- Theme switching that changes the full emotional tone without changing layout logic

### Core principles to adapt for Industrial Control 360
Instead of finance widgets, the platform should present:
- project progress,
- safety permits,
- welding quality,
- dossier status,
- engineering outputs,
- costs/valuations,
- milestones,
- alerts,
- media evidence,
- client communications.

---

## 2. Design Direction for IC360

### Positioning
Industrial Control 360 should look like:
- **Executive-grade for contractors and operators**
- **Operationally serious for field and QA/QC users**
- **Elegant and presentation-ready for PDVSA / client stakeholders**

### Experience model
The app should have **3 visual modes of experience**:

1. **Operations Workspace**
   - Dense, productive, task-oriented
   - For contractor internal teams
   - Used for SIHO/PTW, QA/QC, reports, logistics, engineering tools

2. **Executive Control Center**
   - KPI-driven, clean, strategic
   - For gerencia, project managers, directors
   - Used for portfolio dashboards, risk, progress, costs, alerts

3. **Client Experience Portal**
   - Beautiful, curated, trust-building
   - For external clients such as PDVSA or owner representatives
   - Used to share selected KPIs, reports, milestones, evidence, videos, and documents

---

## 3. Theming System

### Requirement
Users must be able to switch themes from Settings with a theme selector. Contractor admins should also be able to define a **client portal theme** independently.

### Theme architecture
Create a token-based theme system using CSS variables or Tailwind semantic tokens.

#### Semantic token groups
- `--bg-app`
- `--bg-surface`
- `--bg-card`
- `--bg-elevated`
- `--text-primary`
- `--text-secondary`
- `--text-muted`
- `--border-soft`
- `--border-strong`
- `--accent-primary`
- `--accent-secondary`
- `--accent-success`
- `--accent-warning`
- `--accent-danger`
- `--chart-1` to `--chart-6`
- `--shadow-soft`
- `--shadow-card`
- `--radius-card`

### Recommended built-in themes
1. **Midnight Executive** — dark navy / cyan / electric blue
2. **Slate Industrial** — graphite / steel / teal
3. **Arctic Glass** — soft light / ice blue / silver
4. **Sandstone Pro** — warm neutral / bronze / slate
5. **Contractor Brand Mode** — generated from organization brand settings

### Theme customization controls
Inside `Settings.tsx`, add:
- Theme preset selector
- Dark / light / auto mode
- Accent color picker
- Chart palette selector
- Client portal theme override
- Card density: compact / comfortable / presentation
- Border radius: sharp / balanced / soft

---

## 4. Layout Language

### Global shell
Adopt a premium dashboard shell:
- Left sidebar for modules and workspace switching
- Top context bar with:
  - current organization
  - current project
  - date range
  - filters
  - theme toggle
  - notifications
  - inbox
  - share portal button

### Card system
All high-value views should be composed from reusable cards:
- `MetricCard`
- `ChartCard`
- `StatusCard`
- `TimelineCard`
- `MilestoneCard`
- `DocumentCard`
- `MediaCard`
- `AlertCard`
- `InboxCard`
- `ClientPortalCard`

### Card behavior
Cards should support:
- title
- subtitle
- filters
- drill-down action
- fullscreen action
- export action
- share to portal action

---

## 5. Dashboard Strategy

### Internal dashboard (contractor side)
The internal dashboard should be restructured into sections:

#### A. Executive KPI row
- Physical progress %
- Financial progress %
- SPI / CPI
- Active permits
- Weld rejection rate
- Open alerts
- Valuations pending collection

#### B. Progress story row
- S-curve planned vs actual
- Milestones timeline
- Weekly production trend
- Cost burn vs budget

#### C. Risk and operations row
- Safety permit status
- QA/QC welding quality trends
- Critical alerts
- Equipment / fleet availability

#### D. Evidence and reporting row
- Latest field reports
- Latest uploaded documents
- Media gallery highlights
- Dossier readiness %

### Client portal dashboard (external side)
The client-facing portal should be a curated dashboard composed by the contractor user. It should include configurable widgets:
- Executive summary
- Progress KPI cards
- S-curve and milestone charts
- Photos and videos gallery
- Latest reports and dossier documents
- Safety summary
- Quality summary
- Open / closed action items
- Inbox / announcements
- Download center
- Timeline of project events

---

## 6. Shareable Client Portal

### Concept
A contractor should be able to create a branded portal for its client. Example:
- Contractor = Prointeca
- Client of contractor = PDVSA
- Prointeca chooses exactly what PDVSA can see

### Product model
Add a new capability called **Client Portal Builder**.

### Core features
1. Create one or multiple client portals per organization
2. Assign each portal to:
   - a specific client company
   - a specific project
   - or a portfolio of projects
3. Control exactly what is visible:
   - KPIs
   - charts
   - milestones
   - documents
   - images
   - videos
   - reports
   - alerts
   - inbox messages
   - dossier sections
4. Generate share link or invite by email
5. Support branded theme and logo for that portal
6. Support read-only client roles with optional commenting/approval permissions

### Recommended data model
```ts
/organizations/{orgId}/client_portals/{portalId}
  name
  clientCompanyName
  projectIds: string[]
  themePreset
  accentColor
  logoUrl
  layoutConfig
  visibilityRules
  enabledWidgets
  shareMode: 'invite_only' | 'secure_link'
  status: 'draft' | 'published'
  createdBy
  createdAt

/organizations/{orgId}/client_portals/{portalId}/widgets/{widgetId}
/organizations/{orgId}/client_portals/{portalId}/messages/{messageId}
/organizations/{orgId}/client_portals/{portalId}/announcements/{announcementId}
/organizations/{orgId}/client_portals/{portalId}/access_logs/{logId}
```

### Visibility matrix
The contractor must be able to toggle visibility for:
- Progress
- Financial summary
- Detailed costs
- Valuations
- QA/QC data
- SIHO/PTW summary
- Documents
- Dossier
- Media gallery
- Alerts
- Inbox
- Milestones
- Maps
- BIM

This matters because some clients can see progress and KPIs, but not internal contractor cost breakdowns.

---

## 7. Inbox and Notifications

### Inbox
Add a communications layer with:
- announcements
- client updates
- RFIs / replies later if needed
- milestone notifications
- document publication notifications

Use cases:
- "Valuation #05 has been published"
- "PTS package for shutdown window approved"
- "As-built dossier v2 uploaded"
- "Milestone: Hydrotest completed"

### Notification center
Top-right notification bell should support:
- unread count
- categories: alerts, approvals, reports, messages, milestones
- role-aware visibility
- click-through to detail pages

### Inbox data model
```ts
/organizations/{orgId}/inbox/{messageId}
  scope: 'internal' | 'client_portal'
  portalId?
  audienceRoles: string[]
  title
  body
  attachments
  linkedEntityType
  linkedEntityId
  priority
  createdAt
  createdBy
```

---

## 8. Media and Rich Client Reporting

The portal should not be limited to PDFs.

### Shared media types
- Images from field reports
- Progress videos
- Drone overviews
- PDF reports
- Signed permits (if allowed)
- QA/QC evidence photos
- Before/after comparisons
- Embedded charts snapshots

### Recommended widgets
- `HeroProgressWidget`
- `MilestoneTimelineWidget`
- `GalleryWidget`
- `VideoHighlightWidget`
- `DocumentShelfWidget`
- `KpiRibbonWidget`
- `ProgressCurveWidget`
- `QualitySummaryWidget`
- `SafetySnapshotWidget`
- `InboxWidget`

---

## 9. Mapping to Existing IC360 Modules

These repository modules already exist and should be visually elevated, not reinvented:
- `Dashboard.tsx`
- `Documents.tsx`
- `DossierCompiler.tsx`
- `Chatbot.tsx`
- `ProjectBrain.tsx`
- `Tasks.tsx`
- `Valuations.tsx`
- `QaQcWelding.tsx`
- `SihoPtw.tsx`
- `FieldReports.tsx`
- `Settings.tsx`
- `Projects.tsx`
- `IntegrityIli.tsx`
- `EngineeringTools.tsx`
- `VoiceChat.tsx`
- `AlertsDetails.tsx`

### New modules to add
- `ClientPortalBuilder.tsx`
- `ClientPortalView.tsx`
- `Inbox.tsx`
- `NotificationsCenter.tsx`
- `ThemeStudio.tsx`
- `MediaCenter.tsx`
- `ExecutiveOverview.tsx`

---

## 10. UX Rules for Adaptation

### Do
- Use the visual elegance of the reference
- Keep charts central to storytelling
- Build a premium feeling for clients and executives
- Make data curation configurable by the contractor
- Separate internal operational complexity from client-facing simplicity

### Do not
- Copy the finance layout literally
- Overuse neon effects in operational screens
- Expose all internal data by default in client portals
- Mix internal editing UI with client-facing read-only presentation
- Let theming break contrast and readability

---

## 11. Implementation Phases

### Phase UX-1 — Foundations
- Create design tokens
- Create theme provider
- Create reusable card system
- Create new dashboard shell
- Apply to Dashboard and Settings first

### Phase UX-2 — Executive Experience
- Redesign Dashboard
- Add KPI ribbon, S-curve, milestones, alerts, media row
- Add notifications center and inbox entry point

### Phase UX-3 — Client Portal Builder
- Build portal configuration UI
- Widget chooser
- Share permissions and visibility controls
- Portal publish workflow

### Phase UX-4 — Client Portal View
- Branded external dashboard
- Share links / invite flows
- Media, reports, milestones, KPIs, inbox

### Phase UX-5 — Full rollout
- Apply the design system to Documents, Tasks, QA/QC, SIHO/PTW, Dossier, Project Brain, Engineering, and portfolio views

---

## 12. Acceptance Criteria

A successful adaptation means:
- The app feels premium like the reference while remaining industrial and enterprise-focused
- Theme presets and custom theming work consistently across internal and client views
- Contractor users can configure a client-facing portal without code
- External clients can see curated progress, KPIs, reports, images, videos, and messages in a beautiful dashboard
- Notifications and inbox are built into the product, not bolted on later
- The visual system is reusable across current modules instead of becoming one-off redesign work
