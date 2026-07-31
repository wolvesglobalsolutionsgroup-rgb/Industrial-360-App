# PLAN DE REMEDIACIÓN Y DEVSECOPS — CONSEJO DE EXPERTOS (CLAUDE + KIMI)
## Industrial Control 360 (Industrial OS)
### Repositorio: `wolvesglobalsolutionsgroup-rgb/Industrial-360-App` — rama `main`

---

## 1. REGLA DE ORO DE SINCRONIZACIÓN Y PROMPT PARA GOOGLE AI STUDIO (GAIS)

```text
⚠️ ATENCIÓN GAIS — REGLA DE ORO DE SINCRONIZACIÓN Y NO-HARDCODING

Antes de leer, crear o modificar cualquier archivo:
1. Ejecuta:
   git fetch origin --prune
   git checkout main
   git pull --ff-only origin main
   git rev-parse --short HEAD
   git status --short

2. Lee obligatoriamente estos archivos antes de implementar:
   - AGENTS.md
   - README.md
   - docs/governance/
   - docs/architecture/

3. REGLA INMUTABLE: Queda estrictamente prohibido escribir, sembrar, usar como fallback o hardcodear estos valores:
   - "semax_pino"
   - "PROJ-001"
   - "PROJ-DEFAULT"
   - "prointeca-demo"
   - "PROJ-CARDON-AMUAY"

4. orgId y projectId deben ser parámetros obligatorios obtenidos desde:
   - useAuthClaims() para orgId autorizado
   - useRequiredProject() (src/hooks/useRequiredProject.ts) para projectId
```

---

## 2. DIAGNÓSTICO EXACTO (CLAUDE & KIMI)

### 2.1 — Fallback silencioso de `projectId`/`orgId` en 6 archivos de producción (Categoría A)

| Archivo | Línea | Código a reemplazar por `useRequiredProject()` |
|---|---|---|
| `src/components/field/RouteDrawer.tsx` | 112-113 | `orgId: orgId \|\| 'prointeca-demo'`, `projectId: projectId \|\| 'proj-main'` |
| `src/pages/HotTapSchemes.tsx` | 78 | `currentProject?.id \|\| 'proj-default'` |
| `src/pages/DossierCompiler.tsx` | 33 | `currentProject?.id \|\| 'proj-default'` |
| `src/pages/EnvironmentalManagement.tsx` | 152 | `currentProject?.id \|\| 'PROJ-001'` |
| `src/pages/Documents.tsx` | 101 | `currentProject?.id \|\| 'PROJ-DEFAULT'` |
| `src/pages/ProcurementInventory.tsx` | 302 | `currentProject?.id \|\| 'PROJ-CARDON-AMUAY'` |

### 2.2 — Supply Chain: Regeneración de Lockfile (`package-lock.json`)

`package.json` ya no requiere `xlsx`, pero `package-lock.json` conserva la entrada residual de `xlsx@^0.18.5`. Se debe ejecutar `npm install` para limpiar el lockfile.

---

## 3. IMPLEMENTACIÓN DEL HOOK ESTRICTO: `src/hooks/useRequiredProject.ts`

```typescript
import { useProject } from '../ProjectContext';

export class MissingProjectContextError extends Error {
  constructor(missing: 'orgId' | 'projectId' | 'both') {
    super(
      missing === 'both'
        ? 'No hay organización ni proyecto activo. Selecciona un proyecto para continuar.'
        : missing === 'orgId'
        ? 'No hay organización activa en la sesión. Verifica tu autenticación.'
        : 'No hay proyecto activo seleccionado. Selecciona un proyecto para continuar.'
    );
    this.name = 'MissingProjectContextError';
  }
}

export interface RequiredProjectContext {
  orgId: string;
  projectId: string;
}

export function useRequiredProject(
  options: { allowAllSentinel?: boolean } = { allowAllSentinel: true }
): RequiredProjectContext {
  const { currentOrganization, currentProject } = useProject();

  const orgId = currentOrganization?.id;
  const projectId = currentProject?.id;

  if (!orgId && !projectId) {
    throw new MissingProjectContextError('both');
  }
  if (!orgId) {
    throw new MissingProjectContextError('orgId');
  }
  if (!projectId) {
    throw new MissingProjectContextError('projectId');
  }
  if (projectId === 'all' && options.allowAllSentinel === false) {
    throw new MissingProjectContextError('projectId');
  }

  return { orgId, projectId };
}
```

---

## 4. WORKFLOW DE CI (GUARDIA ANTI-HARDCODING DE TENANT)

Fichero: `.github/workflows/no-hardcoded-tenant.yml`

```yaml
name: Guardia Anti-Hardcoding de Tenant

on:
  pull_request:
    paths:
      - 'src/**/*.ts'
      - 'src/**/*.tsx'

jobs:
  check-hardcoded-tenant:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Verificar ausencia de fallbacks hardcodeados de tenant
        run: |
          PATTERN="semax_pino|PROJ-001|PROJ-DEFAULT|proj-default|proj-main|prointeca-demo|PROJ-CARDON-AMUAY"
          MATCHES=$(grep -rnE "$PATTERN" src/ --include="*.ts" --include="*.tsx" \
            | grep -v "__tests__" \
            | grep -v "FALLBACK_DEMO_PROJECTS" \
            | grep -v "src/lib/seedDemoData.ts" || true)
          if [ -n "$MATCHES" ]; then
            echo "❌ Fallback hardcodeado de tenant detectado (viola AGENTS.md Sección 1):"
            echo "$MATCHES"
            exit 1
          fi
          echo "✅ Sin fallbacks hardcodeados de tenant en código de producción."
```
