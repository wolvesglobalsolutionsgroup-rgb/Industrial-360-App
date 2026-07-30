import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { seedDemoData } from './lib/seedDemoData';
import { useAuthClaims } from './hooks/useAuthClaims';

export type UserRole = 'superadmin' | 'gerente' | 'supervisor' | 'inspector' | 'campo' | 'cliente_readonly';

export type ViewMode = 'single_project' | 'corporate_portfolio';

export interface Organization {
  id: string;
  name: string;
  taxId?: string;
  logoUrl?: string;
  description?: string;
}

export interface BrandKit {
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  headerText: string;
  footerText: string;
  digitalSignatureUrl: string;
  authorizedSignerName: string;
  authorizedSignerTitle: string;
}

const defaultBrandKit: BrandKit = {
  companyName: 'CONTRATISTA OPERATIVA C.A.',
  taxId: 'RIF J-00000000-0',
  address: 'Zona Industrial - Edo. Anzoátegui, Venezuela',
  phone: '+58 (283) 000-0000',
  email: 'contacto@organizacion.com',
  website: 'www.organizacion.com',
  logoUrl: '',
  primaryColor: '#0B2239',
  secondaryColor: '#3CB179',
  headerText: 'REPORTES TÉCNICOS Y ENTREGABLES DE CAMPO',
  footerText: 'DOCUMENTO TÉCNICO EMITIDO BAJO ESTÁNDARES PDVSA / COVENIN / ASME.',
  digitalSignatureUrl: '',
  authorizedSignerName: 'Ing. Gerente de Operaciones',
  authorizedSignerTitle: 'Dirección General de Operaciones'
};

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  ownerId: string;
  advancePercent?: number;
  budget?: number;
  orgId?: string;
}

export const CORPORATE_PORTFOLIO_PROJECT: Project = {
  id: 'all',
  name: '🏢 PORTAFOLIO CORPORATIVO',
  description: 'Consolidado ejecutivo, operativo y financiero de todos los proyectos de la organización',
  status: 'Activo',
  ownerId: 'org',
  orgId: 'default_org'
};

export const FALLBACK_DEMO_PROJECTS: Project[] = [
  {
    id: 'PROJ-CARDON-AMUAY',
    name: 'IPC Reemplazo y Reparación Propanoducto 6" Cardón - Amuay',
    description: 'Obra integrada de reemplazo de tramos y reparación de anomalías ILI (D001, D002, D003) con camisas Tipo B y prueba hidrostática a 2126 PSI MAOP (17.0 km).',
    budget: 1850000,
    advancePercent: 65,
    status: 'en_campo',
    ownerId: 'demo_admin',
    orgId: 'prointeca'
  },
  {
    id: 'PROJ-001',
    name: 'IPC Reemplazo Oleoducto 16" Jusepín - San Mateo',
    description: 'Reemplazo de 12.5 km de tubería API 5L Gr. X52 Sch 40, incluyendo cruces especiales y pruebas hidrostáticas.',
    budget: 1450000,
    advancePercent: 48,
    status: 'en_campo',
    ownerId: 'demo_admin',
    orgId: 'default_org'
  },
  {
    id: 'PROJ-002',
    name: 'Mantenimiento Mayor Tren K-101 Planta Compresora San Joaquín',
    description: 'Overhaul completo de turbocompresor K-101 y cambio de válvulas de recirculación.',
    budget: 820000,
    advancePercent: 22,
    status: 'en_campo',
    ownerId: 'demo_admin',
    orgId: 'default_org'
  },
  {
    id: 'PROJ-003',
    name: 'Adecuación Estación de Flujo Bare-1 Faja Petrolífera del Orinoco',
    description: 'Sustitución de colectores de producción de crudo pesado e instalación de separadores multifásicos.',
    budget: 2100000,
    advancePercent: 85,
    status: 'en_campo',
    ownerId: 'demo_admin',
    orgId: 'default_org'
  }
];

export const DEFAULT_ORGANIZATION: Organization = {
  id: 'default_org',
  name: 'CONTRATISTA OPERATIVA C.A.',
  taxId: 'RIF J-00000000-0',
  description: 'Servicios de Ingeniería, Mantenimiento e Infraestructura Industrial'
};

interface ProjectContextType {
  currentOrganization: Organization;
  setCurrentOrganization: (org: Organization) => void;
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  userRole: UserRole;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isLoading: boolean;
  brandKit: BrandKit;
  updateBrandKit: (updated: Partial<BrandKit>) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { role: claimRole, orgId: claimOrgId } = useAuthClaims();

  const userRole: UserRole = (
    ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo', 'cliente_readonly'].includes(claimRole || '')
      ? (claimRole as UserRole)
      : 'campo'
  );

  const [currentOrganization, setCurrentOrganization] = useState<Organization>(() => {
    const saved = localStorage.getItem('ic360_organization');
    if (saved) {
      try { return JSON.parse(saved); } catch { return DEFAULT_ORGANIZATION; }
    }
    return DEFAULT_ORGANIZATION;
  });

