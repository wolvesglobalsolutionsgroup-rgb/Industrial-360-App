import React, { useState } from 'react';
import { UserRole } from '../ProjectContext';
import { useAuthClaims } from '../hooks/useAuthClaims';
import { ShieldAlert, ArrowLeft, Lock, Loader2, UserCheck, FlaskConical, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, functionsInstance } from '../firebase';

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
  const { role: claimRole, loading, isPendingMembership } = useAuthClaims();
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  const handleProvisionQa = async () => {
    try {
      setIsProvisioning(true);
      setProvisionError(null);

      const provisionFn = httpsCallable<{ targetOrgId: string; role: string; action: string }, any>(
        functionsInstance,
        'provisionFounderQaAccess'
      );

      const res = await provisionFn({
        targetOrgId: 'prointeca-demo',
        role: 'gerente',
        action: 'provision',
      });

      if (res.data?.success) {
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
        }
        window.location.reload();
      } else {
        setProvisionError(res.data?.message || 'Error al provisionar acceso QA.');
      }
    } catch (err: any) {
      setProvisionError(err?.message || 'Error de comunicación con el servidor de autorización.');
    } finally {
      setIsProvisioning(false);
    }
  };

  // 1. Estado de Carga de Auth Claims JWT
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">Verificando credenciales y permisos JWT...</p>
      </div>
    );
  }

  // 2. Estado Pending Membership (Sin rol / orgId en Custom Claims)
  if (isPendingMembership) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-6 shadow-sm">
          <UserCheck size={32} />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
          Asignación de Membresía Pendiente
        </h2>

        <p className="text-gray-600 max-w-md mb-6 leading-relaxed text-sm">
          Tu cuenta está autenticada correctamente, pero aún no tiene asignada una organización ni un rol en las credenciales del sistema (Custom Claims).
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-lg w-full mb-6 text-left text-xs text-slate-600 leading-normal">
          Un <strong>Gerente de Organización</strong> o <strong>Super Administrador</strong> debe otorgar la aprobación correspondiente. Contacta al administrador de tu contrato o proyecto para completar tu registro.
        </div>

        {/* Bloque especial QA / Preview para el Fundador / Evaluadores */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 max-w-lg w-full mb-8 text-left shadow-2xs">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm mb-1.5">
            <FlaskConical size={18} className="text-amber-700" /> Acceso QA / Preview (Datos Sintéticos)
          </div>
          <p className="text-xs text-amber-800 leading-relaxed mb-4">
            Si estás realizando la validación inicial del producto como fundador o evaluador de la plataforma, puedes auto-provisionar una membresía activa en el tenant QA con datos sintéticos.
          </p>

          {provisionError && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{provisionError}</span>
            </div>
          )}

          <button
            onClick={handleProvisionQa}
            disabled={isProvisioning}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isProvisioning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Provisionando Membresía y Emitiendo Custom Claims...</span>
              </>
            ) : (
              <>
                <FlaskConical size={14} />
                <span>Activar Acceso QA / Preview ('prointeca-demo')</span>
              </>
            )}
          </button>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft size={16} /> Ir al Inicio
        </Link>
      </div>
    );
  }

  const userRole = (claimRole as UserRole) || 'campo';
  const isAllowed = allowedRoles.includes(userRole);

  // 3. Estado Denied (Rol real insuficiente)
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
          Tu rol verificado por JWT (<strong className="text-gray-800">{ROLE_LABELS[userRole] || userRole}</strong>) no posee permisos de acceso suficientes para visualizar o modificar {moduleName}.
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

          {Boolean((import.meta as any).env?.DEV) && (
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">Modo Desarrollo Activo</span>
              <span className="text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                JWT Role: {userRole}
              </span>
            </div>
          )}
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
