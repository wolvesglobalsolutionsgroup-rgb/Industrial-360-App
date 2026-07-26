import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

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
  companyName: 'SEMAX PINO C.A. - OBRAS Y SERVICIOS INDUSTRIALES',
  taxId: 'RIF J-30489210-4',
  address: 'Zona Industrial San Tomé - El Tigre, Edo. Anzoátegui, Venezuela',
  phone: '+58 (283) 235-9000',
  email: 'contacto@semaxpino.com',
  website: 'www.semaxpino.com',
  logoUrl: '',
  primaryColor: '#0B2239',
  secondaryColor: '#F4C400',
  headerText: 'SEMAX PINO C.A. - ENTREGABLE TÉCNICO DE CAMPO',
  footerText: 'DOCUMENTO FISCAL Y TÉCNICO EMITIDO BAJO ESTÁNDARES PDVSA / COVENIN / ASME.',
  digitalSignatureUrl: '',
  authorizedSignerName: 'Ing. Gustavo Pino',
  authorizedSignerTitle: 'Director General de Operaciones'
};

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  ownerId: string;
  advancePercent?: number;
  orgId?: string;
}

export const CORPORATE_PORTFOLIO_PROJECT: Project = {
  id: 'all',
  name: '🏢 PORTAFOLIO CORPORATIVO (CONTRATISTA)',
  description: 'Consolidado ejecutivo, operativo y financiero de todos los proyectos de la organización',
  status: 'Activo',
  ownerId: 'org',
  orgId: 'default_org'
};

export const DEFAULT_ORGANIZATION: Organization = {
  id: 'default_org',
  name: 'CONTRATISTA OPERATIVA C.A.',
  taxId: 'RIF J-00000000-0',
  description: 'Servicios de Ingeniería Industrial, Obras y Proyectos'
};

interface ProjectContextType {
  currentOrganization: Organization;
  setCurrentOrganization: (org: Organization) => void;
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isLoading: boolean;
  brandKit: BrandKit;
  updateBrandKit: (updated: Partial<BrandKit>) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization>(() => {
    const saved = localStorage.getItem('ic360_organization');
    if (saved) {
      try { return JSON.parse(saved); } catch { return DEFAULT_ORGANIZATION; }
    }
    return DEFAULT_ORGANIZATION;
  });

  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('ic360_userRole') as UserRole;
    if (saved && ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo', 'cliente_readonly'].includes(saved)) {
      return saved;
    }
    return 'superadmin';
  });

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

  const handleSetUserRole = (role: UserRole) => {
    setUserRoleState(role);
    localStorage.setItem('ic360_userRole', role);
  };

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

  useEffect(() => {
    // Escuchar proyectos planos y de la organización actual
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
      handleFirestoreError(error, OperationType.GET, 'projects');
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
      setUserRole: handleSetUserRole,
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
