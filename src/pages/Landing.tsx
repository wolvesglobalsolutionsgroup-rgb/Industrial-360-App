import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HardHat, 
  FileText, 
  ShieldCheck, 
  Activity, 
  Wrench, 
  BrainCircuit, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Globe, 
  ChevronRight, 
  Zap, 
  Layers,
  Sparkles,
  Building,
  Check,
  Send
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Landing() {
  const navigate = useNavigate();
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoRequested, setDemoRequested] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    company: '',
    role: 'Gerente de Proyecto / Contratista'
  });

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.email || !demoForm.name) return;
    setDemoRequested(true);
    setTimeout(() => {
      setDemoRequested(false);
      setDemoModalOpen(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <HardHat size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="font-display text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Industrial Control <span className="text-emerald-400">360</span>
              </span>
              <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Plataforma EPC Oil & Gas
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Funcionalidades</a>
            <a href="#workflow" className="hover:text-emerald-400 transition-colors">Flujo de Trabajo</a>
            <a href="#compliance" className="hover:text-emerald-400 transition-colors">Normativa</a>
            <a href="#portal" className="hover:text-emerald-400 transition-colors">Portal Cliente</a>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/login')}
              className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200"
            >
              Iniciar Sesión
            </Button>
            <Button 
              variant="primary" 
              onClick={() => setDemoModalOpen(true)}
              className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-none shadow-md shadow-emerald-500/20"
              rightIcon={<ArrowRight size={14} />}
            >
              Solicitar Demo
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.08),transparent_50%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
              <Sparkles size={14} />
              <span>Estándar de Control Operativo O&G & EPC Industrial</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
              Control Operativo, Financiero y SIHO-A para <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">Obras Industriales</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg font-medium leading-relaxed mb-8">
              Gestión integral de WBS, Valuaciones ROE PDVSA, Permisos PTW SIHO-A, Control de Juntas de Soldadura (ASME B31.4/B31.8) y Dossier Digital de Cierre en una sola plataforma.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button 
                variant="primary" 
                onClick={() => navigate('/login')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm h-12 px-8 rounded-xl shadow-lg shadow-emerald-500/25"
                rightIcon={<ArrowRight size={18} />}
              >
                Acceso a Plataforma
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDemoModalOpen(true)}
                className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-sm h-12 px-8 rounded-xl"
                leftIcon={<Building size={18} />}
              >
                Agendar Demo Técnica
              </Button>
            </div>

            {/* NORMATIVA & CLIENT BADGES */}
            <div className="pt-8 border-t border-slate-800/80 flex flex-wrap items-center gap-y-3 gap-x-8 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Formatos ROE PDVSA</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Normas ASME B31.3 / B31.4 / B31.8</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Estándares SIHO-A / AST</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Sincronización P6 (.xer) y BC3</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS / STATS BANNER */}
      <section className="bg-slate-900/60 border-y border-slate-800/80 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/50">
              <p className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono">+100%</p>
              <p className="text-xs font-extrabold uppercase text-slate-400 mt-1">Trazabilidad en Campo</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/50">
              <p className="text-2xl sm:text-4xl font-black text-white font-mono">0 Papel</p>
              <p className="text-xs font-extrabold uppercase text-slate-400 mt-1">Inspección Digital PTW</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/50">
              <p className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono">-$45M+</p>
              <p className="text-xs font-extrabold uppercase text-slate-400 mt-1">Monto de Obra Gestionado</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/50">
              <p className="text-2xl sm:text-4xl font-black text-white font-mono">&lt; 2 Min</p>
              <p className="text-xs font-extrabold uppercase text-slate-400 mt-1">Emisión de Valuación ROE</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-extrabold text-emerald-400 tracking-widest uppercase mb-2">Módulos Especializados</h2>
          <p className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Arquitectura de Grado Industrial para Obras Complejas
          </p>
          <p className="text-slate-400 text-sm mt-3 font-medium">
            Módulos nativos diseñados para la dinámica de contratistas e inspectores en frentes de trabajo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2">Valuaciones ROE PDVSA</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Generación automatizada de certificados de pago, cálculo en tiempo real de retención de fiel cumplimiento (10%), retención laboral (5%) y amortización de anticipo.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span>Formato Contractual ROE</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Layers size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2">WBS, Curvas S & Primavera P6</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Control de avance físico-financiero por partida WBS. Importación directa de archivos Primavera P6 (.xer) y Presto/BC3 para control de volumenes y avances ponderados.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span>Sincronización P6 & BC3</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2">Permisos SIHO-A & PTW</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Emisión digital de permisos de trabajo en caliente, frío, espacio confinado e izamiento. Verificación de EPP, análisis AST y matriz de aislamientos LOTO.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span>Auditoría de Seguridad</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Wrench size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2">QA/QC & Juntas de Soldadura</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Trazabilidad completa por junta de tubería: asignación de soldadores homologados (WPS), reporte NDT (Ultrasonido / Gammagrafía) y porcentaje de reparación.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span>Normas ASME B31.4 / B31.8</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Lock size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2">Portal Cliente Seguro</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Enlace único con token de seguridad cifrado y caducidad configurable. Permite a la empresa fiscalizadora revisar avances sin requerir cuenta ni ver datos financieros sensibles.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span>Acceso Externo Fiscalizado</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <BrainCircuit size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2">Project Brain & Dossier Digital</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Asistente de Inteligencia Artificial entrenado con las especificaciones del proyecto y compilador automático del Libro de Obra (Dossier de Calidad en PDF).
            </p>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span>Compilador Automatizado</span>
              <ChevronRight size={14} />
            </div>
          </div>

        </div>
      </section>

      {/* WORKFLOW SECTION */}
      <section id="workflow" className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-extrabold text-emerald-400 tracking-widest uppercase mb-2">Flujo Eficiente de Trabajo</h2>
            <p className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              De la Planificación al Cierre de Obra
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center mb-4 text-sm">1</div>
              <h3 className="text-base font-extrabold text-white mb-2">Planifica & Sincroniza WBS</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Carga la estructura presupuestaria en Excel, Primavera P6 o BC3. Define partidas, cantidades contractuales y cuadrillas asignadas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center mb-4 text-sm">2</div>
              <h3 className="text-base font-extrabold text-white mb-2">Captura en Campo (Offline)</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Los inspectores reportan avances diarios, abren permisos PTW y registran juntas soldadas desde tabletas o teléfonos sin conexión a internet.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center mb-4 text-sm">3</div>
              <h3 className="text-base font-extrabold text-white mb-2">Emisión ROE & Dossier</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Genera la valuación con el desglose exacto de retenciones y exporta el dossier de calidad listo para facturar y entregar a fiscalización.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-emerald-500/30 shadow-2xl">
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
              ¿Listo para Digitalizar tus Proyectos de Ingeniería y Construcción?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-8">
              Pruébalo inmediatamente en nuestro entorno operativo o solicita una demostración adaptada a la estructura de tu empresa.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                variant="primary" 
                onClick={() => navigate('/login')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm h-12 px-8 rounded-xl shadow-lg shadow-emerald-500/25"
              >
                Ingresar a la Plataforma
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDemoModalOpen(true)}
                className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-sm h-12 px-8 rounded-xl"
              >
                Solicitar Demostración
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
              <HardHat size={16} />
            </div>
            <span className="font-bold text-slate-300">Industrial Control 360</span>
            <span>— Sistema de Gestión para Obras O&G e Infraestructura Industrial</span>
          </div>

          <p>© {new Date().getFullYear()} Industrial Control 360. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* DEMO MODAL */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            {demoRequested ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check size={28} />
                </div>
                <h3 className="text-lg font-extrabold text-white">¡Solicitud Recibida!</h3>
                <p className="text-xs text-slate-400">
                  Un especialista técnico se pondrá en contacto a la brevedad con las credenciales de acceso para la demostración.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Sparkles size={20} className="text-emerald-400" />
                    <span>Solicitar Demo Técnica</span>
                  </h3>
                  <button 
                    onClick={() => setDemoModalOpen(false)}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleDemoSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      required 
                      value={demoForm.name}
                      onChange={e => setDemoForm({ ...demoForm, name: e.target.value })}
                      placeholder="Ej: Ing. Roberto Mendoza"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Correo Electrónico Corporativo</label>
                    <input 
                      type="email" 
                      required 
                      value={demoForm.email}
                      onChange={e => setDemoForm({ ...demoForm, email: e.target.value })}
                      placeholder="ejemplo@contratista.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Empresa / Proyecto</label>
                    <input 
                      type="text" 
                      value={demoForm.company}
                      onChange={e => setDemoForm({ ...demoForm, company: e.target.value })}
                      placeholder="Ej: Consorcio Vial & Gas"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20"
                      rightIcon={<Send size={14} />}
                    >
                      Enviar Solicitud
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
