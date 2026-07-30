import React, { useState, useEffect } from 'react';
import { X, HardHat, ShieldCheck, DollarSign, Layers } from 'lucide-react';
import { Button } from '../ui/Button';

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => Promise<void>;
  initialData?: any;
  defaultStatus?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultStatus = 'planificada',
}) => {
  const [wbsCode, setWbsCode] = useState('');
  const [title, setTitle] = useState('');
  const [specialty, setSpecialty] = useState('Mecánica');
  const [unit, setUnit] = useState('m');
  const [plannedQuantity, setPlannedQuantity] = useState<number | string>(100);
  const [executedQuantity, setExecutedQuantity] = useState<number | string>(0);
  const [unitCost, setUnitCost] = useState<number | string>(120);
  const [crewName, setCrewName] = useState('Cuadrilla Mecánica A');
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [ptwRequired, setPtwRequired] = useState(true);
  const [restrictionNotes, setRestrictionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setWbsCode(initialData.wbsCode || '');
      setTitle(initialData.title || '');
      setSpecialty(initialData.specialty || 'Mecánica');
      setUnit(initialData.unit || 'm');
      setPlannedQuantity(initialData.plannedQuantity ?? 100);
      setExecutedQuantity(initialData.executedQuantity ?? 0);
      setUnitCost(initialData.unitCost ?? 120);
      setCrewName(initialData.crewName || 'Cuadrilla Mecánica A');
      setStatus(initialData.status || defaultStatus);
      setPriority(initialData.priority || 'medium');
      setPtwRequired(initialData.ptwRequired ?? true);
      setRestrictionNotes(initialData.restrictionNotes || '');
    } else {
      setWbsCode(`WBS-1.1.${Date.now().toString().slice(-3)}`);
      setTitle('');
      setSpecialty('Mecánica');
      setUnit('m');
      setPlannedQuantity(100);
      setExecutedQuantity(0);
      setUnitCost(120);
      setCrewName('Cuadrilla Mecánica A');
      setStatus(defaultStatus);
      setPriority('medium');
      setPtwRequired(true);
      setRestrictionNotes('');
    }
  }, [initialData, defaultStatus, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ...(initialData ? { id: initialData.id } : {}),
        wbsCode,
        title: title.trim(),
        specialty,
        unit,
        plannedQuantity: Number(plannedQuantity) || 0,
        executedQuantity: Number(executedQuantity) || 0,
        unitCost: Number(unitCost) || 0,
        crewName,
        status,
        priority,
        ptwRequired,
        restrictionNotes,
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } catch (error) {
      console.error("Error al guardar partida WBS:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-surface border border-line rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <HardHat size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black font-display text-ink">
                {initialData ? 'Editar Partida WBS' : 'Nueva Partida WBS'}
              </h3>
              <p className="text-xs text-ink-soft">
                Configuración de catálogo y parámetros de ejecución en campo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Código WBS</label>
              <input
                type="text"
                value={wbsCode}
                onChange={(e) => setWbsCode(e.target.value)}
                placeholder="Ej: M-02.1"
                required
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-mono text-ink focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Especialidad</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand-500 outline-none font-medium"
              >
                <option value="Mecánica">Mecánica & Tubería</option>
                <option value="Civil">Obra Civil & Fundaciones</option>
                <option value="Electricidad">Electricidad & Potencia</option>
                <option value="Instrumentación">Instrumentación & Control</option>
                <option value="SIHO-A">SIHO-A & Seguridad</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">Título de la Partida</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Tendido de tubería de 10 pulgadas ASTM A106 Gr. B SCH 40"
              required
              className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Unidad</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="m, m³, ton"
                required
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Volumen Planificado</label>
              <input
                type="number"
                value={plannedQuantity}
                onChange={(e) => setPlannedQuantity(e.target.value)}
                required
                min="0"
                step="any"
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-mono text-ink focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Volumen Ejecutado</label>
              <input
                type="number"
                value={executedQuantity}
                onChange={(e) => setExecutedQuantity(e.target.value)}
                min="0"
                step="any"
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-mono text-ink focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Costo Unitario ($)</label>
              <input
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                required
                min="0"
                step="any"
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-mono text-ink focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Cuadrilla Asignada</label>
              <input
                type="text"
                value={crewName}
                onChange={(e) => setCrewName(e.target.value)}
                placeholder="Ej: Cuadrilla Soldadura B"
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Columna / Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="planificada">Planificadas</option>
                <option value="en_campo">En Campo</option>
                <option value="bloqueada">Bloqueadas</option>
                <option value="terminada">Terminadas / NDT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="ptwRequired"
              checked={ptwRequired}
              onChange={(e) => setPtwRequired(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 border-line bg-surface-2"
            />
            <label htmlFor="ptwRequired" className="text-xs font-bold text-ink flex items-center gap-1.5 cursor-pointer">
              <ShieldCheck size={14} className="text-amber-500" />
              Requiere Permiso de Trabajo Caliente / Frío (SIHO-A)
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">Notas o Restricciones de Campo</label>
            <textarea
              value={restrictionNotes}
              onChange={(e) => setRestrictionNotes(e.target.value)}
              placeholder="Ej: En espera de liberación NDT de junta #4 o disponibilidad de grúa..."
              rows={2}
              className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              {initialData ? 'Guardar Cambios' : 'Crear Partida'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
