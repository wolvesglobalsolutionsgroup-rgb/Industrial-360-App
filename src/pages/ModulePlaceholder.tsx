import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  CircleDollarSign, Clock, PackageSearch, ShieldCheck, FileArchive, 
  Database, BookOpen, Plug, Network, BrainCircuit, Briefcase, 
  Wrench, AlertTriangle, FileText, CheckCircle, Zap, Lock, Link as LinkIcon,
  BarChart, Users, Truck, Activity
} from 'lucide-react';

const modulesData: Record<string, any> = {
  'costos': {
    title: 'Módulo 1: Ingeniería de Costos, Contabilidad y Tesorería',
    icon: CircleDollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    features: [
      { name: 'Generador PNP y APU', desc: 'Creación de Partidas No Previstas al vuelo desde notas de voz y Análisis de Precios Unitarios cruzando costos de mercado en tiempo real.', icon: Wrench },
      { name: 'Validador de Alcance', desc: 'Emite alertas rojas si se ejecuta una tarea sin partida presupuestaria aprobada.', icon: AlertTriangle },
      { name: 'Valuación Dinámica (ROE)', desc: 'Generación de facturas parciales semanales. Conciliador automático de metrajes diarios entre campo y oficina técnica.', icon: FileText },
      { name: 'Calculadoras Dinámicas', desc: 'Rendimientos de cuadrilla ajustada por clima/emergencia; sobrecostos operativos por trabajo nocturno, fines de semana o feriados.', icon: Activity },
      { name: 'Simulador y Gestor de Justificaciones', desc: 'Simulador de impacto financiero por cambios en sitio. Auto-redactor de memorias descriptivas y anexos técnicos.', icon: FileText },
      { name: 'Control de Costos Indirectos', desc: 'Rastreador de cisternas, iluminación portátil, achiques y alarma predictiva de agotamiento del monto máximo del contrato marco.', icon: BarChart },
      { name: 'Gestor de Firmas', desc: 'Flujo de aprobación "One-Click" vía WhatsApp, generador de Actas de Precios Acordados pre-llenadas.', icon: CheckCircle },
      { name: 'Contabilidad y Pagos', desc: 'Extractor OCR de costos de materiales desde facturas directas a la estructura del APU. Gateway de pagos y proyector de flujo de caja.', icon: CircleDollarSign },
    ]
  },
  'tiempos': {
    title: 'Módulo 2: Control de Tiempos, Recursos y Gamificación',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    features: [
      { name: 'Gestión de Horas y Personal', desc: 'Lector IA de hojas de tiempo (Timesheets) escritas a mano. Calculadora de bonos. Auditor de conformación de cuadrillas. Bot supervisor de fatiga.', icon: Users },
      { name: 'Escudo de Reclamos (Stand-by)', desc: 'Bot documentador de Tiempos Muertos imputables al cliente por falta de permisos. Auto-redactor de cartas de notificación legal.', icon: ShieldCheck },
      { name: 'Control de Maquinaria', desc: 'Extracción de horas de uso mediante fotos del horómetro. Alerta temprana de subutilización. Calculadora de depreciación acelerada.', icon: Wrench },
      { name: 'Productividad y Logística de Frentes', desc: 'Dashboard de productividad (kilos o m2 por hora-hombre). Reasignación dinámica de cuadrillas hacia la Ruta Crítica.', icon: BarChart },
      { name: 'Gamificación del Trabajador (Buy-In)', desc: 'Acceso vía WhatsApp para el obrero donde consulta horas extras, bonos y estimado de pago semanal.', icon: Zap },
    ]
  },
  'procura': {
    title: 'Módulo 3: Procura de Choque y Marketplace Ciego',
    icon: PackageSearch,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    features: [
      { name: 'Agente Cotizador Relámpago', desc: 'Envía requerimientos masivos y ensambla un Cuadro Comparativo de Ofertas en minutos. Generador automático de OC por voz.', icon: Zap },
      { name: 'Radar y Control de Stock', desc: 'Alerta predictiva de "Quiebre de Stock" en 24 horas. Lector IA de Notas de Entrega. Gestor de requisiciones por comandos de voz.', icon: Activity },
      { name: 'Logística y Trazabilidad', desc: 'Rastreador de envíos (Expediting). Rastreador de trazabilidad, custodia y merma de materiales del cliente.', icon: Truck },
      { name: 'Directorio y Asesoría Técnica', desc: 'Directorio de proveedores validado en el RNC. Asesor IA de equivalencias metalúrgicas (Norma H-221).', icon: BookOpen },
      { name: 'Marketplace de Salvamento', desc: 'Mercado ciego inter-contratistas para compra/venta urgente de inventario muerto o sobrante en la zona.', icon: PackageSearch },
    ]
  },
  'qa-qc': {
    title: 'Módulo 4: QA/QC, Permisología y Riesgos (IoT)',
    icon: ShieldCheck,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    features: [
      { name: 'Gestor de Permisos (PTW y ART)', desc: 'Generador predictivo pre-llenado. Asistente que sugiere peligros ocultos. Alarma de cuenta regresiva para renovación.', icon: FileText },
      { name: 'Ojo de Halcón (Auditor Visual)', desc: 'Validador de andamios. Diseñador de planes END. App de registro visual inalterable con GPS, fecha, hora y usuario incrustado.', icon: ShieldCheck },
      { name: 'IoT Nativo y Control de Calidad', desc: 'Integración Bluetooth directa con Elcometers y Psicrómetros. Validador fotográfico de pantallas de medición.', icon: Database },
      { name: 'Desviaciones y SIHO-A', desc: 'Tramitador exprés de Manejo de Cambio. Auto-generador de NCRs. Verificador de vigencia de soldadores (WPS/PQR).', icon: AlertTriangle },
      { name: 'Dashboard de Riesgos (Heat-Map)', desc: 'Semáforo de riesgo por partida (Schedule vs. Cost vs. Quality) con predicciones de ML.', icon: BarChart },
    ]
  },
  'cierre': {
    title: 'Módulo 5: Cierre Administrativo y Reportes Ejecutivos',
    icon: FileArchive,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    features: [
      { name: 'Dossier As-Built', desc: 'Ensamblador automatizado del Libro Final de Obra. Clasificador inteligente de miles de fotos. Convertidor de bocetos a planos.', icon: FileArchive },
      { name: 'Reportabilidad Continua', desc: 'Redactor de resúmenes ejecutivos diarios y semanales. Creador automático de minutas de reuniones.', icon: FileText },
      { name: 'Cierre y Liquidación', desc: 'Generador de Actas de Terminación Mecánica. Auto-generador del Acta de Aceptación Definitiva. Consolidador de la ROE.', icon: CheckCircle },
      { name: 'Seguimiento Final', desc: 'Rastreador implacable de Punch-Lists. Constructor de la Curva "S" final. Bóveda de Seguridad (empaquetador y encriptador).', icon: Lock },
    ]
  },
  'auditoria': {
    title: 'Módulo 6: Blockchain Operativo y Auditoría Inmutable',
    icon: Database,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    features: [
      { name: 'Cadena de Custodia (Ledger)', desc: 'Hash SHA-256 de cada foto, decisión y documento. Firma Multi-Factor del Inspector (Geo + Huella + PIN).', icon: LinkIcon },
      { name: 'Prueba de Existencia', desc: 'Generador de "Prueba de Existencia" sincronizada con reloj NTP. Exportador de Cadena de Custodia para la Contraloría.', icon: ShieldCheck },
    ]
  },
  'normativa': {
    title: 'Módulo 7: Gestor de Corpus Normativo (RAG Dinámico)',
    icon: BookOpen,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    features: [
      { name: 'Bóveda Viva', desc: 'Actualizador automático mediante webhooks de la Documentación Técnica de PDVSA. Validador normativo en tiempo real.', icon: BookOpen },
      { name: 'Sincronización Offline', desc: 'Compresión de índices normativos (RAG Offline) para consultas sin internet en zonas remotas.', icon: Database },
    ]
  },
  'conectores': {
    title: 'Módulo 8: Conectores Empresariales (Legacy & Modern)',
    icon: Plug,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    features: [
      { name: 'Mapeo Bidireccional SAP', desc: 'Conector SAP (Módulo MM) para inyectar avance físico, materiales rechazados y consumos.', icon: Plug },
      { name: 'Integración SGCM y MS Project', desc: 'Conector SGCM para metrajes, certificados y NCRs. Sincronización con MS Project (% físico real, ruta crítica).', icon: LinkIcon },
      { name: 'Oracle HCM', desc: 'Conector para expediente de nómina, bonos y ausencias (ART).', icon: Users },
    ]
  },
  'escalamiento': {
    title: 'Módulo 9: Árbol de Decisiones y Escalamiento Inteligente',
    icon: Network,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    features: [
      { name: 'Motor de Reglas y SLA', desc: 'Pipeline de firmas con tiempos máximos (ej. PTW Frío: 30 min). Matriz de Autoridades.', icon: Network },
      { name: 'Justificaciones Automáticas', desc: 'Generador de justificaciones automáticas y reporte de cumplimiento de SLA (detección de cuellos de botella).', icon: FileText },
    ]
  },
  'benchmarking': {
    title: 'Módulo 10: Aprendizaje Organizacional y Benchmarking',
    icon: BrainCircuit,
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-100',
    features: [
      { name: 'Post-Mortem y Benchmarking', desc: 'IA extrae insights clave y los compara vs. histórico. Benchmarking interno de KPIs (HH/kg acero, días perdidos HSE).', icon: BrainCircuit },
      { name: 'Procedimientos Estándar', desc: 'Generador de "Procedimientos Estándar" basados en mejores prácticas repetitivas.', icon: BookOpen },
    ]
  },
  'bi-ofertas': {
    title: 'Módulo 11: Business Intelligence y Ofertas',
    icon: Briefcase,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    features: [
      { name: 'Inteligencia de Proyectos', desc: 'Base de Datos Histórica de proyectos cerrados. Estimador de Costos para nuevas ofertas.', icon: Database },
      { name: 'Simulador y Radar', desc: 'Simulador de rentabilidad (ajuste de márgenes). Radar de Capacidad (evaluación de recursos disponibles para licitaciones paralelas).', icon: BarChart },
    ]
  }
};

