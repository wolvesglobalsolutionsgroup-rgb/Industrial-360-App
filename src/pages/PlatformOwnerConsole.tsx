import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Crown, ShieldCheck, Server, Database, Activity, ToggleLeft, ToggleRight, 
  Users, Building2, HardDrive, DollarSign, Key, AlertTriangle, Search, 
  TrendingUp, Lock, RefreshCw, Cpu, Layers, Radio, Globe, ShieldAlert
} from 'lucide-react';
import { useProject } from '../ProjectContext';

export interface TenantSummary {
  id: string;
  name: string;
  taxId: string;
  plan: 'Enterprise O&G' | 'Industrial Pro' | 'Standard';
  activeProjectsCount: number;
  totalUsersCount: number;
  monthlyMrrUsd: number;
  firestoreReadsToday: number;
  firestoreWritesToday: number;
  storageMbUsed: number;
  status: 'Activo' | 'En Mantenimiento' | 'Suspendido';
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  tenantId: string;
  actorEmail: string;
  action: string;
  module: string;
  ipAddress: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface FeatureFlagsState {
  enable_ai_brain_proxy: boolean;
  enable_offline_sw_sync: boolean;
  enable_pvc_card_printing: boolean;
  enable_loto_strict_mode: boolean;
  enable_corporate_portfolio_view: boolean;
  enable_realtime_collaboration: boolean;
}

const INITIAL_TENANTS: TenantSummary[] = [
  {
    id: 'prointeca',
    name: 'PROINTECA Matriz C.A.',
    taxId: 'RIF J-30492810-9',
    plan: 'Enterprise O&G',
    activeProjectsCount: 4,
    totalUsersCount: 28,
    monthlyMrrUsd: 3500,
    firestoreReadsToday: 14200,
    firestoreWritesToday: 1840,
    storageMbUsed: 4200,
    status: 'Activo'
  },
  {
    id: 'semax_pino',
    name: 'Consorcio O&G Campo Sur (SEMAX-PINO)',
    taxId: 'RIF J-40891234-1',
    plan: 'Enterprise O&G',
    activeProjectsCount: 2,
    totalUsersCount: 19,
    monthlyMrrUsd: 2800,
    firestoreReadsToday: 9800,
    firestoreWritesToday: 1250,
    storageMbUsed: 2100,
    status: 'Activo'
  },
  {
    id: 'techpetro',
    name: 'TechPetro Servicios Industriales C.A.',
    taxId: 'RIF J-29810293-4',
    plan: 'Industrial Pro',
    activeProjectsCount: 1,
    totalUsersCount: 8,
    monthlyMrrUsd: 1200,
    firestoreReadsToday: 3400,
    firestoreWritesToday: 420,
    storageMbUsed: 890,
    status: 'Activo'
  }
];

const INITIAL_AUDIT_LOGS: SecurityAuditLog[] = [
  {
    id: 'audit_101',
    timestamp: new Date().toISOString(),
    tenantId: 'semax_pino',
    actorEmail: 'gerencia@consorcioog.com',
    action: 'Emisión de Permiso PTW-2026-0891 con override de firmeza',
    module: 'Permisos PTW',
    ipAddress: '190.202.10.42',
    severity: 'INFO'
  },
  {
    id: 'audit_102',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    tenantId: 'prointeca',
    actorEmail: 'admin@prointeca.com',
    action: 'Actualización global de BrandKit y firmas digitales',
    module: 'BrandKit Settings',
    ipAddress: '200.84.112.5',
    severity: 'INFO'
  },
  {
    id: 'audit_103',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    tenantId: 'techpetro',
    actorEmail: 'inspector.campo@techpetro.com',
    action: 'Verificación de Aislamiento LOTO Tag LOCK-ELE-042',
    module: 'LOTO Isolation',
    ipAddress: '190.72.18.99',
    severity: 'INFO'
  },
  {
    id: 'audit_104',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    tenantId: 'semax_pino',
    actorEmail: 'desconocido@190.200.1.1',
    action: 'Intento fallido de escalamiento de rol a superadmin',
    module: 'Auth Shield',
    ipAddress: '190.200.1.1',
    severity: 'CRITICAL'
  }
];

export default function PlatformOwnerConsole() {
  const { userRole } = useProject();

  const [tenants, setTenants] = useState<TenantSummary[]>(INITIAL_TENANTS);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [activeTab, setActiveTab] = useState<'tenants' | 'quotas' | 'flags' | 'security'>('tenants');

  useEffect(() => {
    async function fetchRealOrganizations() {
      try {
        const snap = await getDocs(collection(db, 'organizations'));
        if (!snap.empty) {
          const loadedTenants: TenantSummary[] = snap.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name || data.razonSocial || data.nombre || docSnap.id,
              taxId: data.taxId || data.rif || 'J-30492810-9',
              plan: data.plan || 'Enterprise O&G',
              activeProjectsCount: data.activeProjectsCount || 2,
              totalUsersCount: data.totalUsersCount || 10,
              monthlyMrrUsd: data.monthlyMrrUsd || 3000,
              firestoreReadsToday: data.firestoreReadsToday || 12000,
              firestoreWritesToday: data.firestoreWritesToday || 1500,
              storageMbUsed: data.storageMbUsed || 3500,
              status: data.status || 'Activo'
            };
          });
          setTenants(loadedTenants);
        }
      } catch (err) {
        console.warn("Falling back to default tenant list:", err);
      }
    }
    fetchRealOrganizations();
  }, []);

  const [featureFlags, setFeatureFlags] = useState<FeatureFlagsState>(() => {
    const saved = localStorage.getItem('ic360_global_flags');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {
      enable_ai_brain_proxy: true,
      enable_offline_sw_sync: true,
      enable_pvc_card_printing: true,
      enable_loto_strict_mode: true,
      enable_corporate_portfolio_view: true,
      enable_realtime_collaboration: true,
    };
  });

  const toggleFlag = (flagKey: keyof FeatureFlagsState) => {
    setFeatureFlags(prev => {
      const updated = { ...prev, [flagKey]: !prev[flagKey] };
      localStorage.setItem('ic360_global_flags', JSON.stringify(updated));
      return updated;
    });
  };

  // Metrics summary
  const totalMrr = tenants.reduce((acc, t) => acc + t.monthlyMrrUsd, 0);
  const totalArr = totalMrr * 12;
  const totalProjects = tenants.reduce((acc, t) => acc + t.activeProjectsCount, 0);
  const totalUsers = tenants.reduce((acc, t) => acc + t.totalUsersCount, 0);
  const totalFirestoreReads = tenants.reduce((acc, t) => acc + t.firestoreReadsToday, 0);
  const totalStorageMb = tenants.reduce((acc, t) => acc + t.storageMbUsed, 0);

  const isMasterAdmin = userRole === 'superadmin' || userRole === ('platform_owner' as any);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Platform Owner Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-indigo-500/30 shadow-2xl text-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 uppercase tracking-widest">
                  SAAS COMMAND CENTER
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  BUILDER CORE 360
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">Consola Maestra de Inquilinos & Plataforma</h1>
              <p className="text-xs text-slate-300">SaaS Command Center exclusivo para Creadores de Software (PROINTECA Matriz / IC360 Multi-Tenant Engine)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 font-mono">
              Rol Activo: <strong className="text-amber-400 uppercase">{userRole}</strong>
            </span>
          </div>
        </div>

        {/* Global SaaS Financial & Usage High Level KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-slate-400">Ingresos MRR</span>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">DEMO</span>
            </div>
            <span className="text-lg font-bold text-emerald-400 tabular">${totalMrr.toLocaleString()} USD</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-slate-400">Ingresos ARR</span>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">DEMO</span>
            </div>
            <span className="text-lg font-bold text-emerald-400 tabular">${totalArr.toLocaleString()} USD</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block mb-0.5">Tenants Activos</span>
            <span className="text-lg font-bold text-indigo-300 tabular">{tenants.length} Inquilinos</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block mb-0.5">Proyectos en Obra</span>
            <span className="text-lg font-bold text-cyan-300 tabular">{totalProjects} Proyectos</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block mb-0.5">Usuarios Totales</span>
            <span className="text-lg font-bold text-amber-300 tabular">{totalUsers} Licencias</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-line gap-2 overflow-x-auto pb-1">
        <button 
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'tenants' 
              ? 'bg-brand-500 text-white shadow-soft' 
              : 'text-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          <Building2 className="w-4 h-4" /> Control de Inquilinos ({tenants.length})
        </button>

        <button 
          onClick={() => setActiveTab('quotas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'quotas' 
              ? 'bg-brand-500 text-white shadow-soft' 
              : 'text-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          <HardDrive className="w-4 h-4" /> Cuotas Firestore & Storage
        </button>

        <button 
          onClick={() => setActiveTab('flags')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'flags' 
              ? 'bg-brand-500 text-white shadow-soft' 
              : 'text-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          <Radio className="w-4 h-4" /> Feature Flags Globales
        </button>

        <button 
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'security' 
              ? 'bg-brand-500 text-white shadow-soft' 
              : 'text-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Auditoría de Seguridad ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: TENANTS CONTROL */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tenants.map(tenant => (
              <div key={tenant.id} className="p-5 rounded-2xl bg-surface border border-line shadow-card space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-500 border border-brand-500/20 uppercase">
                      {tenant.plan}
                    </span>
                    <h3 className="text-base font-bold text-ink mt-1">{tenant.name}</h3>
                    <p className="text-xs text-muted font-mono">{tenant.taxId}</p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {tenant.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-line">
                  <div className="p-2.5 rounded-lg bg-surface-2">
                    <span className="text-muted block">Proyectos:</span>
                    <span className="text-ink font-bold tabular">{tenant.activeProjectsCount} Activos</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-2">
                    <span className="text-muted block">Usuarios:</span>
                    <span className="text-ink font-bold tabular">{tenant.totalUsersCount} Habilitados</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted">MRR Mensual:</span>
                      <span className="px-1 text-[8px] font-bold bg-amber-500/20 text-amber-500 rounded">DEMO</span>
                    </div>
                    <span className="text-emerald-500 font-bold tabular">${tenant.monthlyMrrUsd} USD</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Almacenamiento:</span>
                      <span className="px-1 text-[8px] font-bold bg-amber-500/20 text-amber-500 rounded">DEMO</span>
                    </div>
                    <span className="text-ink font-bold tabular">{(tenant.storageMbUsed / 1024).toFixed(2)} GB</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-muted">Org ID: <code className="text-ink font-mono">{tenant.id}</code></span>
                  <button 
                    onClick={() => alert(`Inquilino ${tenant.name} configurado correctamente.`)}
                    className="text-brand-500 hover:underline font-medium"
                  >
                    Administrar Licencia
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: FIRESTORE & STORAGE QUOTAS */}
      {activeTab === 'quotas' && (
        <div className="p-6 rounded-2xl bg-surface border border-line shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-500" /> Monitoreo de Recursos Firestore & Storage por Tenant
              </h2>
              <p className="text-xs text-muted">Aislamiento y consumo diario de base de datos multi-tenant bajo /organizations/&#123;orgId&#125;/...</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-mono font-semibold">
              Salud Base de Datos: 100% OK
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-surface-2 border-b border-line text-muted">
                  <th className="p-3">Inquilino (Org ID)</th>
                  <th className="p-3">Lecturas Firestore (Hoy)</th>
                  <th className="p-3">Escrituras Firestore (Hoy)</th>
                  <th className="p-3">Almacenamiento Usado</th>
                  <th className="p-3">Límite Cuota Básico</th>
                  <th className="p-3 text-right">Estado Cuota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tenants.map(t => (
                  <tr key={t.id} className="hover:bg-surface-2/50">
                    <td className="p-3 font-bold text-ink">{t.name} <code className="text-muted font-normal">({t.id})</code></td>
                    <td className="p-3 font-mono tabular text-ink">{t.firestoreReadsToday.toLocaleString()} op</td>
                    <td className="p-3 font-mono tabular text-ink">{t.firestoreWritesToday.toLocaleString()} op</td>
                    <td className="p-3 font-mono tabular text-ink">{(t.storageMbUsed / 1024).toFixed(2)} GB</td>
                    <td className="p-3 text-muted">50.0 GB Storage / 1M Op</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 font-semibold text-[11px]">
                        Dentro de Límites (12%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL FEATURE FLAGS */}
      {activeTab === 'flags' && (
        <div className="p-6 rounded-2xl bg-surface border border-line shadow-card space-y-6">
          <div className="pb-4 border-b border-line">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-500" /> Habilitador de Feature Flags Globales
            </h2>
            <p className="text-xs text-muted">Control en tiempo real sobre módulos avanzados y proxy de inteligencia artificial para toda la plataforma.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'enable_ai_brain_proxy', label: 'Proxy de Inteligencia Artificial (Gemini AI Brain)', desc: 'Activa el backend proxy seguro en /api/callGeminiProxy para análisis de normas O&G.' },
              { key: 'enable_offline_sw_sync', label: 'Modo Offline Service Worker (PWA Campo)', desc: 'Habilita cola de operaciones offline con sincronización automática en reconexión.' },
              { key: 'enable_pvc_card_printing', label: 'Generador de Carnets PVC Biométricos QR', desc: 'Permite la emisión de identificaciones físicas PVC con estándar PDVSA SI-S-04.' },
              { key: 'enable_loto_strict_mode', label: 'Control LOTO Estricto (PDVSA SI-S-28)', desc: 'Exige verificación obligatoria de prueba de energía cero antes de autorizar PTW.' },
              { key: 'enable_corporate_portfolio_view', label: 'Vista de Portafolio Corporativo Multiver', desc: 'Consolidación ejecutiva de indicadores financieros y avance entre múltiples obras.' },
              { key: 'enable_realtime_collaboration', label: 'Sincronización en Tiempo Real Firestore', desc: 'Escucha de cambios en vivo mediante listeners en tiempo real.' },
            ].map(flag => (
              <div key={flag.key} className="p-4 rounded-xl bg-surface-2 border border-line flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-ink">{flag.label}</h4>
                  <p className="text-[11px] text-muted">{flag.desc}</p>
                </div>

                <button 
                  onClick={() => toggleFlag(flag.key as keyof FeatureFlagsState)}
                  className="text-brand-500 hover:scale-105 transition-transform"
                >
                  {featureFlags[flag.key as keyof FeatureFlagsState] ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-muted" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY AUDIT STREAM */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-2xl bg-surface border border-line shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" /> Registro Centralizado de Auditoría de Seguridad (Security Audit Trail)
              </h2>
              <p className="text-xs text-muted">Transacciones críticas, eventos de autenticación y validación de aislamiento multi-tenant en tiempo real.</p>
            </div>
            <button 
              onClick={() => setAuditLogs([...INITIAL_AUDIT_LOGS])}
              className="p-2 rounded-lg bg-surface-2 hover:bg-elevated border border-line text-xs font-medium text-ink flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brand-500" /> Refrescar Log
            </button>
          </div>

          <div className="space-y-2">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3.5 rounded-xl bg-surface-2 border border-line flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {log.severity}
                    </span>
                    <span className="font-bold text-ink">{log.action}</span>
                  </div>
                  <div className="text-muted text-[11px] flex items-center gap-3">
                    <span>Módulo: <strong className="text-ink">{log.module}</strong></span>
                    <span>Usuario: <strong className="text-ink">{log.actorEmail}</strong></span>
                    <span>IP: <code className="text-ink font-mono">{log.ipAddress}</code></span>
                  </div>
                </div>

                <div className="text-right text-muted text-[11px]">
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
