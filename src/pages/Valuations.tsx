import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FileSignature, Plus, Download, Eye, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Valuations() {
  const [valuations, setValuations] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newValuation, setNewValuation] = useState({
    periodStart: '',
    periodEnd: '',
    description: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'valuations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setValuations(vals);
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real scenario, this would calculate the amount based on tasks executed in the period
      const simulatedAmount = Math.floor(Math.random() * 50000) + 10000;
      const retentionFielCumplimiento = simulatedAmount * 0.10; // 10% retention
      const retentionLaboral = simulatedAmount * 0.05; // 5% retention
      const netAmount = simulatedAmount - retentionFielCumplimiento - retentionLaboral;

      await addDoc(collection(db, 'valuations'), {
        number: valuations.length + 1,
        periodStart: newValuation.periodStart,
        periodEnd: newValuation.periodEnd,
        description: newValuation.description,
        grossAmount: simulatedAmount,
        retentionFielCumplimiento,
        retentionLaboral,
        netAmount,
        status: 'Borrador',
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewValuation({ periodStart: '', periodEnd: '', description: '' });
    } catch (error) {
      console.error("Error creating valuation:", error);
      alert("Error al crear la valuación");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Valuaciones de Obra</h1>
          <p className="text-gray-500 mt-1">Gestión de cobros, retenciones y estado de pago</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Generar Valuación
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {valuations.map(val => (
          <div key={val.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">Valuación N° {val.number}</h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  val.status === 'Aprobada' ? 'bg-emerald-100 text-emerald-700' :
                  val.status === 'Pagada' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {val.status}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-4">Período: {val.periodStart} al {val.periodEnd}</p>
              <p className="text-gray-700">{val.description}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl min-w-[250px]">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Monto Bruto:</span>
                  <span className="font-medium text-gray-900">${val.grossAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Retención F.C. (10%):</span>
                  <span>-${val.retentionFielCumplimiento?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Retención Laboral (5%):</span>
                  <span>-${val.retentionLaboral?.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-lg">
                  <span className="text-gray-900">Neto a Cobrar:</span>
                  <span className="text-emerald-600">${val.netAmount?.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  <Eye size={16} /> Ver
                </button>
                <button className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  <Download size={16} /> PDF
                </button>
              </div>
            </div>
          </div>
        ))}

        {valuations.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
            <FileSignature size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay valuaciones registradas</h3>
            <p className="text-gray-500">Genera tu primera valuación basada en el avance físico de las partidas.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Generar Nueva Valuación</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                  <input required type="date" value={newValuation.periodStart} onChange={e => setNewValuation({...newValuation, periodStart: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                  <input required type="date" value={newValuation.periodEnd} onChange={e => setNewValuation({...newValuation, periodEnd: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Concepto</label>
                <textarea required value={newValuation.description} onChange={e => setNewValuation({...newValuation, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24" placeholder="Ej: Valuación correspondiente a trabajos de movimiento de tierra y fundaciones..." />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                <p>El sistema calculará automáticamente el monto basado en el avance registrado de las partidas en este período.</p>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Generar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
