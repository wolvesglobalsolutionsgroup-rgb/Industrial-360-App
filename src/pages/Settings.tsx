import { useState, useEffect, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { 
  User, Building, Bell, Shield, Save, Loader2, Palette, Upload, Check, Sparkles, Sun, Moon
} from 'lucide-react';
import { auth, db, useAppAuthState } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useProject, BrandKit } from '../ProjectContext';
import { useTheme } from '../theme/ThemeContext';
import { THEME_PRESETS, ThemePresetId } from '../theme/themePresets';

export default function Settings() {
  const [user] = useAppAuthState();
  const { brandKit, updateBrandKit } = useProject();
  const { preset, setPreset, isDarkMode, toggleMode } = useTheme();

  const [activeTab, setActiveTab] = useState('brand');
  const [budgetThreshold, setBudgetThreshold] = useState(90);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [brandSavedSuccess, setBrandSavedSuccess] = useState(false);

  // Local Brand Form State
  const [localBrand, setLocalBrand] = useState<BrandKit>(brandKit);

  const isLightColor = (color?: string) => {
    if (!color || !color.startsWith('#') || color.length < 7) return false;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 160;
  };

  useEffect(() => {
    setLocalBrand(brandKit);
  }, [brandKit]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists() && docSnap.data().budgetThreshold) {
          setBudgetThreshold(docSnap.data().budgetThreshold);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'digitalSignatureUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLocalBrand(prev => ({ ...prev, [field]: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBrandKit = async () => {
    setIsSavingBrand(true);
    setBrandSavedSuccess(false);
    try {
      await updateBrandKit(localBrand);
      setBrandSavedSuccess(true);
      setTimeout(() => setBrandSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving Brand Kit:", err);
      alert('Error al guardar Kit de Marca');
    } finally {
      setIsSavingBrand(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), { budgetThreshold }, { merge: true });
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="mb-4">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">Configuración y Temas de Diseño</h1>
        <p className="text-ink-soft mt-1 text-xs sm:text-sm">Administra el sistema de temas de colores (Theming), identidad visual y datos fiscales de la organización</p>
      </header>
      <div className="h-1 w-20 bg-gradient-to-r from-brand-500 to-brand-accent rounded-full mb-6" />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1 shrink-0">
          {[
            { id: 'brand', label: 'Kit de Marca & Temas', icon: Palette },
            { id: 'company', label: 'Datos de Empresa', icon: Building },
            { id: 'profile', label: 'Perfil de Usuario', icon: User },
            { id: 'notifications', label: 'Alertas y Notificaciones', icon: Bell },
            { id: 'security', label: 'Seguridad', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-brand-500 text-white font-bold border border-brand-500 shadow-xs' 
                    : 'text-ink-soft hover:bg-surface-2 hover:text-ink border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-ink-faint'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          <div className="bg-surface rounded-3xl border border-line shadow-card p-6 md:p-8 space-y-8">
            {activeTab === 'brand' && (
              <div className="space-y-8">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-ink">Temas de Colores & Kit de Marca</h2>
                    <p className="text-xs text-ink-soft mt-1">
                      Selecciona presets de diseño de la plataforma y personaliza el membrete corporativo.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveBrandKit}
                    disabled={isSavingBrand}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    {isSavingBrand ? <Loader2 size={16} className="animate-spin" /> : brandSavedSuccess ? <Check size={16} /> : <Save size={16} />}
                    {brandSavedSuccess ? '¡Guardado!' : 'Guardar Kit de Marca'}
                  </button>
                </div>

                {/* THEME PRESETS SELECTOR */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-ink flex items-center gap-2">
                        <Sparkles size={18} className="text-brand-accent" /> Presets de Diseño y Paleta de Colores
                      </h3>
                      <p className="text-xs text-ink-soft mt-1 font-medium">
                        Elige la paleta visual para toda la plataforma. Los cambios se aplican en tiempo real en la UI.
                      </p>
                    </div>

                    {/* Quick Light/Dark Toggle */}
                    <button
                      onClick={toggleMode}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface border border-line text-ink text-xs font-bold hover:bg-surface-2 transition-all shrink-0 cursor-pointer shadow-xs"
                    >
                      {isDarkMode ? <Sun size={16} className="text-brand-accent" /> : <Moon size={16} className="text-brand-500" />}
                      <span>{isDarkMode ? 'Modo Oscuro Activo' : 'Modo Claro Activo'}</span>
                    </button>
                  </div>

                  {/* Preset Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((pKey) => {
                      const pObj = THEME_PRESETS[pKey];
                      const isSelected = preset === pKey;
                      return (
                        <div
                          key={pKey}
                          onClick={() => setPreset(pKey)}
                          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                            isSelected
                              ? 'border-brand-500 bg-surface shadow-md ring-2 ring-brand-500/20'
                              : 'border-line bg-surface hover:border-brand-500 hover:shadow-md hover:-translate-y-0.5'
                          }`}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-ink">{pObj.name}</span>
                              {isSelected && (
                                <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check size={12} /> Activo
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-ink-soft line-clamp-2 leading-relaxed font-medium">{pObj.description}</p>
                          </div>

                          {/* Swatch preview */}
                          <div className="mt-4 flex items-center justify-between pt-3 border-t border-line">
                            <div className="flex items-center -space-x-1.5">
                              <span className="w-6 h-6 rounded-full border-2 border-surface shadow-md" style={{ backgroundColor: pObj.colors.bgApp }} title="Fondo App"></span>
                              <span className="w-6 h-6 rounded-full border-2 border-surface shadow-md" style={{ backgroundColor: pObj.colors.colorPrimary }} title="Primario"></span>
                              <span className="w-6 h-6 rounded-full border-2 border-surface shadow-md" style={{ backgroundColor: pObj.colors.colorSecondary }} title="Secundario"></span>
                              <span className="w-6 h-6 rounded-full border-2 border-surface shadow-md" style={{ backgroundColor: pObj.colors.colorAccent }} title="Acento"></span>
                            </div>
                            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-surface-2 text-ink-soft border border-line">
                              {pObj.colors.isDark ? 'Oscuro' : 'Claro'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Header Preview */}
                <div className="p-5 rounded-2xl border border-line bg-surface space-y-3 shadow-xs">
                  <span className="text-[10px] font-mono uppercase font-bold text-ink-faint block">Vista Previa de Encabezado Membretado</span>
                  {(() => {
                    const isPrimaryLight = isLightColor(localBrand.primaryColor);
                    const textColor = isPrimaryLight ? 'text-slate-900' : 'text-white';
                    const subtextColor = isPrimaryLight ? 'text-slate-600' : 'text-slate-200/80';
                    const badgeTextColor = isLightColor(localBrand.secondaryColor || '#3CB179') ? 'text-slate-900' : 'text-white';
                    
                    return (
                      <div 
                        className={`p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs transition-colors ${textColor}`}
                        style={{ backgroundColor: localBrand.primaryColor || 'var(--color-brand-500)' }}
                      >
                        <div className="flex items-center gap-3">
                          {localBrand.logoUrl ? (
                            <img src={localBrand.logoUrl} alt="Logo" className="h-10 max-w-[120px] object-contain bg-white/10 p-1 rounded" />
                          ) : (
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${isPrimaryLight ? 'bg-slate-900/10 text-slate-900' : 'bg-white/20 text-white'}`}>
                              {localBrand.companyName ? localBrand.companyName.slice(0, 2).toUpperCase() : 'IC'}
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-sm tracking-wide">{localBrand.companyName || 'NOMBRE DE EMPRESA'}</h3>
                            <p className={`text-[11px] ${subtextColor}`}>{localBrand.taxId} · {localBrand.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span 
                            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${badgeTextColor}`}
                            style={{ backgroundColor: localBrand.secondaryColor || '#3CB179' }}
                          >
                            DOCUMENTO OFICIAL
                          </span>
                          <p className={`text-[10px] mt-1 ${subtextColor}`}>{localBrand.headerText}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Brand Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Nombre Fiscal / Razón Social de la Contratista</label>
                    <input 
                      type="text" 
                      value={localBrand.companyName}
                      onChange={(e) => setLocalBrand({ ...localBrand, companyName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink placeholder:text-ink-faint transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Identificación Tributaria (RIF / NIT / CPT)</label>
                    <input 
                      type="text" 
                      value={localBrand.taxId}
                      onChange={(e) => setLocalBrand({ ...localBrand, taxId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink placeholder:text-ink-faint transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Teléfono de Contacto</label>
                    <input 
                      type="text" 
                      value={localBrand.phone}
                      onChange={(e) => setLocalBrand({ ...localBrand, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink placeholder:text-ink-faint transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Correo Electrónico Corporativo</label>
                    <input 
                      type="email" 
                      value={localBrand.email}
                      onChange={(e) => setLocalBrand({ ...localBrand, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink placeholder:text-ink-faint transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Dirección Fiscal / Sede de Operaciones</label>
                    <input 
                      type="text" 
                      value={localBrand.address}
                      onChange={(e) => setLocalBrand({ ...localBrand, address: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink placeholder:text-ink-faint transition-colors"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div className="p-4 bg-surface-2 rounded-2xl border border-line space-y-3">
                    <label className="block text-xs font-bold text-ink uppercase">Logo Corporativo de la Empresa</label>
                    <div className="flex items-center gap-4">
                      {localBrand.logoUrl ? (
                        <img src={localBrand.logoUrl} alt="Logo preview" className="w-16 h-16 object-contain border border-line p-1 rounded-xl bg-surface" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl border border-dashed border-line flex items-center justify-center text-ink-faint text-xs">
                          Sin Logo
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-surface border border-line rounded-xl text-xs font-bold text-ink hover:bg-surface-2 transition-colors">
                          <Upload size={14} /> Cargar Imagen Logo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                        </label>
                        <input 
                          type="text"
                          placeholder="O pega URL de la imagen..."
                          value={localBrand.logoUrl}
                          onChange={(e) => setLocalBrand({ ...localBrand, logoUrl: e.target.value })}
                          className="w-full px-3 py-1.5 bg-surface border border-line rounded-lg text-xs font-mono outline-none text-ink placeholder:text-ink-faint"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Signature / Stamp Upload */}
                  <div className="p-4 bg-surface-2 rounded-2xl border border-line space-y-3">
                    <label className="block text-xs font-bold text-ink uppercase">Firma Digital & Sello Autorizado</label>
                    <div className="flex items-center gap-4">
                      {localBrand.digitalSignatureUrl ? (
                        <img src={localBrand.digitalSignatureUrl} alt="Firma preview" className="w-16 h-16 object-contain border border-line p-1 rounded-xl bg-surface" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl border border-dashed border-line flex items-center justify-center text-ink-faint text-xs">
                          Sin Sello
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-surface border border-line rounded-xl text-xs font-bold text-ink hover:bg-surface-2 transition-colors">
                          <Upload size={14} /> Cargar Firma / Sello
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'digitalSignatureUrl')} />
                        </label>
                        <input 
                          type="text"
                          placeholder="O pega URL de la firma..."
                          value={localBrand.digitalSignatureUrl}
                          onChange={(e) => setLocalBrand({ ...localBrand, digitalSignatureUrl: e.target.value })}
                          className="w-full px-3 py-1.5 bg-surface border border-line rounded-lg text-xs font-mono outline-none text-ink placeholder:text-ink-faint"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Primary & Secondary Colors */}
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Color Primario Corporativo</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={localBrand.primaryColor}
                        onChange={(e) => setLocalBrand({ ...localBrand, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-line cursor-pointer bg-surface p-1"
                      />
                      <input 
                        type="text" 
                        value={localBrand.primaryColor}
                        onChange={(e) => setLocalBrand({ ...localBrand, primaryColor: e.target.value })}
                        className="flex-1 px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-mono font-bold outline-none text-ink"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Color Secundario / Destacado</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={localBrand.secondaryColor}
                        onChange={(e) => setLocalBrand({ ...localBrand, secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-line cursor-pointer bg-surface p-1"
                      />
                      <input 
                        type="text" 
                        value={localBrand.secondaryColor}
                        onChange={(e) => setLocalBrand({ ...localBrand, secondaryColor: e.target.value })}
                        className="flex-1 px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-mono font-bold outline-none text-ink"
                      />
                    </div>
                  </div>

                  {/* Header & Footer Text */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Texto de Encabezado Membretado</label>
                    <input 
                      type="text" 
                      value={localBrand.headerText}
                      onChange={(e) => setLocalBrand({ ...localBrand, headerText: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink placeholder:text-ink-faint transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Pie de Página Legal / Descargo en Documentos</label>
                    <textarea 
                      rows={2}
                      value={localBrand.footerText}
                      onChange={(e) => setLocalBrand({ ...localBrand, footerText: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink placeholder:text-ink-faint transition-colors"
                    />
                  </div>

                  {/* Authorized Signer */}
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Nombre del Firmante Autorizado</label>
                    <input 
                      type="text" 
                      value={localBrand.authorizedSignerName}
                      onChange={(e) => setLocalBrand({ ...localBrand, authorizedSignerName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink placeholder:text-ink-faint transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Cargo del Firmante</label>
                    <input 
                      type="text" 
                      value={localBrand.authorizedSignerTitle}
                      onChange={(e) => setLocalBrand({ ...localBrand, authorizedSignerTitle: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink placeholder:text-ink-faint transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveBrandKit}
                    disabled={isSavingBrand}
                    className="flex items-center gap-2 px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingBrand ? <Loader2 size={18} className="animate-spin" /> : brandSavedSuccess ? <Check size={18} /> : <Save size={18} />}
                    {brandSavedSuccess ? '¡Guardado Correctamente!' : 'Guardar y Aplicar Kit de Marca'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-ink mb-4">Información Personal</h2>
                <div className="flex items-center gap-6 mb-6">
                  <img 
                    src={user?.photoURL || 'https://picsum.photos/seed/user/200/200'} 
                    alt="Perfil" 
                    className="w-20 h-20 rounded-full border-2 border-line object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <button className="px-4 py-2 bg-surface border border-line text-ink rounded-xl text-sm font-medium hover:bg-surface-2 transition-colors cursor-pointer">
                      Cambiar Foto
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Nombre Completo</label>
                    <input type="text" defaultValue={user?.displayName || ''} className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Correo Electrónico</label>
                    <input type="email" defaultValue={user?.email || ''} disabled className="w-full px-4 py-2.5 bg-surface-2 border border-line rounded-xl text-sm font-medium text-ink-faint cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Cargo / Rol</label>
                    <input type="text" defaultValue="Ingeniero Residente de Obra" className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink" />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors cursor-pointer">
                    Guardar Cambios
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-ink mb-4">Datos Principales de la Empresa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Razón Social</label>
                    <input 
                      type="text" 
                      value={localBrand.companyName}
                      onChange={(e) => setLocalBrand({ ...localBrand, companyName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">RIF / NIT</label>
                    <input 
                      type="text" 
                      value={localBrand.taxId}
                      onChange={(e) => setLocalBrand({ ...localBrand, taxId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">Moneda Principal de Contrato</label>
                    <select className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium focus:border-brand-500 outline-none text-ink">
                      <option value="USD">Dólar Estadounidense (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="VES">Bolívar (VES)</option>
                      <option value="COP">Peso Colombiano (COP)</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={handleSaveBrandKit}
                    className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors cursor-pointer"
                  >
                    Actualizar Datos
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-ink mb-4">Alertas de Presupuesto y Avance</h2>
                  <div className="p-6 border border-line bg-surface-2 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-bold text-ink">
                        Umbral de Alerta Crítica: <span className="text-lg font-mono text-brand-500">{budgetThreshold}%</span>
                      </label>
                      <button 
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar Umbral
                      </button>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={budgetThreshold}
                      onChange={(e) => setBudgetThreshold(Number(e.target.value))}
                      className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-brand-500"
                    />
                    <p className="text-xs text-ink-soft">
                      El sistema emitirá una advertencia cuando la ejecución física o el gasto de una partida alcance o supere este porcentaje respecto a lo planificado.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-ink mb-4">Otras Notificaciones</h2>
                  <div className="space-y-3">
                    {[
                      { title: 'Reportes Diarios', desc: 'Recibir resumen de avance físico al final del día.' },
                      { title: 'Inventario Bajo', desc: 'Avisar cuando un material alcance el stock mínimo.' },
                      { title: 'Nuevos Documentos', desc: 'Notificar cuando se suban nuevos planos o especificaciones.' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border border-line rounded-2xl bg-surface">
                        <div>
                          <h3 className="font-bold text-sm text-ink">{item.title}</h3>
                          <p className="text-xs text-ink-soft">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                          <div className="w-11 h-6 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-ink mb-4">Seguridad y Accesos</h2>
                <div className="p-5 bg-surface-2 border border-line rounded-2xl flex gap-4">
                  <Shield className="text-brand-500 shrink-0 mt-0.5" size={24} />
                  <div>
                    <h3 className="font-bold text-sm text-ink">Autenticación de Dos Factores (2FA)</h3>
                    <p className="text-xs text-ink-soft mt-1">Añade una capa extra de seguridad a tu cuenta requiriendo un código adicional al iniciar sesión.</p>
                    <button className="mt-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer">
                      Configurar 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
