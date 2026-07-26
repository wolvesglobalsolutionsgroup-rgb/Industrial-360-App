# MASTERPLAN — Industrial Control 360
## Guía de Ejecución para Google AI Studio / Agentes de IA

> **INSTRUCCIÓN PARA EL AGENTE:** Este archivo es tu contexto completo de trabajo.
> Lee todo antes de escribir una sola línea de código.
> Ejecuta las fases en orden estricto. No saltes a Fase 2 si Fase 0 no está completa.

---

## CONTEXTO DEL PROYECTO

**Nombre:** Industrial Control 360
**Tipo:** Enterprise Operating System para la industria Oil & Gas
**Stack:** React 19 + TypeScript + Vite 6 + Tailwind v4 + Firebase (Auth + Firestore) + Gemini AI
**Estado actual:** Prototipo funcional con UI completa (~10,600 líneas, 30 pantallas) pero con motores de datos simulados (mock data) en la mayoría de módulos.
**Meta:** Transformar el prototipo en plataforma de producción multi-tenant, segura y enterprise.

---

## INVENTARIO DE ARCHIVOS CLAVE

```
Raíz:
  vite.config.ts          ← PROBLEMA CRÍTICO: expone API key de Gemini
  firestore.rules         ← Solo 3 roles, sin multi-tenancy
  firebase-blueprint.json ← Schema plano (sin /organizations/)
  package.json            ← pdf-lib y jsPDF YA están instalados

src/
  App.tsx                 ← Router sin guards de rol
  ProjectContext.tsx      ← Sin currentOrganization ni userRole
  firebase.ts             ← Sin Storage, sin Cloud Functions
  pages/
    Dashboard.tsx         ← KPIs hardcodeados (progressData, budgetData = arrays fijos)
    Documents.tsx         ← Metadata real, pero archivos NO se suben a Storage
    SihoPtw.tsx           ← CRUD Firestore real. Falta: firma SHA-256, PDF export
    QaQcWelding.tsx       ← CRUD real. Falta: correlativo real (usa Math.random), WPQ check
    EngineeringTools.tsx  ← MÓDULO MÁS SÓLIDO. 1621 líneas, fórmulas reales ASME/API
    Valuations.tsx        ← UI funcional. Falta: fórmula ROE real con retenciones
    InteroperabilityEngine.tsx ← 100% simulación (handleSimulateScheduleImport)
    DossierCompiler.tsx   ← 100% maqueta (status: 'Completo' hardcodeado)
    Chatbot.tsx           ← Llama a Gemini DIRECTAMENTE desde el navegador (inseguro)
    Login.tsx             ← Todavía dice "ObraSync" (nombre anterior)
  lib/
    offlineSync.ts        ← YA EXISTE base de offline sync con IndexedDB
  components/
    Layout.tsx            ← Menú lateral sin filtrado por rol
```

---

## FASE 0 — SANEAMIENTO CRÍTICO (Ejecutar PRIMERO)
### Objetivo: Ningún secret expuesto. Base lista para construir.

### TAREA 0.1 — vite.config.ts (CRÍTICO DE SEGURIDAD)
**Problema:** Esta línea hornea la API key en el bundle público:
```ts
define: { 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) }
```
**Acción:** Eliminar esa línea del bloque `define`. Las llamadas a Gemini deben ir a una Cloud Function.

### TAREA 0.2 — Crear functions/src/index.ts (Cloud Functions)
Crear el directorio `functions/` con el proxy seguro de Gemini:
```ts
// functions/src/index.ts
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const geminiKey = defineSecret('GEMINI_API_KEY');

// Proxy seguro — la key nunca sale del servidor
export const callGemini = onCall(
  { secrets: [geminiKey], cors: true },
  async (request) => {
    const { prompt, projectId } = request.data;
    const genAI = new GoogleGenerativeAI(geminiKey.value());
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    return { text: result.response.text() };
  }
);

// Expirar PTS vencidos automáticamente cada 60 minutos
export const expirePermits = onSchedule('every 60 minutes', async () => {
  const db = getFirestore();
  const now = Timestamp.now();
  const snapshot = await db.collectionGroup('siho_ptw')
    .where('status', '==', 'aprobado')
    .where('validTo', '<', now)
    .get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.update(doc.ref, { status: 'vencido' }));
  await batch.commit();
  console.log(`Expired ${snapshot.size} permits`);
});
```

