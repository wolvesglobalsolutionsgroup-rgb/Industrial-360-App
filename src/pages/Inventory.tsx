import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { PackagePlus, Package, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', unit: 'kg', quantity: '' });

  useEffect(() => {
    const q = query(collection(db, 'inventory'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inv = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(inv);
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'inventory'), {
        projectId: 'default-project',
        name: newItem.name,
        unit: newItem.unit,
        quantity: Number(newItem.quantity),
        lastUpdated: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewItem({ name: '', unit: 'kg', quantity: '' });
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  const updateQuantity = async (itemId: string, currentQty: number, change: number) => {
    const newQty = Math.max(0, currentQty + change);
    try {
      await updateDoc(doc(db, 'inventory', itemId), {
        quantity: newQty,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating inventory:", error);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inventario Diario</h1>
          <p className="text-gray-500 mt-1">Control de materiales en obra</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <PackagePlus size={20} />
          Nuevo Material
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Package size={24} />
              </div>
              <span className="text-xs text-gray-400">
                Act. {new Date(item.lastUpdated).toLocaleDateString()}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold text-gray-900">{item.quantity}</span>
              <span className="text-gray-500 font-medium">{item.unit}</span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => updateQuantity(item.id, item.quantity, -1)}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium"
              >
                <ArrowDownCircle size={18} />
                Salida
              </button>
              <button 
                onClick={() => updateQuantity(item.id, item.quantity, 1)}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-medium"
              >
                <ArrowUpCircle size={18} />
                Entrada
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nuevo Material</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Material</label>
                <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <select value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="kg">kg</option>
                    <option value="sacos">Sacos</option>
                    <option value="m3">m³</option>
                    <option value="und">Unidades</option>
                    <option value="lts">Litros</option>
                    <option value="ton">Toneladas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Inicial</label>
                  <input required type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Guardar Material</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
