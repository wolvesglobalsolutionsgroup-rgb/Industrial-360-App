import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, User, Building, Bell, Shield, Save, Loader2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Settings() {
  const [user] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('notifications');
  const [budgetThreshold, setBudgetThreshold] = useState(90);
  const [isSaving, setIsSaving] = useState(false);

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
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Configuración</h1>
        <p className="text-gray-500 mt-1">Administra tus preferencias y datos de la empresa</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          {[
            { id: 'profile', label: 'Perfil de Usuario', icon: User },
            { id: 'company', label: 'Datos de Empresa', icon: Building },
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
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} className={activeTab === tab.id ? 'text-emerald-600' : 'text-gray-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Personal</h2>
                <div className="flex items-center gap-6 mb-6">
                  <img 
                    src={user?.photoURL || 'https://picsum.photos/seed/user/200/200'} 
                    alt="Perfil" 
                    className="w-20 h-20 rounded-full border-4 border-gray-50"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                      Cambiar Foto
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <input type="text" defaultValue={user?.displayName || ''} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                    <input type="email" defaultValue={user?.email || ''} disabled className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Rol</label>
                    <input type="text" defaultValue="Ingeniero Residente" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
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
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Datos de la Empresa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                    <input type="text" defaultValue="Constructora ObraSync C.A." className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RIF / NIT</label>
                    <input type="text" defaultValue="J-12345678-9" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moneda Principal</label>
                    <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option value="USD">Dólar Estadounidense (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="VES">Bolívar (VES)</option>
                      <option value="COP">Peso Colombiano (COP)</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                    Actualizar Empresa
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Alertas de Presupuesto y Avance</h2>
                  <div className="p-6 border border-amber-200 bg-amber-50 rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-bold text-amber-900">
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
                      className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <p className="text-sm text-amber-800 mt-3">
                      El sistema emitirá una advertencia cuando la ejecución física o el gasto de una partida alcance o supere este porcentaje respecto a lo planificado.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Otras Notificaciones</h2>
                  <div className="space-y-4">
                    {[
                      { title: 'Reportes Diarios', desc: 'Recibir resumen de avance físico al final del día.' },
                      { title: 'Inventario Bajo', desc: 'Avisar cuando un material alcance el stock mínimo.' },
                      { title: 'Nuevos Documentos', desc: 'Notificar cuando se suban nuevos planos o especificaciones.' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-500">{item.desc}</p>
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
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Seguridad y Accesos</h2>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex gap-3">
                  <Shield className="text-gray-600 shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">Autenticación de Dos Factores (2FA)</h3>
                    <p className="text-sm text-gray-600 mt-1">Añade una capa extra de seguridad a tu cuenta requiriendo un código adicional al iniciar sesión.</p>
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
