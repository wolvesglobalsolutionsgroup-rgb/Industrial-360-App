# GitHub Labels para Industrial Control 360

Copia y pega cada comando en la terminal después de autenticarte con `gh auth login`:

```bash
# Fases
gh label create fase-0 --color E11D48 --description "Fase 0: Saneamiento Crítico" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create fase-1 --color F97316 --description "Fase 1: Multi-Tenancy y Roles" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create fase-2 --color EAB308 --description "Fase 2: Motores Reales de Datos" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create fase-3 --color 22C55E --description "Fase 3: Diferenciadores Únicos" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create fase-4 --color 3B82F6 --description "Fase 4: PWA Offline + IA" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create fase-5 --color 8B5CF6 --description "Fase 5: Enterprise Launch" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App

# Prioridad
gh label create bloqueante --color B91C1C --description "Bloquea el progreso de otras tareas" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create seguridad --color DC2626 --description "Issue de seguridad" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App

# Tipo de trabajo
gh label create backend --color 0EA5E9 --description "Cloud Functions / Firestore / Storage" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create frontend --color A855F7 --description "React / TypeScript / UI" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create infra --color 64748B --description "CI/CD / Firebase config / DevOps" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create differentiator --color F59E0B --description "Diferenciador competitivo clave" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App

# Módulos
gh label create "modulo:siho" --color 059669 --description "Módulo SIHO/PTW" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create "modulo:qaqc" --color 0891B2 --description "Módulo QA/QC Soldadura" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create "modulo:dashboard" --color 7C3AED --description "Módulo Dashboard KPIs" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create "modulo:dossier" --color B45309 --description "Módulo Dossier Compiler" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create "modulo:engineering" --color 1D4ED8 --description "Módulo Engineering Tools" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create "modulo:pwa" --color 047857 --description "PWA / Offline / Service Worker" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create "modulo:interop" --color C026D3 --description "Motor de Interoperabilidad" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
gh label create "modulo:rag" --color 0F766E --description "Project Brain / RAG / IA" --repo wolvesglobalsolutionsgroup-rgb/Industrial-360-App
```
