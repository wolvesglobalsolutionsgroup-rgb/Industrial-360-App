import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, HardHat, ClipboardList, Package, Receipt, 
  MessageSquare, Mic, Box, LogOut, Calculator, Settings as SettingsIcon,
  CircleDollarSign, Clock, PackageSearch, ShieldCheck, FileArchive, 
  Database, Plug, Network, BrainCircuit, Briefcase, Menu, X, MapPin, ChevronDown, Truck, ArrowLeftRight, Building,
  Wifi, WifiOff, RefreshCw, UserCheck
} from 'lucide-react';
import { auth, logout } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useProject, CORPORATE_PORTFOLIO_PROJECT, UserRole } from '../ProjectContext';
import { ROLE_LABELS } from './ProtectedRoute';
import { getPendingOfflineOperations, flushOfflineQueue } from '../lib/offlineSync';

const coreOperativoItems = [
  { path: '/', label: 'Dashboard Ejecutivo', icon: LayoutDashboard },
  { path: '/projects', label: 'Gestión de Proyectos', icon: HardHat },
  { path: '/tasks', label: 'Control de Partidas', icon: ClipboardList },
  { path: '/field-reports', label: 'Reportes de Campo', icon: ClipboardList },
  { path: '/modulos/flota', label: 'Flota & Equipos Críticos', icon: Truck },
  { path: '/logistics', label: 'Logística y Mapa', icon: MapPin },
  { path: '/documents', label: 'Gestión Documental', icon: FileArchive },
  { path: '/valuations', label: 'Valuaciones ROE', icon: Receipt },
  { path: '/inventory', label: 'Inventario Base', icon: Package },
];

const ingenieriaQaqcItems = [
  { path: '/siho-ptw', label: 'Módulo SIHO-A & PTW', icon: ShieldCheck },
  { path: '/qa-qc-welding', label: 'QA/QC Juntas & NDT', icon: ShieldCheck },
  { path: '/modulos/ili-pigging', label: 'Integridad ILI Pigging', icon: Database },
  { path: '/modulos/interoperabilidad', label: 'Motor Interoperabilidad P6/BC3', icon: ArrowLeftRight },
  { path: '/bim', label: 'Visor BIM 3D', icon: Box },
  { path: '/tools', label: 'Herramientas Ing.', icon: Calculator },
  { path: '/modulos/tiempos', label: 'Mod 2: Tiempos y Recursos', icon: Clock },
  { path: '/modulos/qa-qc', label: 'Mod 4: QA/QC & Riesgos', icon: ShieldCheck },
];

const financieroLegalItems = [
  { path: '/expenses', label: 'Mod 1: Costos y Tesorería', icon: CircleDollarSign },
  { path: '/modulos/procura', label: 'Mod 3: Procura & Salvamento', icon: PackageSearch },
  { path: '/modulos/standby-moc', label: 'Stand-by Claims & MOC', icon: Clock },
  { path: '/modulos/cierre', label: 'Mod 5: Dossier As-Built', icon: FileArchive },
  { path: '/modulos/auditoria', label: 'Mod 6: Auditoría Blockchain', icon: Database },
];

const inteligenciaConectividadItems = [
  { path: '/project-brain', label: 'Cerebro del Proyecto (MCP)', icon: BrainCircuit },
  { path: '/intelligence', label: 'Mod 7: Inteligencia & RAG', icon: BrainCircuit },
  { path: '/chat', label: 'Asistente IA (RAG)', icon: MessageSquare },
  { path: '/voice', label: 'Chat de Voz Live', icon: Mic },
  { path: '/modulos/conectores', label: 'Mod 8: Conectores ERP', icon: Plug },
  { path: '/modulos/escalamiento', label: 'Mod 9: Escalamiento SLA', icon: Network },
  { path: '/modulos/benchmarking', label: 'Mod 10: Benchmarking', icon: BrainCircuit },
  { path: '/modulos/bi-ofertas', label: 'Mod 11: BI y Ofertas', icon: Briefcase },
  { path: '/settings', label: 'Configuración', icon: SettingsIcon },
];