### TAREA 0.3 — src/firebase.ts
Agregar Storage a las exportaciones:
```ts
import { getStorage } from 'firebase/storage';
export const storage = getStorage(app);
```

### TAREA 0.4 — Login.tsx
Buscar y reemplazar todas las ocurrencias de "ObraSync" → "Industrial Control 360".

### TAREA 0.5 — functions/package.json
```json
{
  "name": "industrial-control-360-functions",
  "engines": { "node": "20" },
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "@google/generative-ai": "^0.21.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

---

## FASE 1 — MULTI-TENANCY Y ROLES
### Objetivo: 2 empresas distintas no ven los datos de la otra.

### SCHEMA DE FIRESTORE (Implementar exactamente así)
```
/organizations/{orgId}
  name: string
  rif: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: Timestamp
  brandKit: {
    logoUrl: string
    primaryColor: string
    secondaryColor: string
    signatureUrl: string
    legalName: string
    address: string
  }
  /projects/{projId}
    name, description, status, startDate, endDate, budget, contractType
    /tasks/{taskId}
    /siho_ptw/{ptsId}
    /weld_joints/{jointId}
    /documents/{docId}
    /valuations/{valId}
    /expenses/{expId}
    /inventory/{itemId}
    /fleet/{vehicleId}
    /ili_anomalies/{anomId}
    /engineering_calcs/{calcId}
  /users/{userId}
    email, displayName, role, assignedProjects: string[], createdAt
  /invitations/{inviteId}
    email, role, projectId, expiresAt, acceptedAt
```

### TAREA 1.1 — src/ProjectContext.tsx
Reemplazar el contexto actual con:
```ts
export type UserRole = 'superadmin' | 'gerente' | 'supervisor' | 'inspector' | 'campo' | 'cliente_readonly';

export interface Organization {
  id: string;
  name: string;
  rif: string;
  brandKit: BrandKit;
}

interface AppContextType {
  currentOrganization: Organization | null;
  currentProject: Project | null;
  userRole: UserRole | null;
  viewMode: 'single_project' | 'corporate_portfolio';
  setCurrentProject: (project: Project | null) => void;
  setViewMode: (mode: 'single_project' | 'corporate_portfolio') => void;
}
```

### TAREA 1.2 — src/App.tsx
Agregar componente `ProtectedRoute`:
```ts
const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles: UserRole[] }) => {
  const { userRole } = useProjectContext();
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
};

// Aplicar en las rutas:
<Route path="/valuations" element={
  <ProtectedRoute allowedRoles={['superadmin', 'gerente']}>
    <Valuations />
  </ProtectedRoute>
} />
```

### TAREA 1.3 — firestore.rules
Reemplazar las reglas actuales con el modelo multi-tenant:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData(orgId) {
      return get(/databases/$(database)/documents/organizations/$(orgId)/users/$(request.auth.uid)).data;
    }

    function hasRole(orgId, roles) {
      return isAuthenticated() && getUserData(orgId).role in roles;
    }

    // Organización: solo miembros pueden leer
    match /organizations/{orgId} {
      allow read: if hasRole(orgId, ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo', 'cliente_readonly']);
      allow write: if hasRole(orgId, ['superadmin']);

      // Proyectos
      match /projects/{projId} {
        allow read: if hasRole(orgId, ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo', 'cliente_readonly']);
        allow write: if hasRole(orgId, ['superadmin', 'gerente', 'supervisor']);

        // Valuaciones y costos: SOLO gerente y superadmin
        match /valuations/{valId} {
          allow read, write: if hasRole(orgId, ['superadmin', 'gerente']);
        }
        match /expenses/{expId} {
          allow read, write: if hasRole(orgId, ['superadmin', 'gerente']);
        }

        // SIHO/PTW: supervisor, inspector, campo
        match /siho_ptw/{ptsId} {
          allow read: if hasRole(orgId, ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo']);
          allow write: if hasRole(orgId, ['superadmin', 'gerente', 'supervisor']);
        }

        // QA/QC: supervisor, inspector
        match /weld_joints/{jointId} {
          allow read: if hasRole(orgId, ['superadmin', 'gerente', 'supervisor', 'inspector']);
          allow write: if hasRole(orgId, ['superadmin', 'gerente', 'supervisor', 'inspector']);
        }

        // Documentos: todos pueden leer, supervisor+ puede escribir
        match /documents/{docId} {
          allow read: if hasRole(orgId, ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo', 'cliente_readonly']);
          allow write: if hasRole(orgId, ['superadmin', 'gerente', 'supervisor']);
        }
      }

      // Gestión de usuarios de la org
      match /users/{userId} {
        allow read: if hasRole(orgId, ['superadmin', 'gerente']);
        allow write: if hasRole(orgId, ['superadmin']);
        allow read: if request.auth.uid == userId; // cada usuario puede leer su propio doc
      }
    }
  }
}
```

