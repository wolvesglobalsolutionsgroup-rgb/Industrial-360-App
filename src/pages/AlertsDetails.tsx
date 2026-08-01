import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AlertsDetails() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="mb-8 flex items-center gap-4">
        <Link to="/" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Centro de Alertas</h1>
          <p className="text-gray-500 mt-1">Gestión de alertas y notificaciones del sistema</p>
        </div>
      </header>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Alertas Pendientes</h2>
        </div>
        <p className="text-gray-600">Aquí se mostrarán las alertas de presupuesto, calidad, seguridad y retrasos en cronograma.</p>
        
        <div className="mt-8 h-64 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400">
          Lista de Alertas y Notificaciones
        </div>
      </div>
    </motion.div>
  );
}
