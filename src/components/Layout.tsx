import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, HardHat, ClipboardList, Package, Receipt, 
  MessageSquare, Mic, Box, LogOut, Calculator, Settings as SettingsIcon,
  CircleDollarSign, Clock, PackageSearch, ShieldCheck, FileArchive, 
  Database, BookOpen, Plug, Network, BrainCircuit, Briefcase, Menu, X, MapPin, ChevronDown
} from 'lucide-react';
import { auth, logout } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useProject } from '../ProjectContext';

const coreItems = [
  { path: '/', label: 'Dashboard Ejecutivo', icon: LayoutDashboard },
  { path: '/projects', label: 'Gestión de Proyectos', icon: HardHat },
  { path: '/tasks', label: 'Control de Partidas', icon: ClipboardList },
  { path: '/field-reports', label: 'Reportes de Campo', icon: ClipboardList },
  { path: '/logistics', label: 'Logística y Mapa', icon: MapPin },
  { path: '/documents', label: 'Gestión Documental', icon: FileArchive },
  { path: '/valuations', label: 'Valuaciones', icon: Receipt },
  { path: '/inventory', label: 'Inventario Base', icon: Package },
  { path: '/expenses', label: 'Gastos y OCR', icon: Receipt },
];

const enterpriseModules = [
  { path: '/modulos/costos', label: 'Mod 1: Costos y Tesorería', icon: CircleDollarSign },
  { path: '/modulos/tiempos', label: 'Mod 2: Tiempos y Recursos', icon: Clock },
  { path: '/modulos/procura', label: 'Mod 3: Procura y Logística', icon: PackageSearch },
  { path: '/modulos/qa-qc', label: 'Mod 4: QA/QC y Riesgos', icon: ShieldCheck },
  { path: '/modulos/cierre', label: 'Mod 5: Cierre y Reportes', icon: FileArchive },
  { path: '/modulos/auditoria', label: 'Mod 6: Auditoría Blockchain', icon: Database },
  { path: '/modulos/normativa', label: 'Mod 7: Normativa (RAG)', icon: BookOpen },
  { path: '/modulos/conectores', label: 'Mod 8: Conectores ERP', icon: Plug },
  { path: '/modulos/escalamiento', label: 'Mod 9: Escalamiento SLA', icon: Network },
  { path: '/modulos/benchmarking', label: 'Mod 10: Benchmarking', icon: BrainCircuit },
  { path: '/modulos/bi-ofertas', label: 'Mod 11: BI y Ofertas', icon: Briefcase },
];

const toolItems = [
  { path: '/project-brain', label: 'Cerebro del Proyecto', icon: BrainCircuit },
  { path: '/tools', label: 'Herramientas Ing.', icon: Calculator },
  { path: '/bim', label: 'Visor BIM 3D', icon: Box },
  { path: '/chat', label: 'Asistente IA (RAG)', icon: MessageSquare },
  { path: '/voice', label: 'Chat de Voz (Live)', icon: Mic },
  { path: '/settings', label: 'Configuración', icon: SettingsIcon },
];

export default function Layout() {
  const [user] = useAuthState(auth);
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { projects, currentProject, setCurrentProject } = useProject();
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);

  // Handle window resize to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLinkClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const renderNavGroup = (title: string, items: any[]) => (
    <div className="mb-6">
      <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="space-y-1 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-emerald-600' : 'text-gray-400'} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:relative top-0 left-0 h-full bg-white flex flex-col shadow-xl md:shadow-sm z-30 transition-all duration-300 ease-in-out overflow-hidden ${
          isMobile 
            ? `w-72 border-r border-gray-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `${isSidebarOpen ? 'w-72 border-r border-gray-200' : 'w-0 border-r-0'}`
        }`}
      >
        <div className="w-72 flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                IC
              </div>
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold tracking-tight text-gray-900 truncate">Industrial Control 360</h1>
                <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-widest">Enterprise Edition</p>
              </div>
            </div>
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg shrink-0"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            {renderNavGroup('Core Operativo', coreItems)}
            {renderNavGroup('Módulos Enterprise', enterpriseModules)}
            {renderNavGroup('Herramientas & IA', toolItems)}
          </nav>

          {user && (
            <div className="p-4 border-t border-gray-200 shrink-0 bg-gray-50/50">
              <div className="flex items-center gap-3 mb-4">
                <img src={user.photoURL || ''} alt="User" className="w-10 h-10 rounded-full border border-gray-200 shrink-0" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50/50 relative h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              title={isSidebarOpen ? "Ocultar menú" : "Mostrar menú"}
            >
              <Menu size={20} />
            </button>
            
            {/* Project Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <HardHat size={16} className="text-emerald-600" />
                <span className="text-sm font-medium text-gray-700 max-w-[150px] sm:max-w-[200px] truncate">
                  {currentProject ? currentProject.name : 'Seleccionar Proyecto'}
                </span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
              
              {isProjectMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProjectMenuOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-2 max-h-64 overflow-y-auto">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proyectos Activos</div>
                    {projects.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">No hay proyectos. Crea uno en Gestión de Proyectos.</div>
                    ) : (
                      projects.map(project => (
                        <button
                          key={project.id}
                          onClick={() => {
                            setCurrentProject(project);
                            setIsProjectMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${currentProject?.id === project.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'}`}
                        >
                          {project.name}
                        </button>
                      ))
                    )}
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <Link 
                        to="/projects" 
                        onClick={() => setIsProjectMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 font-medium"
                      >
                        + Gestionar Proyectos
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
