import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  X, 
  Search, 
  LayoutDashboard, 
  HardHat, 
  ClipboardList, 
  FileText, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  Users, 
  PieChart, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Activity, 
  Truck, 
  AlertTriangle, 
  Package, 
  FileArchive, 
  BookOpen, 
  Wrench, 
  Box, 
  Cpu, 
  BrainCircuit, 
  Sparkles, 
  MessageSquare, 
  Mic, 
  Globe, 
  Settings,
  ChevronRight,
  Grid3x3,
  Layers
} from 'lucide-react';

export interface ModulePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ModuleItem {
  id: string;
  path: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  badgeColor?: 'brand' | 'emerald' | 'amber' | 'blue' | 'rose';
}

export interface ModuleCategory {
  id: string;
  title: string;
  description: string;
  colorAccent: string;
  modules: ModuleItem[];
}

export const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    id: 'operacion',
    title: 'Operación & Obra',
    description: 'Control de ejecución, estimaciones, presupuesto y logística de campo',
    colorAccent: 'border-blue-500 text-blue-500 bg-blue-500/10',
    modules: [
      { id: 'dashboard', path: '/', title: 'Dashboard Ejecutivo', description: 'Vista consolidada KPIs, curva S y avances', icon: LayoutDashboard },
      { id: 'projects', path: '/projects', title: 'Proyectos & Obras', description: 'Gestión del portafolio contractual y frentes', icon: HardHat },
      { id: 'tasks', path: '/tasks', title: 'Control Partidas WBS', description: 'Tablero Kanban industrial e importador P6/BC3', icon: ClipboardList, badge: 'P6/BC3', badgeColor: 'brand' },
      { id: 'field-reports', path: '/field-reports', title: 'Reportes de Campo', description: 'Partes diarios de obra, fotos y minutas', icon: FileText },
      { id: 'valuations', path: '/valuations', title: 'Valuaciones ROE', description: 'Certificados de obra, avance financiero y cobros', icon: Receipt },
      { id: 'expenses', path: '/expenses', title: 'Control de Costos', description: 'Registro de gastos, compras y desviación de presupuesto', icon: DollarSign },
      { id: 'progress', path: '/progress-details', title: 'Detalle de Avance', description: 'Curvas de rendimiento por especialidad', icon: TrendingUp },
      { id: 'personnel', path: '/personnel-details', title: 'Personal de Obra', description: 'Control de asistencias, cuadrillas y hh', icon: Users },
      { id: 'budget', path: '/budget-details', title: 'Detalle Presupuestario', description: 'Análisis de partidas y desviaciones', icon: PieChart },
      { id: 'logistics', path: '/logistics', title: 'Mapa Logístico', description: 'Rutas de suministro y localización de insumos', icon: MapPin },
    ]
  },
  {
    id: 'seguridad-calidad',
    title: 'Seguridad & Calidad',
    description: 'Gestión SIHO-A, inspección NDT, flota y aseguramiento de calidad',
    colorAccent: 'border-emerald-500 text-emerald-500 bg-emerald-500/10',
    modules: [
      { id: 'siho-ptw', path: '/siho-ptw', title: 'SIHO-A & Permisos PTW', description: 'Permisos de trabajo, ART y auditorías HSE', icon: ShieldCheck, badge: 'Crítico', badgeColor: 'emerald' },
      { id: 'qa-qc', path: '/qa-qc-welding', title: 'QA/QC & Soldadura', description: 'Control de juntas, gammagrafía y ensayos NDT', icon: CheckCircle2 },
      { id: 'ili-pigging', path: '/modulos/ili-pigging', title: 'Integridad ILI & Pigging', description: 'Pase de diablos, corrosión y registros ILI', icon: Activity },
      { id: 'flota', path: '/modulos/flota', title: 'Flota & Equipos', description: 'Maquinaria pesada, mantenimientos y horizontes', icon: Truck },
      { id: 'standby-moc', path: '/modulos/standby-moc', title: 'Standby & MOC', description: 'Control de tiempos muertos y cambios de obra', icon: AlertTriangle },
      { id: 'inventory', path: '/inventory', title: 'Inventario & Materiales', description: 'Stock en almacén, recepción y despachos', icon: Package },
    ]
  },
  {
    id: 'ingenieria-docs',
    title: 'Ingeniería & Documentos',
    description: 'Cálculos normativos, expediente técnico y modelo BIM',
    colorAccent: 'border-amber-500 text-amber-500 bg-amber-500/10',
    modules: [
      { id: 'documents', path: '/documents', title: 'Gestión Documental', description: 'Biblioteca técnica, planos aprobados e ing.', icon: FileArchive },
      { id: 'dossier', path: '/modulos/cierre', title: 'Cierre & Dossier', description: 'Compilador automático de Libro Blanco y Dossier', icon: BookOpen, badge: 'Auto', badgeColor: 'amber' },
      { id: 'tools', path: '/tools', title: 'Herramientas Ingeniería', description: 'Calculadoras ASME B31.3, B31G y prueba hidro', icon: Wrench },
      { id: 'bim', path: '/bim', title: 'Visor BIM 3D', description: 'Inspección espacial de maquetas tridimensionales', icon: Box },
      { id: 'interoperabilidad', path: '/modulos/interoperabilidad', title: 'Interoperabilidad', description: 'Sincronización con Primavera, SAP y AutoCAD', icon: Cpu },
    ]
  },
  {
    id: 'inteligencia-portal',
    title: 'Inteligencia & Portal',
    description: 'Asistente IA con normativas, analítica y portal para el cliente',
    colorAccent: 'border-brand-500 text-brand-500 bg-brand-500/10',
    modules: [
      { id: 'project-brain', path: '/project-brain', title: 'Cerebro de Proyecto AI', description: 'Consultas normativas y resúmenes con Gemini AI', icon: BrainCircuit, badge: 'AI', badgeColor: 'brand' },
      { id: 'intelligence', path: '/intelligence', title: 'Inteligencia & Analítica', description: 'Modelos predictivos y análisis de riesgos', icon: Sparkles },
      { id: 'chat', path: '/chat', title: 'Chatbot IA de Obra', description: 'Copiloto conversacional para el equipo de campo', icon: MessageSquare },
      { id: 'voice', path: '/voice', title: 'Asistente de Voz', description: 'Dictado de notas y comandos de voz en sitio', icon: Mic },
      { id: 'client-portal', path: '/client-portal-builder', title: 'Portal de Cliente', description: 'Constructor de portales para fiscalización externa', icon: Globe },
      { id: 'settings', path: '/settings', title: 'Configuración', description: 'Ajustes de organización, marca, tema y roles', icon: Settings },
    ]
  }
];

