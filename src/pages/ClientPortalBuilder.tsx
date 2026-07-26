import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Building, 
  ExternalLink, 
  Copy, 
  Check, 
  Save, 
  Eye, 
  Trash2, 
  Layout, 
  CheckSquare, 
  Palette, 
  FolderCheck, 
  ShieldCheck, 
  FileText, 
  Image, 
  Layers, 
  Plus, 
  Globe,
  Sparkles
} from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';

export interface ClientPortalConfig {
  id: string;
  name: string;
  clientName: string;
  orgId: string;
  linkedProjectIds: string[];
  branding: {
    logoUrl: string;
    accentColor: string;
    themePreset: 'mineral' | 'petroleum' | 'corporate_clean' | 'high_contrast';
  };
  visibilityMatrix: {
    showKpis: boolean;
    showScurve: boolean;
    showMilestones: boolean;
    showGallery: boolean;
    showSihoPtw: boolean;
    showNdtWeld: boolean;
    showDossier: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ClientPortalBuilder() {
  const { projects, currentOrganization, brandKit } = useProject();
  const orgId = currentOrganization?.id || 'default_org';

  // Saved Portals State
  const [portals, setPortals] = useState<ClientPortalConfig[]>([]);
  const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Portal Form State
  const [portalName, setPortalName] = useState('Portal de Avance - Inspección Técnica');
  const [clientName, setClientName] = useState('Comité de Inspección / Cliente Final');
  const [linkedProjectIds, setLinkedProjectIds] = useState<string[]>([]);
  const [customLogoUrl, setCustomLogoUrl] = useState(brandKit?.logoUrl || '');
  const [accentColor, setAccentColor] = useState('#0B2239');
  const [themePreset, setThemePreset] = useState<'mineral' | 'petroleum' | 'corporate_clean' | 'high_contrast'>('mineral');

  // Visibility Matrix
  const [visibilityMatrix, setVisibilityMatrix] = useState({
    showKpis: true,
    showScurve: true,
    showMilestones: true,
    showGallery: true,
    showSihoPtw: true,
    showNdtWeld: true,
    showDossier: true,
  });

  // Subscribe to organization portals
  useEffect(() => {
    const portalsRef = collection(db, 'organizations', orgId, 'client_portals');
    const q = query(portalsRef);

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientPortalConfig));
      setPortals(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, `organizations/${orgId}/client_portals`));

    return () => unsub();
  }, [orgId]);

  // Set initial project list selection
  useEffect(() => {
    if (projects.length > 0 && linkedProjectIds.length === 0) {
      const validProjects = projects.filter(p => p.id !== 'all');
      if (validProjects.length > 0) {
        setLinkedProjectIds([validProjects[0].id]);
      }
    }
  }, [projects]);

  const toggleProjectSelection = (projId: string) => {
    setLinkedProjectIds(prev => 
      prev.includes(projId) ? prev.filter(id => id !== projId) : [...prev, projId]
    );
  };

  const loadPortalConfig = (portal: ClientPortalConfig) => {
    setSelectedPortalId(portal.id);
    setPortalName(portal.name);
    setClientName(portal.clientName || 'Comité de Inspección');
    setLinkedProjectIds(portal.linkedProjectIds || []);
    setCustomLogoUrl(portal.branding?.logoUrl || '');
    setAccentColor(portal.branding?.accentColor || '#0B2239');
    setThemePreset(portal.branding?.themePreset || 'mineral');
    if (portal.visibilityMatrix) {
      setVisibilityMatrix(portal.visibilityMatrix);
    }
  };

  const resetForm = () => {
    setSelectedPortalId(null);
    setPortalName('Nuevo Portal de Avance Cliente');
    setClientName('Comité de Inspección / Cliente');
    setLinkedProjectIds(projects.filter(p => p.id !== 'all').slice(0, 2).map(p => p.id));
    setCustomLogoUrl(brandKit?.logoUrl || '');
    setAccentColor('#0B2239');
    setThemePreset('mineral');
    setVisibilityMatrix({
      showKpis: true,
      showScurve: true,
      showMilestones: true,
      showGallery: true,
      showSihoPtw: true,
      showNdtWeld: true,
      showDossier: true,
    });
  };

  const handleSavePortal = async () => {
    if (!portalName.trim()) {
      setStatusMessage('Por favor ingresa un nombre para el portal.');
      return;
    }
    if (linkedProjectIds.length === 0) {
      setStatusMessage('Selecciona al menos un proyecto vinculado.');
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const portalId = selectedPortalId || `portal_${Date.now()}`;
    const payload: ClientPortalConfig = {
      id: portalId,
      name: portalName,
      clientName,
      orgId,
      linkedProjectIds,
      branding: {
        logoUrl: customLogoUrl,
        accentColor,
        themePreset,
      },
      visibilityMatrix,
      createdAt: selectedPortalId ? (portals.find(p => p.id === selectedPortalId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Guardar en jerarquía de la organización
      await setDoc(doc(db, 'organizations', orgId, 'client_portals', portalId), payload, { merge: true });
      // Guardar en colección superior para consulta directa pública (/portal/:portalId)
      await setDoc(doc(db, 'client_portals', portalId), payload, { merge: true });

      setSelectedPortalId(portalId);
      setStatusMessage('¡Portal configurado y guardado exitosamente en Firestore!');
    } catch (err) {
      console.error('Error guardando portal cliente:', err);
      setStatusMessage('Error al guardar en Firestore. Verifica permisos de usuario.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePortal = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar esta configuración de portal cliente?')) return;
    try {
      await deleteDoc(doc(db, 'organizations', orgId, 'client_portals', id));
      await deleteDoc(doc(db, 'client_portals', id));
      if (selectedPortalId === id) {
        resetForm();
      }
      setStatusMessage('Portal eliminado.');
    } catch (err) {
      console.error('Error eliminando portal:', err);
    }
  };

  const copyShareLink = (id: string) => {
    const shareUrl = `${window.location.origin}/portal/${id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-[#0B2239] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider">
            <Globe size={16} />
            <span>Client Portal Builder • B2B Executive Sharing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Constructor de Portales Cliente
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Configura un portal seguro, branded e interactivo para compartir avances de obra, curvas S, dossier de calidad y permisos SIHO con auditores e inspectores externos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form & Settings (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Building size={20} className="text-[#0B2239]" />
              <span>1. Datos del Portal y Cliente</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nombre del Portal</label>
                <input 
                  type="text"
                  value={portalName}
                  onChange={(e) => setPortalName(e.target.value)}
                  placeholder="ej. Portal de Avance - Estación de Flujo X"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-[#0B2239]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cliente / Inspectoría de Destino</label>
                <input 
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="ej. Comité de Inspección PDVSA"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-[#0B2239]"
                />
              </div>
            </div>

            {/* Project Links Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Proyectos Vinculados al Portal</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                {projects.filter(p => p.id !== 'all').map((proj) => {
                  const isChecked = linkedProjectIds.includes(proj.id);
                  return (
                    <div 
                      key={proj.id}
                      onClick={() => toggleProjectSelection(proj.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-[#0B2239] bg-slate-900 text-white shadow-sm' 
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-400 bg-white'
                      }`}>
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{proj.name}</p>
                        <p className="text-[10px] opacity-75">{proj.status || 'Activo'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Branding Selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Palette size={20} className="text-[#0B2239]" />
              <span>2. Branding e Identidad Visual</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">URL de Logo Personalizado</label>
                <input 
                  type="text"
                  value={customLogoUrl}
                  onChange={(e) => setCustomLogoUrl(e.target.value)}
                  placeholder="https://servidor.com/logo-cliente.png"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-[#0B2239]"
                />
                <p className="text-[11px] text-gray-400 mt-1">Opcional. Si se omite, usará el BrandKit corporativo.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Color de Acento Primario</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-gray-50"
                  />
                  <input 
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm uppercase font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Preset Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Preset de Tema Independiente</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'mineral', label: 'Mineral Light', bg: 'bg-[#F2F1ED]', text: 'text-gray-900' },
                  { key: 'petroleum', label: 'Petroleum Dark', bg: 'bg-[#0B2239]', text: 'text-white' },
                  { key: 'corporate_clean', label: 'Corporate Clean', bg: 'bg-white', text: 'text-gray-800' },
                  { key: 'high_contrast', label: 'High Contrast', bg: 'bg-slate-950', text: 'text-emerald-400' },
                ].map((preset) => {
                  const isSel = themePreset === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setThemePreset(preset.key as any)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        preset.bg
                      } ${preset.text} ${
                        isSel ? 'ring-2 ring-[#0B2239] border-black shadow-md scale-[1.02]' : 'border-gray-200 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Visibility Matrix */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <CheckSquare size={20} className="text-[#0B2239]" />
              <span>3. Matriz de Visibilidad para Cliente Final</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { key: 'showKpis', label: 'KPIs de Progreso y Financieros', icon: Layout, desc: 'Porcentaje físico y montos ejecutados' },
                { key: 'showScurve', label: 'Curva S de Avance Físico', icon: Layers, desc: 'Gráfica de avance planificado vs real' },
                { key: 'showMilestones', label: 'Hitos y Cronograma WBS', icon: FolderCheck, desc: 'Fechas de entrega y estatus de tareas' },
                { key: 'showGallery', label: 'Galería de Fotos/Videos Campo', icon: Image, desc: 'Evidencia fotográfica documentada' },
                { key: 'showSihoPtw', label: 'Módulo SIHO PTS (Permisos)', icon: ShieldCheck, desc: 'Permisos de trabajo seguro y HSE' },
                { key: 'showNdtWeld', label: 'Juntas y Soldaduras NDT', icon: Sparkles, desc: 'Ensayos no destructivos y trazabilidad' },
                { key: 'showDossier', label: 'Descarga Dossier de Calidad', icon: FileText, desc: 'Planos As-Built y certificados PDF' },
              ].map((item) => {
                const IconComponent = item.icon;
                const enabled = (visibilityMatrix as any)[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => setVisibilityMatrix(prev => ({ ...prev, [item.key]: !enabled }))}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      enabled 
                        ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-sm' 
                        : 'bg-gray-50 border-gray-200 text-gray-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg ${enabled ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      <IconComponent size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold leading-snug">{item.label}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${enabled ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'}`}>
                      {enabled && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <button
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
            >
              Limpiar / Nuevo Portal
            </button>

            <button
              onClick={handleSavePortal}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#0B2239] text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
            >
              <Save size={16} />
              <span>{isSaving ? 'Guardando...' : (selectedPortalId ? 'Actualizar Portal' : 'Guardar Portal Cliente')}</span>
            </button>
          </div>

          {statusMessage && (
            <p className="text-xs font-bold p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
              {statusMessage}
            </p>
          )}
        </div>

        {/* Right Column: Existing Portals List & Link Sharing */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Globe size={18} className="text-[#0B2239]" />
                <span>Portales Configurados</span>
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                {portals.length}
              </span>
            </div>

            {portals.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center italic">
                Aún no has configurado portales para esta organización.
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {portals.map((p) => {
                  const isSel = selectedPortalId === p.id;
                  return (
                    <div 
                      key={p.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isSel ? 'border-[#0B2239] bg-slate-900 text-white shadow-md' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold">{p.name}</p>
                          <p className={`text-[10px] mt-0.5 ${isSel ? 'text-slate-300' : 'text-gray-500'}`}>
                            {p.clientName} • {p.linkedProjectIds?.length || 0} Proyectos
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeletePortal(p.id)}
                          className={`p-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors ${
                            isSel ? 'text-slate-400' : 'text-gray-400'
                          }`}
                          title="Eliminar portal"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100/20">
                        <button
                          onClick={() => loadPortalConfig(p)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold border transition-colors ${
                            isSel 
                              ? 'bg-white text-slate-900 border-white hover:bg-slate-100' 
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          Cargar / Editar
                        </button>

                        <button
                          onClick={() => copyShareLink(p.id)}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                        >
                          {copiedId === p.id ? <Check size={12} /> : <Copy size={12} />}
                          <span>Enlace</span>
                        </button>

                        <a
                          href={`/portal/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors ${
                            isSel 
                              ? 'border-slate-700 text-amber-400 hover:bg-slate-800' 
                              : 'border-gray-200 text-[#0B2239] hover:bg-gray-50'
                          }`}
                          title="Abrir Vista Previa Cliente"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