  useEffect(() => {
    if (claimOrgId && claimOrgId !== currentOrganization.id) {
      setCurrentOrganization(prev => ({ ...prev, id: claimOrgId }));
    }
  }, [claimOrgId, currentOrganization.id]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(CORPORATE_PORTFOLIO_PROJECT);
  const [viewMode, setViewModeState] = useState<ViewMode>('corporate_portfolio');
  const [isLoading, setIsLoading] = useState(true);

  const [brandKit, setBrandKitState] = useState<BrandKit>(() => {
    const saved = localStorage.getItem('ic360_brandKit');
    if (saved) {
      try { return { ...defaultBrandKit, ...JSON.parse(saved) }; } catch { return defaultBrandKit; }
    }
    return defaultBrandKit;
  });

  const handleSetOrganization = (org: Organization) => {
    setCurrentOrganization(org);
    localStorage.setItem('ic360_organization', JSON.stringify(org));
  };

  const handleSetViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (mode === 'corporate_portfolio') {
      setCurrentProject(CORPORATE_PORTFOLIO_PROJECT);
      localStorage.setItem('currentProjectId', 'all');
    }
  };

  // Fetch brandKit from Firestore
  useEffect(() => {
    const fetchBrand = async () => {
      try {
        let snap = await getDoc(doc(db, 'organizations', currentOrganization.id));
        if (!snap.exists()) {
          snap = await getDoc(doc(db, 'organizations', 'default'));
        }
        if (snap.exists()) {
          const data = snap.data() as BrandKit;
          const merged = { ...defaultBrandKit, ...data };
          setBrandKitState(merged);
          localStorage.setItem('ic360_brandKit', JSON.stringify(merged));
        }
      } catch (err) {
        console.warn('Using local fallback for brandKit:', err);
      }
    };
    fetchBrand();
  }, [currentOrganization.id]);

  const hasAttemptedSeedRef = useRef(false);

  useEffect(() => {
    // Escuchar proyectos de la organización actual
    const projectsPath = `organizations/${currentOrganization.id}/projects`;
    const q = query(collection(db, projectsPath));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        if (!hasAttemptedSeedRef.current) {
          hasAttemptedSeedRef.current = true;
          seedDemoData(true)
            .then((res) => {
              if (!res.success) {
                console.warn('Seeding unpermitted or failed, using local fallback demo projects');
                setProjects(FALLBACK_DEMO_PROJECTS);
              }
            })
            .catch(() => {
              setProjects(FALLBACK_DEMO_PROJECTS);
            })
            .finally(() => {
              setIsLoading(false);
            });
        } else {
          setProjects(FALLBACK_DEMO_PROJECTS);
          setIsLoading(false);
        }
        return;
      }

      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
      
      const savedProjectId = localStorage.getItem('currentProjectId');
      if (savedProjectId === 'all' || !savedProjectId) {
        setCurrentProject(CORPORATE_PORTFOLIO_PROJECT);
        setViewModeState('corporate_portfolio');
      } else {
        const savedProject = projs.find(p => p.id === savedProjectId);
        if (savedProject) {
          setCurrentProject(savedProject);
          setViewModeState('single_project');
        } else {
          setCurrentProject(CORPORATE_PORTFOLIO_PROJECT);
          setViewModeState('corporate_portfolio');
        }
      }
      setIsLoading(false);
    }, (error) => {
      if (error?.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, 'projects');
      } else {
        console.warn('Firestore permission denied for projects collection. Using local demo fallback.');
        setProjects(FALLBACK_DEMO_PROJECTS);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentOrganization.id]);

  const handleSetCurrentProject = (project: Project | null) => {
    setCurrentProject(project);
    if (project) {
      localStorage.setItem('currentProjectId', project.id);
      if (project.id === 'all') {
        setViewModeState('corporate_portfolio');
      } else {
        setViewModeState('single_project');
      }
    } else {
      localStorage.removeItem('currentProjectId');
      setViewModeState('corporate_portfolio');
    }
  };

  const updateBrandKit = async (updated: Partial<BrandKit>) => {
    const newKit = { ...brandKit, ...updated };
    setBrandKitState(newKit);
    localStorage.setItem('ic360_brandKit', JSON.stringify(newKit));
    try {
      await setDoc(doc(db, 'organizations', currentOrganization.id), newKit, { merge: true });
      await setDoc(doc(db, 'settings', 'brandKit'), newKit, { merge: true });
    } catch (err) {
      console.warn('Could not save brandKit to Firestore:', err);
    }
  };

  return (
    <ProjectContext.Provider value={{
      currentOrganization,
      setCurrentOrganization: handleSetOrganization,
      projects,
      currentProject,
      setCurrentProject: handleSetCurrentProject,
      userRole,
      viewMode,
      setViewMode: handleSetViewMode,
      isLoading,
      brandKit,
      updateBrandKit
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
