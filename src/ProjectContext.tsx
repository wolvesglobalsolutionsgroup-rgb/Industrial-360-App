import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

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
  companyName: 'CONTRATISTA DE OBRAS & SERVICIOS INDUSTRIALES C.A.',
  taxId: 'RIF J-40192837-2',
  address: 'Zona Industrial San Tomé - El Tigre, Edo. Anzoátegui, Venezuela',
  phone: '+58 (283) 235-9000',
  email: 'operaciones@contratista-obra.com',
  website: 'www.contratista-obra.com',
  logoUrl: '',
  primaryColor: '#0B2239',
  secondaryColor: '#3CB179',
  headerText: 'SISTEMA DE CONTROL 360 - ENTREGABLE TÉCNICO MEMBRETADO DE CAMPO',
  footerText: 'DOCUMENTO FISCAL Y TÉCNICO EMITIDO CON REGISTRO DIGITAL SEGÚN NORMAS PDVSA / COVENIN / ASME.',
  digitalSignatureUrl: '',
  authorizedSignerName: 'Ing. Roberto Bermúdez',
  authorizedSignerTitle: 'Gerente General de Operaciones y Proyectos'
};

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  ownerId: string;
  advancePercent?: number;
}

export const CORPORATE_PORTFOLIO_PROJECT: Project = {
  id: 'all',
  name: '🏢 PORTAFOLIO CORPORATIVO (TODOS LOS PROYECTOS)',
  description: 'Consolidado ejecutivo, operativo y financiero de todos los proyectos de la organización',
  status: 'Activo',
  ownerId: 'org'
};

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  isLoading: boolean;
  brandKit: BrandKit;
  updateBrandKit: (updated: Partial<BrandKit>) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(CORPORATE_PORTFOLIO_PROJECT);
  const [isLoading, setIsLoading] = useState(true);
  const [brandKit, setBrandKitState] = useState<BrandKit>(() => {
    const saved = localStorage.getItem('ic360_brandKit');
    if (saved) {
      try { return { ...defaultBrandKit, ...JSON.parse(saved) }; } catch { return defaultBrandKit; }
    }
    return defaultBrandKit;
  });

  // Fetch brandKit from Firestore
  useEffect(() => {
    const fetchBrand = async () => {
      try {
        let snap = await getDoc(doc(db, 'organizations', 'default'));
        if (!snap.exists()) {
          snap = await getDoc(doc(db, 'settings', 'brandKit'));
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
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
      
      // Check saved selection
      const savedProjectId = localStorage.getItem('currentProjectId');
      if (savedProjectId === 'all') {
        setCurrentProject(CORPORATE_PORTFOLIO_PROJECT);
      } else if (savedProjectId) {
        const savedProject = projs.find(p => p.id === savedProjectId);
        if (savedProject) {
          setCurrentProject(savedProject);
        } else {
          setCurrentProject(CORPORATE_PORTFOLIO_PROJECT);
        }
      } else {
        // Default to Corporate Portfolio if not specified
        setCurrentProject(CORPORATE_PORTFOLIO_PROJECT);
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'projects');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSetCurrentProject = (project: Project | null) => {
    setCurrentProject(project);
    if (project) {
      localStorage.setItem('currentProjectId', project.id);
    } else {
      localStorage.removeItem('currentProjectId');
    }
  };

  const updateBrandKit = async (updated: Partial<BrandKit>) => {
    const newKit = { ...brandKit, ...updated };
    setBrandKitState(newKit);
    localStorage.setItem('ic360_brandKit', JSON.stringify(newKit));
    try {
      await setDoc(doc(db, 'settings', 'brandKit'), newKit, { merge: true });
      await setDoc(doc(db, 'organizations', 'default'), newKit, { merge: true });
      await setDoc(doc(db, 'organizations', 'semax_pino'), newKit, { merge: true });
    } catch (err) {
      console.warn('Could not save brandKit to Firestore:', err);
    }
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      setCurrentProject: handleSetCurrentProject,
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
