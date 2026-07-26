import { useState, useEffect, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { 
  User, Building, Bell, Shield, Save, Loader2, Palette, Upload, Check, Sparkles, Layers, Square, Sun, Moon
} from 'lucide-react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useProject, BrandKit } from '../ProjectContext';
import { useTheme } from '../theme/ThemeContext';
import { THEME_PRESETS, ThemePresetId } from '../theme/themePresets';

export default function Settings() {
  const [user] = useAuthState(auth);
  const { brandKit, updateBrandKit } = useProject();
  const { preset, setPreset, density, setDensity, borderRadius, setBorderRadius, isDarkMode, toggleMode } = useTheme();

  const [activeTab, setActiveTab] = useState('brand');
  const [budgetThreshold, setBudgetThreshold] = useState(90);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [brandSavedSuccess, setBrandSavedSuccess] = useState(false);

  // Local Brand Form State
  const [localBrand, setLocalBrand] = useState<BrandKit>(brandKit);

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Configuración y Temas de Diseño</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Administra el sistema de temas de colores (Theming), identidad visual y datos fiscales de la organización</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1">
          {[
            { id: 'brand', label: 'Kit de Marca & Temas', icon: Palette },
            { id: 'company', label: 'Datos de Empresa', icon: Building },
            { id: 'profile', label: 'Perfil de Usuario', icon: User },
            { id: 'notifications', label: 'Alertas y Notificaciones', icon: Bell },
            { id: 'security', label: 'Seguridad', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold' 
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} className={activeTab === tab.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-8">
            {activeTab === 'brand' && (
              <div className="space-y-8">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Temas de Colores & Kit de Marca</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      Selecciona presets de diseño de la plataforma y personaliza el membrete corporativo.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveBrandKit}
                    disabled={isSavingBrand}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md disabled:opacity-50 shrink-0"
                  >
                    {isSavingBrand ? <Loader2 size={16} className="animate-spin" /> : brandSavedSuccess ? <Check size={16} /> : <Save size={16} />}
                    {brandSavedSuccess ? '¡Guardado!' : 'Guardar Kit de Marca'}
                  </button>
                </div>

                {/* THEME PRESETS SELECTOR */}
                <div className="space-y-6 bg-slate-50/70 dark:bg-slate-800/40 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-black text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-500" /> Presets de Diseño y Paleta de Colores
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        Elige la paleta visual para toda la plataforma. Los cambios se aplican en tiempo real en la UI.
                      </p>
                    </div>

                    {/* Quick Light/Dark Toggle */}
                    <button
                      onClick={toggleMode}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold hover:shadow-md transition-all shrink-0 cursor-pointer"
                    >
                      {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
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
                          className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-md ring-4 ring-emerald-500/10'
                              : 'border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                          }`}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-gray-900 dark:text-slate-100">{pObj.name}</span>
                              {isSelected && (
                                <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check size={12} /> Activo
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">{pObj.description}</p>
                          </div>

                          {/* Swatch preview */}
                          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center -space-x-1.5">
                              <span className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-xs" style={{ backgroundColor: pObj.colors.bgApp }} title="Fondo App"></span>
                              <span className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-xs" style={{ backgroundColor: pObj.colors.colorPrimary }} title="Primario"></span>
                              <span className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-xs" style={{ backgroundColor: pObj.colors.colorSecondary }} title="Secundario"></span>
                              <span className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-xs" style={{ backgroundColor: pObj.colors.colorAccent }} title="Acento"></span>
                            </div>
                            <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                              pObj.colors.isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {pObj.colors.isDark ? 'Oscuro' : 'Claro'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* VISUAL DENSITY & BORDER RADIUS CONTROLS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-200/80 dark:border-slate-700/50">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                        <Layers size={14} /> Densidad Visual
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDensity('compact')}
                          className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                            density === 'compact'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                          }`}
                        >
                          Compacto (Alta Densidad)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDensity('spacious')}
                          className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                            density === 'spacious'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                          }`}
                        >
                          Holgado (Ejecutivo)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                        <Square size={14} /> Estilo de Bordes
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBorderRadius('rounded')}
                          className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                            borderRadius === 'rounded'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                          }`}
                        >
                          Bordes Suaves (16px)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBorderRadius('sharp')}
                          className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                            borderRadius === 'sharp'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                          }`}
                        >
                          Bordes Afilados (4px)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Header Preview */}
                <div className="p-5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-gray-400 dark:text-slate-500 block">Vista Previa de Encabezado Membretado</span>
                  <div 
                    className="p-4 rounded-xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow"
                    style={{ backgroundColor: localBrand.primaryColor || '#0B2239' }}
                  >
                    <div className="flex items-center gap-3">
                      {localBrand.logoUrl ? (
                        <img src={localBrand.logoUrl} alt="Logo" className="h-10 max-w-[120px] object-contain bg-white/10 p-1 rounded" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white text-xs">
                          {localBrand.companyName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-sm tracking-wide">{localBrand.companyName || 'NOMBRE DE EMPRESA'}</h3>
                        <p className="text-[11px] opacity-80">{localBrand.taxId} · {localBrand.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span 
                        className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full text-slate-900"
                        style={{ backgroundColor: localBrand.secondaryColor || '#3CB179' }}
                      >
                        DOCUMENTO OFICIAL
                      </span>
                      <p className="text-[10px] opacity-75 mt-1">{localBrand.headerText}</p>
                    </div>
                  </div>
                </div>

                {/* Brand Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Nombre Fiscal / Razón Social de la Contratista</label>
                    <input 
                      type="text" 
                      value={localBrand.companyName}
                      onChange={(e) => setLocalBrand({ ...localBrand, companyName: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Identificación Tributaria (RIF / NIT / CPT)</label>
                    <input 
                      type="text" 
                      value={localBrand.taxId}
                      onChange={(e) => setLocalBrand({ ...localBrand, taxId: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Teléfono de Contacto</label>
                    <input 
                      type="text" 
                      value={localBrand.phone}
                      onChange={(e) => setLocalBrand({ ...localBrand, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Correo Electrónico Corporativo</label>
                    <input 
                      type="email" 
                      value={localBrand.email}
                      onChange={(e) => setLocalBrand({ ...localBrand, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Dirección Fiscal / Sede de Operaciones</label>
                    <input 
                      type="text" 
                      value={localBrand.address}
                      onChange={(e) => setLocalBrand({ ...localBrand, address: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-3">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Logo Corporativo de la Empresa</label>
                    <div className="flex items-center gap-4">
                      {localBrand.logoUrl ? (
                        <img src={localBrand.logoUrl} alt="Logo preview" className="w-16 h-16 object-contain border p-1 rounded-xl bg-white" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-400 text-xs">
                          Sin Logo
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-100 transition-colors">
                          <Upload size={14} /> Cargar Imagen Logo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                        </label>
                        <input 
                          type="text"
                          placeholder="O pega URL de la imagen..."
                          value={localBrand.logoUrl}
                          onChange={(e) => setLocalBrand({ ...localBrand, logoUrl: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Signature / Stamp Upload */}
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-3">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Firma Digital & Sello Autorizado</label>
                    <div className="flex items-center gap-4">
                      {localBrand.digitalSignatureUrl ? (
                        <img src={localBrand.digitalSignatureUrl} alt="Firma preview" className="w-16 h-16 object-contain border p-1 rounded-xl bg-white" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-400 text-xs">
                          Sin Sello
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-100 transition-colors">
                          <Upload size={14} /> Cargar Firma / Sello
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'digitalSignatureUrl')} />
                        </label>
                        <input 
                          type="text"
                          placeholder="O pega URL de la firma..."
                          value={localBrand.digitalSignatureUrl}
                          onChange={(e) => setLocalBrand({ ...localBrand, digitalSignatureUrl: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Primary & Secondary Colors */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Color Primario Corporativo</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={localBrand.primaryColor}
                        onChange={(e) => setLocalBrand({ ...localBrand, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-gray-300 cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={localBrand.primaryColor}
                        onChange={(e) => setLocalBrand({ ...localBrand, primaryColor: e.target.value })}
                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Color Secundario / Destacado</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={localBrand.secondaryColor}
                        onChange={(e) => setLocalBrand({ ...localBrand, secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-gray-300 cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={localBrand.secondaryColor}
                        onChange={(e) => setLocalBrand({ ...localBrand, secondaryColor: e.target.value })}
                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Header & Footer Text */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Texto de Encabezado Membretado</label>
                    <input 
                      type="text" 
                      value={localBrand.headerText}
                      onChange={(e) => setLocalBrand({ ...localBrand, headerText: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Pie de Página Legal / Descargo en Documentos</label>
                    <textarea 
                      rows={2}
                      value={localBrand.footerText}
                      onChange={(e) => setLocalBrand({ ...localBrand, footerText: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>

                  {/* Authorized Signer */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Nombre del Firmante Autorizado</label>
                    <input 
                      type="text" 
                      value={localBrand.authorizedSignerName}
                      onChange={(e) => setLocalBrand({ ...localBrand, authorizedSignerName: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Cargo del Firmante</label>
                    <input 
                      type="text" 
                      value={localBrand.authorizedSignerTitle}
                      onChange={(e) => setLocalBrand({ ...localBrand, authorizedSignerTitle: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveBrandKit}
                    disabled={isSavingBrand}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
                  >
                    {isSavingBrand ? <Loader2 size={18} className="animate-spin" /> : brandSavedSuccess ? <Check size={18} /> : <Save size={18} />}
                    {brandSavedSuccess ? '¡Guardado Correctamente!' : 'Guardar y Aplicar Kit de Marca'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Información Personal</h2>
                <div className="flex items-center gap-6 mb-6">
                  <img 
                    src={user?.photoURL || 'https://picsum.photos/seed/user/200/200'} 
                    alt="Perfil" 
                    className="w-20 h-20 rounded-full border-4 border-gray-50 dark:border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                      Cambiar Foto
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                    <input type="text" defaultValue={user?.displayName || ''} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                    <input type="email" defaultValue={user?.email || ''} disabled className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 dark:text-slate-400 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Cargo / Rol</label>
                    <input type="text" defaultValue="Ingeniero Residente de Obra" className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                    Guardar Cambios
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Datos Principales de la Empresa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Razón Social</label>
                    <input 
                      type="text" 
                      value={localBrand.companyName}
                      onChange={(e) => setLocalBrand({ ...localBrand, companyName: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">RIF / NIT</label>
                    <input 
                      type="text" 
                      value={localBrand.taxId}
                      onChange={(e) => setLocalBrand({ ...localBrand, taxId: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Moneda Principal de Contrato</label>
                    <select className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white">
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
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Actualizar Datos
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Alertas de Presupuesto y Avance</h2>
                  <div className="p-6 border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-bold text-amber-900 dark:text-amber-200">
                        Umbral de Alerta Crítica: <span className="text-lg">{budgetThreshold}%</span>
                      </label>
                      <button 
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
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
                      className="w-full h-2 bg-amber-200 dark:bg-amber-900/50 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <p className="text-sm text-amber-800 dark:text-amber-300 mt-3">
                      El sistema emitirá una advertencia cuando la ejecución física o el gasto de una partida alcance o supere este porcentaje respecto a lo planificado.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Otras Notificaciones</h2>
                  <div className="space-y-4">
                    {[
                      { title: 'Reportes Diarios', desc: 'Recibir resumen de avance físico al final del día.' },
                      { title: 'Inventario Bajo', desc: 'Avisar cuando un material alcance el stock mínimo.' },
                      { title: 'Nuevos Documentos', desc: 'Notificar cuando se suban nuevos planos o especificaciones.' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-800 rounded-xl">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-slate-100">{item.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-slate-400">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Seguridad y Accesos</h2>
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl flex gap-3">
                  <Shield className="text-gray-600 dark:text-slate-300 shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-slate-100">Autenticación de Dos Factores (2FA)</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">Añade una capa extra de seguridad a tu cuenta requiriendo un código adicional al iniciar sesión.</p>
                    <button className="mt-3 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors">
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