export default function Layout() {
  const [user] = useAuthState(auth);
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { projects, currentProject, setCurrentProject, currentOrganization, userRole, setUserRole } = useProject();
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync offline queue counter and network state
  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    const updateQueue = async () => {
      const pending = await getPendingOfflineOperations();
      setPendingQueueCount(pending.length);
    };

    updateQueue();
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    window.addEventListener('ic360-offline-queue-changed', updateQueue);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      window.removeEventListener('ic360-offline-queue-changed', updateQueue);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await flushOfflineQueue();
    const pending = await getPendingOfflineOperations();
    setPendingQueueCount(pending.length);
    setIsSyncing(false);
  };

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
              <div className="w-8 h-8 bg-amber-500 text-slate-950 font-black rounded-lg flex items-center justify-center shrink-0 shadow-xs">
                SP
              </div>
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold tracking-tight text-gray-900 truncate">{currentOrganization.name}</h1>
                <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest">{currentOrganization.taxId || 'MULTI-TENANT SYSTEM'}</p>
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
            {renderNavGroup('Core Operativo', coreOperativoItems)}
            {renderNavGroup('Ingeniería & QA/QC', ingenieriaQaqcItems)}
            {renderNavGroup('Control Financiero & Legal', financieroLegalItems)}
            {renderNavGroup('Inteligencia & Conectividad', inteligenciaConectividadItems)}
          </nav>

          {user && (
            <div className="p-4 border-t border-gray-200 shrink-0 bg-gray-50/50">
              <div className="flex items-center gap-3 mb-4">
                <img src={user.photoURL || ''} alt="User" className="w-10 h-10 rounded-full border border-gray-200 shrink-0" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
                  <p className="text-xs text-emerald-700 font-semibold truncate">{ROLE_LABELS[userRole] || userRole}</p>
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
          <div className="flex items-center gap-3">
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
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium"
              >
                <HardHat size={15} className="text-emerald-600 shrink-0" />
                <span className="text-gray-700 max-w-[130px] sm:max-w-[200px] truncate font-semibold">
                  {currentProject ? currentProject.name : 'Seleccionar Proyecto'}
                </span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>
              
              {isProjectMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProjectMenuOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-2 max-h-80 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Modo de Selección</div>
                    
                    <button
                      onClick={() => {
                        setCurrentProject(CORPORATE_PORTFOLIO_PROJECT);
                        setIsProjectMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center gap-2 border-b border-gray-100 transition-colors ${
                        currentProject?.id === 'all' 
                          ? 'bg-emerald-50 text-emerald-800' 
                          : 'text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <Building size={16} className="text-emerald-600 shrink-0" />
                      <span className="truncate">🏢 PORTAFOLIO CORPORATIVO (TODOS LOS PROYECTOS)</span>
                    </button>

                    <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Proyectos de la Organización</div>
                    {projects.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-gray-500">No hay proyectos. Crea uno en Gestión de Proyectos.</div>
                    ) : (
                      projects.map(project => (
                        <button
                          key={project.id}
                          onClick={() => {
                            setCurrentProject(project);
                            setIsProjectMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors ${currentProject?.id === project.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-700'}`}
                        >
                          {project.name}
                        </button>
                      ))
                    )}
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <Link 
                        to="/projects" 
                        onClick={() => setIsProjectMenuOpen(false)}
                        className="block px-4 py-2 text-xs text-emerald-600 hover:bg-emerald-50 font-medium"
                      >
                        + Gestionar Proyectos
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Role Selector Badge (Testing / Demo) */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 rounded-lg text-xs font-semibold transition-colors"
                title="Cambiar rol activo de usuario para simulación"
              >
                <UserCheck size={14} className="text-amber-700" />
                <span>Rol: {ROLE_LABELS[userRole] || userRole}</span>
                <ChevronDown size={13} className="text-amber-700" />
              </button>

              {isRoleMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsRoleMenuOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-2">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Simular Rol de Usuario
                    </div>
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((roleKey) => (
                      <button
                        key={roleKey}
                        onClick={() => {
                          setUserRole(roleKey);
                          setIsRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs transition-colors ${
                          userRole === roleKey 
                            ? 'bg-amber-50 text-amber-900 font-bold' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {ROLE_LABELS[roleKey]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Offline / Background Sync Indicator */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isOnline 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
            }`}>
              {isOnline ? (
                <>
                  <Wifi size={13} className="text-emerald-600" />
                  <span className="hidden sm:inline">En Línea</span>
                </>
              ) : (
                <>
                  <WifiOff size={13} className="text-amber-600" />
                  <span>Modo Offline</span>
                </>
              )}
              {pendingQueueCount > 0 && (
                <span className="bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {pendingQueueCount} pend.
                </span>
              )}
            </div>

            {pendingQueueCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                title="Sincronizar datos de campo pendientes"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#0B2239] text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                <span className="hidden md:inline">Sincronizar</span>
              </button>
            )}
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
