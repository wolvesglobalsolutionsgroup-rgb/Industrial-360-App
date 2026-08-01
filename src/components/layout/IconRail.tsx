import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  HardHat, 
  ClipboardList, 
  BrainCircuit, 
  ShieldCheck, 
  Receipt,
  FileArchive,
  Settings, 
  Grid3x3,
  LogOut 
} from 'lucide-react';
import { logout } from '../../firebase';

export interface IconRailProps {
  onToggleModules?: () => void;
  className?: string;
}

const railItems = [
  { path: '/', label: 'Dashboard Ejecutivo', icon: LayoutDashboard },
  { path: '/projects', label: 'Proyectos & Obras', icon: HardHat },
  { path: '/tasks', label: 'Control de Partidas WBS', icon: ClipboardList },
  { path: '/siho-ptw', label: 'SIHO-A & Permisos PTW', icon: ShieldCheck },
  { path: '/valuations', label: 'Valuaciones ROE', icon: Receipt },
  { path: '/documents', label: 'Gestión Documental', icon: FileArchive },
  { path: '/project-brain', label: 'Cerebro de Proyecto (AI)', icon: BrainCircuit },
];

export const IconRail: React.FC<IconRailProps> = ({ onToggleModules, className = '' }) => {
  return (
    <aside className={`w-[68px] bg-surface border-r border-line flex flex-col justify-between items-center py-4 h-full shrink-0 z-30 transition-all ${className}`}>
      {/* Brand Icon Header */}
      <div className="flex flex-col items-center gap-4">
        <NavLink 
          to="/" 
          className="w-10 h-10 brand-gradient text-white font-black rounded-2xl flex items-center justify-center shadow-brand text-xs hover:scale-105 transition-transform"
          title="Industrial Control 360"
        >
          IC
        </NavLink>
        <div className="w-8 h-px bg-line my-1" />
      </div>

      {/* Centered Navigation Icons */}
      <nav className="flex flex-col items-center gap-2 my-auto py-2">
        {railItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                `group relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'brand-gradient text-white shadow-brand scale-105'
                    : 'text-ink-soft hover:text-ink hover:bg-surface-2'
                }`
              }
            >
              <Icon size={20} className="shrink-0 transition-transform group-hover:scale-110" />
              
              {/* Tooltip on hover */}
              <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-ink text-surface text-[11px] font-bold rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                {item.label}
              </span>
            </NavLink>
          );
        })}

        {/* All Modules Button (Grid3x3) */}
        {onToggleModules && (
          <button
            onClick={onToggleModules}
            title="Ver todos los módulos (31)"
            className="group relative w-11 h-11 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-300 hover:bg-brand-500/10 transition-all cursor-pointer border border-brand-500/30 my-1"
          >
            <Grid3x3 size={20} className="shrink-0 transition-transform group-hover:scale-110" />
            <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-ink text-surface text-[11px] font-bold rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
              Catálogo Módulos (31)
            </span>
          </button>
        )}
      </nav>

      {/* Bottom Actions: Settings & Logout */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-line w-full px-2">
        <NavLink
          to="/settings"
          title="Configuración"
          className={({ isActive }) =>
            `group relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              isActive
                ? 'brand-gradient text-white shadow-brand'
                : 'text-ink-soft hover:text-ink hover:bg-surface-2'
            }`
          }
        >
          <Settings size={20} className="shrink-0 transition-transform group-hover:rotate-45" />
          <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-ink text-surface text-[11px] font-bold rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
            Configuración
          </span>
        </NavLink>

        <button
          onClick={logout}
          title="Cerrar Sesión"
          className="group relative w-11 h-11 rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
        >
          <LogOut size={20} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
          <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-rose-600 text-white text-[11px] font-bold rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
            Cerrar Sesión
          </span>
        </button>
      </div>
    </aside>
  );
};

export default IconRail;