export const ModulePanel: React.FC<ModulePanelProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter categories and modules
  const filteredCategories = MODULE_CATEGORIES.map(category => {
    const matchingModules = category.modules.filter(module => 
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return {
      ...category,
      modules: matchingModules
    };
  }).filter(cat => cat.modules.length > 0);

  const totalCount = MODULE_CATEGORIES.reduce((acc: number, cat) => acc + cat.modules.length, 0);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Panel Content */}
      <div className="relative w-full max-w-2xl bg-surface border-l border-line h-full flex flex-col z-10 shadow-lift overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-line flex flex-col gap-4 bg-surface/90 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl brand-gradient text-white flex items-center justify-center font-bold shadow-brand">
                <Grid3x3 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-ink font-display flex items-center gap-2">
                  Catálogo Completo de Módulos
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
                    {totalCount} Módulos
                  </span>
                </h2>
                <p className="text-xs text-ink-soft">
                  Acceso rápido e integral a todas las funcionalidades de Industrial Control 360
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar módulo por nombre, descripción o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-line rounded-2xl text-xs font-medium text-ink placeholder:text-ink-faint outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Module List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Layers size={36} className="mx-auto text-ink-faint animate-bounce" />
              <p className="text-sm font-bold text-ink">No se encontraron módulos con "{searchTerm}"</p>
              <p className="text-xs text-ink-soft">Prueba buscando por "WBS", "SIHO", "BIM", "Presupuesto", "Cerebro" o "Calidad".</p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="space-y-3">
                {/* Category Header */}
                <div className="flex items-center justify-between pb-2 border-b border-line">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-lg border ${category.colorAccent}`}>
                      {category.title}
                    </span>
                    <span className="text-xs text-ink-faint">({category.modules.length})</span>
                  </div>
                  <span className="text-[11px] text-ink-soft font-medium hidden sm:inline">
                    {category.description}
                  </span>
                </div>

                {/* Module Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {category.modules.map((module) => {
                    const Icon = module.icon;
                    const isActive = location.pathname === module.path;

                    return (
                      <button
                        key={module.id}
                        onClick={() => handleNavigate(module.path)}
                        className={`group p-3 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                          isActive
                            ? 'bg-brand-500/10 border-brand-500 shadow-card'
                            : 'bg-surface-2/60 border-line hover:bg-surface-2 hover:border-brand-500/50 hover:shadow-2xs'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105 ${
                          isActive 
                            ? 'brand-gradient text-white shadow-brand' 
                            : 'bg-surface text-brand-500 border border-line'
                        }`}>
                          <Icon size={18} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-ink truncate group-hover:text-brand-500 transition-colors">
                              {module.title}
                            </span>
                            {module.badge && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 shrink-0">
                                {module.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-ink-soft line-clamp-1 mt-0.5">
                            {module.description}
                          </p>
                        </div>

                        <ChevronRight size={14} className="text-ink-faint group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-surface-2/40 flex items-center justify-between text-xs text-ink-soft">
          <span className="font-mono text-[11px]">Industrial Control 360 v2.4</span>
          <span className="font-medium">Presiona <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-[10px] font-bold">Esc</kbd> para salir</span>
        </div>

      </div>
    </div>
  );
};

export default ModulePanel;