---

## FASE 2 — MOTORES REALES DE DATOS
### Objetivo: Cero mock data. Todos los módulos leen/escriben Firebase real.

### TAREA 2.1 — Dashboard.tsx (KPIs Reales)
Reemplazar los arrays hardcodeados `progressData` y `budgetData` con queries reales:
```ts
// Avance físico real
const tasksSnap = await getDocs(collection(db, `organizations/${orgId}/projects/${projId}/tasks`));
const totalWeight = tasksSnap.docs.reduce((sum, d) => sum + (d.data().weight || 1), 0);
const completedWeight = tasksSnap.docs
  .filter(d => d.data().status === 'Completada')
  .reduce((sum, d) => sum + (d.data().weight || 1), 0);
const avanceFisico = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

// Tasa de rechazo de soldadura
const jointsSnap = await getDocs(collection(db, `organizations/${orgId}/projects/${projId}/weld_joints`));
const totalJoints = jointsSnap.size;
const rejectedJoints = jointsSnap.docs.filter(d => d.data().ndtResult === 'Rechazada').length;
const tasaRechazo = totalJoints > 0 ? (rejectedJoints / totalJoints) * 100 : 0;
```

### TAREA 2.2 — Documents.tsx (Firebase Storage Real)
```ts
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

const uploadDocument = async (file: File, orgId: string, projId: string) => {
  const uuid = uuidv4();
  const storagePath = `organizations/${orgId}/projects/${projId}/docs/${uuid}_${file.name}`;
  const storageRef = ref(storage, storagePath);
  
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  uploadTask.on('state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      setUploadProgress(progress); // actualizar progress bar
    },
    (error) => console.error('Upload error:', error),
    async () => {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      // Guardar metadatos en Firestore
      await addDoc(collection(db, `organizations/${orgId}/projects/${projId}/documents`), {
        name: file.name,
        category: selectedCategory,
        storagePath,
        downloadURL,
        size: file.size,
        uploadedBy: auth.currentUser?.uid,
        uploadedAt: serverTimestamp(),
        version: 1
      });
    }
  );
};
```

### TAREA 2.3 — SihoPtw.tsx (Firma SHA-256)
```ts
const generatePtsHash = async (ptsData: PTSRecord): Promise<string> => {
  const canonical = JSON.stringify({
    ptsId: ptsData.id,
    type: ptsData.type,
    participants: ptsData.participants,
    location: ptsData.location,
    validFrom: ptsData.validFrom,
    validTo: ptsData.validTo,
    signedAt: Date.now(),
    signedBy: auth.currentUser?.uid
  });
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Al firmar un PTS:
const hash = await generatePtsHash(ptsRecord);
await updateDoc(ptsRef, { 
  status: 'firmado',
  hash,
  signedAt: serverTimestamp(),
  signedBy: auth.currentUser?.uid 
});
```

### TAREA 2.4 — QaQcWelding.tsx (Correlativo Real)
```ts
// Reemplazar Math.random() con correlativo real
const getNextJointId = async (orgId: string, projId: string, isometrico: string): Promise<string> => {
  const jointsSnap = await getDocs(
    query(
      collection(db, `organizations/${orgId}/projects/${projId}/weld_joints`),
      where('isometrico', '==', isometrico),
      orderBy('createdAt', 'desc'),
      limit(1)
    )
  );
  const lastNumber = jointsSnap.empty ? 0 : (jointsSnap.docs[0].data().sequenceNumber || 0);
  const nextNumber = lastNumber + 1;
  return `${isometrico}-${nextNumber.toString().padStart(3, '0')}`;
};
```

### TAREA 2.5 — Valuations.tsx (Fórmula ROE Real)
```ts
interface ValuationItem {
  description: string;
  unit: string;
  quantity: number;       // metrado
  unitPrice: number;      // precio unitario contractual
  progressPercent: number; // avance parcial %
}

const calculateValuation = (items: ValuationItem[], config: ContractConfig) => {
  const montoBruto = items.reduce((sum, item) => 
    sum + (item.progressPercent / 100) * item.unitPrice * item.quantity, 0
  );
  const deduccionAnticipo = montoBruto * (config.anticipoPercent / 100);
  const retencionFielCumplimiento = montoBruto * 0.10;
  const retencionLaboral = montoBruto * 0.05;
  const montoNeto = montoBruto - deduccionAnticipo - retencionFielCumplimiento - retencionLaboral;
  
  return { montoBruto, deduccionAnticipo, retencionFielCumplimiento, retencionLaboral, montoNeto };
};
```

