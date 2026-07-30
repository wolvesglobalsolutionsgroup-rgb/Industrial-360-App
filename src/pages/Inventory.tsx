import { useState, useEffect } from 'react';
import { handleFirestoreError, OperationType } from '../firebase';
import { PackagePlus, Package, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button, Card, CardContent, Input, Dialog } from '../components/ui';
import { inventoryRepo } from '../lib/repositories';
import { useProject } from '../ProjectContext';

export default function Inventory() {
  const { currentProject, currentOrganization } = useProject();
  const [items, setItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', unit: 'kg', quantity: '' });

  const orgId = currentOrganization?.id || 'semax_pino';
  const projectId = currentProject?.id || 'PROJ-DEFAULT';

  useEffect(() => {
    const unsubscribe = inventoryRepo.subscribe(orgId, projectId, (inv) => {
      setItems(inv);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'inventory');
    });
    return () => unsubscribe();
  }, [orgId, projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryRepo.create(orgId, projectId, {
        itemCode: `MAT-${Date.now().toString().slice(-4)}`,
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
      await inventoryRepo.update(orgId, projectId, itemId, {
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
          <h1 className="text-2xl font-bold text-ink">Inventario Diario</h1>
          <p className="text-ink-soft mt-1">Control de materiales en obra</p>
        </div>
        <Button 
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<PackagePlus size={20} />}
        >
          Nuevo Material
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
          <Card key={item.id} hoverEffect>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-500">
                  <Package size={24} />
                </div>
                <span className="text-xs text-ink-faint">
                  Act. {new Date(item.lastUpdated).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-ink mb-1">{item.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold text-ink tabular">{item.quantity}</span>
                <span className="text-ink-soft font-medium">{item.unit}</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity, -1)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-error/10 text-error hover:bg-error/20 rounded-lg transition-colors font-medium text-xs sm:text-sm cursor-pointer"
                >
                  <ArrowDownCircle size={18} />
                  Salida
                </button>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity, 1)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors font-medium text-xs sm:text-sm cursor-pointer"
                >
                  <ArrowUpCircle size={18} />
                  Entrada
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Material"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nombre del Material"
            required
            type="text"
            value={newItem.name}
            onChange={e => setNewItem({...newItem, name: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 w-full">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-soft">
                Unidad
              </label>
              <select 
                value={newItem.unit} 
                onChange={e => setNewItem({...newItem, unit: e.target.value})} 
                className="w-full py-2.5 px-3 bg-surface-2 border border-line text-xs sm:text-sm text-ink font-medium rounded-2xl outline-none focus:ring-2 focus:ring-brand-500"
                style={{ borderRadius: 'var(--theme-radius, 1rem)' }}
              >
                <option value="kg">kg</option>
                <option value="sacos">Sacos</option>
                <option value="m3">m³</option>
                <option value="und">Unidades</option>
                <option value="lts">Litros</option>
                <option value="ton">Toneladas</option>
              </select>
            </div>
            <Input
              label="Cantidad Inicial"
              required
              type="number"
              value={newItem.quantity}
              onChange={e => setNewItem({...newItem, quantity: e.target.value})}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              className="flex-1"
            >
              Guardar Material
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