export default function ModulePlaceholder() {
  const { id } = useParams<{ id: string }>();
  const moduleData = id ? modulesData[id] : null;

  if (!moduleData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Módulo no encontrado.</p>
      </div>
    );
  }

  const Icon = moduleData.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      key={id} // Force re-render on route change
      className="space-y-6 pb-12"
    >
      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${moduleData.bgColor} ${moduleData.color}`}>
          <Icon size={32} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{moduleData.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">Enterprise Edition</span>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-md flex items-center gap-1">
              <CheckCircle size={12} /> Arquitectura Base Lista
            </span>
          </div>
        </div>
      </header>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex gap-3">
        <div className="text-blue-600 shrink-0 mt-0.5">
          <Zap size={20} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-blue-900">Módulo en Fase de Integración</h3>
          <p className="text-sm text-blue-800 mt-1">
            La estructura base, enrutamiento y seguridad (MFA/RBAC) para este módulo ya están desplegados en la arquitectura <strong>Industrial Control 360</strong>. Las funcionalidades específicas listadas abajo se irán activando progresivamente según el roadmap de desarrollo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {moduleData.features.map((feature: any, index: number) => {
          const FeatureIcon = feature.icon;
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={index} 
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${moduleData.bgColor} ${moduleData.color} shrink-0`}>
                  <FeatureIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