---

## FASE 3 — DIFERENCIADORES ÚNICOS

### TAREA 3.1 — src/lib/parsers/xerParser.ts (Primavera P6)
```ts
// Parser del formato .xer de Oracle Primavera P6
// El formato .xer es texto delimitado por tabs con secciones %T

export interface P6Activity {
  taskId: string;
  wbsId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  remainingDuration: number;
  percentComplete: number;
  predecessors: string[];
  type: 'Task Dependent' | 'Resource Dependent' | 'Level of Effort' | 'WBS Summary';
}

export function parseXER(content: string): { activities: P6Activity[], projectName: string } {
  const sections: Record<string, { headers: string[], rows: string[][] }> = {};
  let currentSection = '';
  let headers: string[] = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('%T')) {
      currentSection = trimmed.slice(3).trim();
      sections[currentSection] = { headers: [], rows: [] };
    } else if (trimmed.startsWith('%F')) {
      headers = trimmed.slice(3).split('\t').map(h => h.trim());
      if (sections[currentSection]) sections[currentSection].headers = headers;
    } else if (trimmed.startsWith('%R')) {
      const values = trimmed.slice(3).split('\t');
      if (sections[currentSection]) sections[currentSection].rows.push(values);
    }
  }

  const toRow = (section: string, row: string[]) => {
    const hdrs = sections[section]?.headers || [];
    return Object.fromEntries(hdrs.map((h, i) => [h, row[i] ?? '']));
  };

  const projectName = sections['PROJECT']?.rows[0]
    ? toRow('PROJECT', sections['PROJECT'].rows[0])['proj_short_name'] ?? 'Imported Project'
    : 'Imported Project';

  const activities: P6Activity[] = (sections['TASK']?.rows || []).map(row => {
    const r = toRow('TASK', row);
    const preds = (sections['TASKPRED']?.rows || [])
      .filter(pr => toRow('TASKPRED', pr)['task_id'] === r['task_id'])
      .map(pr => toRow('TASKPRED', pr)['pred_task_id']);
    return {
      taskId: r['task_id'],
      wbsId: r['wbs_id'],
      name: r['task_name'],
      startDate: new Date(r['target_start_date'] || r['act_start_date']),
      endDate: new Date(r['target_end_date'] || r['act_end_date']),
      duration: parseFloat(r['target_drtn_hr_cnt'] || '0') / 8,
      remainingDuration: parseFloat(r['remain_drtn_hr_cnt'] || '0') / 8,
      percentComplete: parseFloat(r['phys_complete_pct'] || '0'),
      predecessors: preds,
      type: r['task_type'] as P6Activity['type']
    };
  });

  return { activities, projectName };
}
```

### TAREA 3.2 — DossierCompiler.tsx (Compilación Real)
Reemplazar las 8 secciones hardcodeadas con verificación real de datos en Firestore.
Cada sección debe verificar si hay registros reales antes de marcar `status: 'Completo'`:
```ts
const checkDossierSections = async (orgId: string, projId: string) => {
  const [joints, permits, docs, calcs, valuations] = await Promise.all([
    getDocs(query(collection(db, `organizations/${orgId}/projects/${projId}/weld_joints`), where('ndtResult', '!=', 'Pendiente'))),
    getDocs(query(collection(db, `organizations/${orgId}/projects/${projId}/siho_ptw`), where('status', '==', 'cerrado'))),
    getDocs(collection(db, `organizations/${orgId}/projects/${projId}/documents`)),
    getDocs(collection(db, `organizations/${orgId}/projects/${projId}/engineering_calcs`)),
    getDocs(query(collection(db, `organizations/${orgId}/projects/${projId}/valuations`), where('status', '==', 'aprobada')))
  ]);
  
  return [
    { section: 'Portada y Alcance', count: 1, status: 'Completo' }, // siempre disponible
    { section: 'Registros QA/QC Soldadura', count: joints.size, status: joints.size > 0 ? 'Completo' : 'Pendiente' },
    { section: 'Permisos de Trabajo (PTS)', count: permits.size, status: permits.size > 0 ? 'Completo' : 'Pendiente' },
    { section: 'Documentación Técnica', count: docs.size, status: docs.size > 0 ? 'Completo' : 'Pendiente' },
    { section: 'Cálculos de Ingeniería', count: calcs.size, status: calcs.size > 0 ? 'Completo' : 'Pendiente' },
    { section: 'Valuaciones Aprobadas', count: valuations.size, status: valuations.size > 0 ? 'Completo' : 'Pendiente' },
    { section: 'Índice y Control', count: 1, status: 'Completo' },
    { section: 'Certificado de Inmutabilidad SHA-256', count: 0, status: 'Pendiente' } // se genera al compilar
  ];
};
```

