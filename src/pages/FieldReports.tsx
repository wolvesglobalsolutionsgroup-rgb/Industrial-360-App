import { useState } from 'react';
import { Camera, MapPin, Users, Clock, Save, FileText, CheckCircle2 } from 'lucide-react';

export default function FieldReports() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState('Soleado');
  const [personnelCount, setPersonnelCount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reporte Diario de Campo</h1>
        <p className="text-gray-500 text-sm">Registro de actividades, personal y clima en obra.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Info */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={20} className="text-emerald-600" />
            Información General
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del Reporte</label>
              <input 
                type="date" 
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clima</label>
              <select 
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Soleado">Soleado</option>
                <option value="Nublado">Nublado</option>
                <option value="Lluvia Ligera">Lluvia Ligera</option>
                <option value="Lluvia Fuerte">Lluvia Fuerte</option>
                <option value="Tormenta">Tormenta</option>
              </select>
            </div>
          </div>
        </div>

        {/* Personnel & Equipment */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users size={20} className="text-emerald-600" />
            Recursos en Sitio
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Total (Obreros + Staff)</label>
              <input 
                type="number" 
                min="0"
                value={personnelCount}
                onChange={(e) => setPersonnelCount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horas Trabajadas</label>
              <div className="relative">
                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="number" 
                  min="0"
                  step="0.5"
                  defaultValue={8}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Activities & Notes */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MapPin size={20} className="text-emerald-600" />
            Actividades y Observaciones
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de Actividades</label>
            <textarea 
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describa las actividades realizadas hoy, problemas encontrados, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              required
            ></textarea>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Camera size={20} className="text-emerald-600" />
            Evidencia Fotográfica
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
            <Camera size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 font-medium">Toca para tomar una foto o subir desde la galería</p>
            <p className="text-xs text-gray-400 mt-1">Soporta JPG, PNG (Max 5MB)</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || submitted}
            className={`w-full py-3 px-4 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all ${
              submitted 
                ? 'bg-green-500' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : submitted ? (
              <>
                <CheckCircle2 size={20} />
                Reporte Enviado
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar Reporte Diario
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
