# 🏗️ ARCHITECTURE DECISIONS — Industrial Control 360

## Stack Tecnológico

### Frontend
- **React 19** + TypeScript + Vite 6 + Tailwind v4
- SPA pura (sin SSR requerido en v1.0)
- PWA con `vite-plugin-pwa` + Workbox (Fase 4)

### Backend
- **Firebase Auth** — Autenticación (Google Sign-In + Email)
- **Firestore** — Base de datos principal (reglas de seguridad por rol)
- **Firebase Storage** — Almacenamiento de archivos (documentos, fotos, PDFs)
- **Cloud Functions** — Lógica server-side: proxy Gemini, expiración PTS, notificaciones
- **Firebase Cloud Messaging** — Push notifications (Fase 4)

### IA
- **Gemini 1.5 Pro** via Cloud Functions (NUNCA directamente desde el navegador)
- RAG: contexto de Firestore en primera iteración, embeddings en Fase 6+

### Generación de PDF
- `pdf-lib` — PDFs compuestos (Dossier, PTS firmados)
- `jsPDF` — PDFs simples (reportes rápidos)

## Schema de Firestore (Multi-Tenant)

```
/organizations/{orgId}
  name, rif, plan, createdAt, brandKit: { logoUrl, primaryColor, secondaryColor, signature }
  /projects/{projId}
    name, description, status, startDate, endDate, budget, contractType
    /tasks/{taskId} — wbs, name, startDate, endDate, progress, predecessors[], weight
    /siho_ptw/{ptsId} — type, status, validTo, hash, participants[], atmosfericos, signedBy
    /weld_joints/{jointId} — jointId, isometrico, welderId, wpsRef, ndtType, ndtResult, photos[]
    /documents/{docId} — name, category, storageUrl, downloadUrl, version, uploadedBy
    /valuations/{valId} — period, items[], montoBruto, retenciones, montoNeto, status
    /expenses/{expId} — category, amount, date, description, receipt_url
    /inventory/{itemId} — name, quantity, unit, minStock, location
    /fleet/{vehicleId} — plate, type, lastMaintenance, nextMaintenance, kmHours
    /ili_anomalies/{anomId} — chainage, depth, length, width, b31gResult, priority
    /engineering_calcs/{calcId} — type, inputs, outputs, standard, pdfUrl, createdBy
  /users/{userId}
    email, displayName, role, assignedProjects[], createdAt
  /invitations/{inviteId}
    email, role, projectId, expiresAt, acceptedAt

/system/config — versión del schema, flags de feature flags
```

## Convenciones de Ramas

```
main          → producción, siempre deployable
develop       → integración, staging
phase-0/...   → cambios de Fase 0
phase-1/...   → cambios de Fase 1
feature/...   → features individuales
fix/...       → bugfixes
```

## Convenciones de Commits

Usar Conventional Commits:
```
feat(siho): add SHA-256 signature to PTS
fix(engineering): correct ANSI selector 150# to 2500#
chore(infra): move Gemini calls to Cloud Functions
security: rotate exposed API key
docs: update ROADMAP phase 2 status
```