---

## FASE 4 — PWA OFFLINE-FIRST

### NOTA: src/lib/offlineSync.ts YA EXISTE
Revisar el archivo existente antes de reescribir. Extenderlo con:
- Sincronización de `siho_ptw` y `weld_joints` (no solo lo que ya existe)
- UI indicator en Layout.tsx del estado online/offline

### TAREA 4.1 — vite.config.ts (agregar PWA)
```ts
import { VitePWA } from 'vite-plugin-pwa';

// Agregar al array plugins:
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Industrial Control 360',
    short_name: 'IC360',
    theme_color: '#0F172A',
    background_color: '#0F172A',
    display: 'standalone',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/firestore\.googleapis\.com/,
        handler: 'NetworkFirst',
        options: { cacheName: 'firestore-cache', networkTimeoutSeconds: 3 }
      },
      {
        urlPattern: /^https:\/\/storage\.googleapis\.com/,
        handler: 'CacheFirst',
        options: { cacheName: 'storage-cache', expiration: { maxEntries: 100 } }
      }
    ]
  }
})
```

---

## REGLAS DE TRABAJO PARA EL AGENTE

1. **Nunca borrar funcionalidad existente** — solo extender y mejorar
2. **Engineering Tools es el módulo más sólido** — no tocarlo sin razón justificada
3. **offlineSync.ts ya existe** — revisarlo antes de reescribirlo
4. **pdf-lib y jsPDF ya están en package.json** — importarlos directamente
5. **Ejecutar en orden:** Fase 0 → 1 → 2 → 3 → 4. No saltarse fases.
6. **TypeScript estricto** — no usar `any`, tipar todo correctamente
7. **Paths de Firestore** — SIEMPRE usar la jerarquía multi-tenant: `organizations/{orgId}/projects/{projId}/...`
8. **Gemini** — NUNCA llamar directamente desde el navegador. SIEMPRE via Cloud Function proxy.

---

## VERIFICACIÓN DE CADA FASE (Tests Manuales)

### Fase 0 ✓
- [ ] `grep -r 'GEMINI_API_KEY' vite.config.ts` → no debe encontrar nada en el bloque `define`
- [ ] `Login.tsx` muestra "Industrial Control 360", no "ObraSync"
- [ ] `src/firebase.ts` exporta `storage`

### Fase 1 ✓
- [ ] Crear usuario empresa A y empresa B → sus proyectos NO se ven entre sí
- [ ] Usuario con rol `inspector` → al ir a `/valuations` redirige a `/unauthorized`
- [ ] Firestore emulator: reglas de seguridad pasan para los 6 roles

### Fase 2 ✓
- [ ] Subir PDF en Documents → URL de Firebase Storage abre el archivo
- [ ] Dashboard KPIs cambian al agregar una tarea completada
- [ ] Firmar PTS → campo `hash` en Firestore contiene string SHA-256 de 64 chars
- [ ] Calcular valuación → `montoNeto = montoBruto × (1 - 0.10 - 0.05 - anticipo%)`

### Fase 3 ✓
- [ ] Cargar archivo `.xer` real → actividades aparecen en lista
- [ ] Dossier Compiler → secciones muestran conteo real de registros de Firestore
- [ ] Project Brain: "¿cuántas juntas rechazadas?" → responde con número real

### Fase 4 ✓
- [ ] Chrome móvil: botón "Instalar" aparece en el navegador
- [ ] Desconectar WiFi → crear PTS → reconectar → PTS aparece en Firestore

---

*Generado: 2026-07-25 | Industrial Control 360 v1.0 Roadmap*
*Repositorio: https://github.com/wolvesglobalsolutionsgroup-rgb/Industrial-360-App*
