import { motion } from 'motion/react';
import { HardHat, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PersonnelDetails() {
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Detalles de Personal</h1>
          <p className="text-gray-500 mt-1">Gestión y control de personal activo en obra</p>
        </div>
      </header>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <HardHat size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Listado de Personal Activo</h2>
        </div>
        <p className="text-gray-600">Aquí se mostrará la lista de trabajadores, cuadrillas, horas trabajadas y control de acceso.</p>
        
        <div className="mt-8 h-64 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400">
          Tabla de Personal y Asistencia
        </div>
      </div>
    </motion.div>
  );
}
