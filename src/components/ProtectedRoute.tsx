import React from 'react';
import { useProject, UserRole } from '../ProjectContext';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  moduleName?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Administrador Corporativo',
  gerente: 'Gerente de Proyecto / Operaciones',
  supervisor: 'Supervisor de Campo',
  inspector: 'Inspector QA/QC / SIHO',
  campo: 'Personal Operativo / Técnico',
  cliente_readonly: 'Cliente / Auditor (Lectura)'
};

export default function ProtectedRoute({ children, allowedRoles, moduleName = 'este módulo' }: ProtectedRouteProps) {
  const { userRole, setUserRole } = useProject();

  const isAllowed = allowedRoles.includes(userRole);

  if (!isAllowed) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-6 shadow-sm">
          <ShieldAlert size={32} />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
          Acceso Restringido por Rol de Usuario
        </h2>

        <p className="text-gray-600 max-w-md mb-6 leading-relaxed text-sm">
          Tu rol actual (<strong className="text-gray-800">{ROLE_LABELS[userRole] || userRole}</strong>) no posee permisos de acceso suficientes para visualizar o modificar {moduleName}.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-lg w-full mb-8 text-left">
          <div className="flex items-center gap-2 font-semibold text-slate-800 text-xs uppercase tracking-wider mb-2">
            <Lock size={14} className="text-slate-500" /> Roles Permitidos para {moduleName}:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allowedRoles.map((role) => (
              <span key={role} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs">
                {ROLE_LABELS[role] || role}
              </span>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">¿Entorno de Pruebas / Demo?</span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  Cambiar a: {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft size={16} /> Volver al Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
