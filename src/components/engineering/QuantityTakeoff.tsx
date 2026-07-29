import React, { useState, useEffect } from 'react';
import { 
  Calculator, Plus, Trash2, Edit2, Download, FileSpreadsheet, 
  Ruler, Layers, CheckCircle2, ShieldCheck, RefreshCw, Info, FileCheck, ArrowRight
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useProject } from '../../ProjectContext';

export interface TakeoffItem {
  id?: string;
  wbsCode: string;
  description: string;
  location: string; // e.g. "Progresiva K0+000 a K1+200 - Tramo Oleoducto 16\""
  unit: string; // "m3", "m2", "m", "kg", "pza"
  lengthM: number;
  widthM: number;
  heightOrThicknessM: number;
  count: number;
  totalQuantity: number;
  notes?: string;
  verifiedBy?: string;
  status: 'Borrador' | 'Verificado' | 'Aprobado SIDCON';
  createdAt?: any;
}

export const INITIAL_TAKEOFFS: TakeoffItem[] = [
  {
    id: 'TO-001',
    wbsCode: 'CIV-EXC-01',
    description: 'Excavación en tierra para Zanja de Tubería 16" Sch 40 (PDVSA L-STC-001)',
    location: 'Progresiva K0+000 a K0+850',
    unit: 'm3',
    lengthM: 850,
    widthM: 1.2,
    heightOrThicknessM: 1.5,
    count: 1,
    totalQuantity: 1530,
    notes: 'Incluye peinado de taludes 1:0.5 y retiro de material sobrante a botadero autorizado.',
    verifiedBy: 'Ing. Carlos Medina (Inspector Civil)',
    status: 'Aprobado SIDCON'
  },
  {
    id: 'TO-002',
    wbsCode: 'CIV-REL-02',
    description: 'Relleno compacto con Arena de Cama y Suelo Seleccionado en Zanja de Tubería',
    location: 'Progresiva K0+000 a K0+850',
    unit: 'm3',
    lengthM: 850,
    widthM: 1.2,
    heightOrThicknessM: 1.0,
    count: 1,
    totalQuantity: 889.3,
    notes: 'Descontando el volumen ocupado por tubería de 16" (D=0.4064m). Compactación 95% Proctor.',
    verifiedBy: 'Ing. Carlos Medina (Inspector Civil)',
    status: 'Aprobado SIDCON'
  },
  {
    id: 'TO-003',
    wbsCode: 'MEC-TUB-01',
    description: 'Tendido, Alineación y Soldadura de Tubería de Acero API 5L Gr. X52 16" OD x 0.375" WT',
    location: 'Tramo Anaco - Puerto La Cruz (K0+000 a K1+500)',
    unit: 'm',
    lengthM: 1500,
    widthM: 1,
    heightOrThicknessM: 1,
    count: 1,
    totalQuantity: 1500,
    notes: '125 tubos de 12 metros nominales cada uno. MTR verificado.',
    verifiedBy: 'Ing. Marcos Silva (CWI Level III)',
    status: 'Aprobado SIDCON'
  },
  {
    id: 'TO-004',
    wbsCode: 'CIV-CON-03',
    description: 'Vaciado de Concreto fc=210 kg/cm2 para Dados de Anclaje de Válvulas de Bloqueo',
    location: 'Estación de Válvulas K0+450',
    unit: 'm3',
    lengthM: 2.5,
    widthM: 2.0,
    heightOrThicknessM: 1.8,
    count: 2,
    totalQuantity: 18.0,
    notes: 'Dado de concreto armado con cabillas N° 5 @ 15cm A/S.',
    verifiedBy: 'Ing. Carlos Medina',
    status: 'Verificado'
  }
];

export default function QuantityTakeoff() {
  const { currentProject } = useProject();
  const [takeoffs, setTakeoffs] = useState<TakeoffItem[]>(INITIAL_TAKEOFFS);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterWbs, setFilterWbs] = useState<string>('ALL');
  
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<TakeoffItem | null>(null);

  // Quick Volume Calculator State
  const [calcType, setCalcType] = useState<'trench' | 'concrete' | 'pipe_weight'>('trench');
  const [trenchLength, setTrenchLength] = useState<number>(100);
  const [trenchWidth, setTrenchWidth] = useState<number>(1.2);
  const [trenchDepth, setTrenchDepth] = useState<number>(1.5);
  const [pipeDiameterInches, setPipeDiameterInches] = useState<number>(16);

  const [concreteL, setConcreteL] = useState<number>(2.5);
  const [concreteW, setConcreteW] = useState<number>(2.0);
  const [concreteH, setConcreteH] = useState<number>(1.8);
  const [concreteQty, setConcreteQty] = useState<number>(2);

  const [pipeLengthM, setPipeLengthM] = useState<number>(1000);
  const [pipeSizeInches, setPipeSizeInches] = useState<number>(16);
  const [pipeWallMm, setPipeWallMm] = useState<number>(9.53);

  // Form input fields
  const [formWbs, setFormWbs] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formUnit, setFormUnit] = useState<string>('m3');
  const [formLength, setFormLength] = useState<number>(0);
  const [formWidth, setFormWidth] = useState<number>(0);
  const [formHeight, setFormHeight] = useState<number>(0);
  const [formCount, setFormCount] = useState<number>(1);
  const [formNotes, setFormNotes] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'Borrador' | 'Verificado' | 'Aprobado SIDCON'>('Borrador');

  // Firestore Synchronization
  useEffect(() => {
    if (!currentProject?.id || !currentProject?.orgId) {
      setLoading(false);
      return;
    }

    const takeoffsRef = collection(db, 'organizations', currentProject.orgId, 'projects', currentProject.id, 'quantity_takeoffs');
    const unsubscribe = onSnapshot(takeoffsRef, (snapshot) => {
      const docsData: TakeoffItem[] = [];
      snapshot.forEach((docSnap) => {
        docsData.push({ id: docSnap.id, ...docSnap.data() } as TakeoffItem);
      });

      if (docsData.length > 0) {
        setTakeoffs(docsData);
      } else {
        setTakeoffs(INITIAL_TAKEOFFS);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'QuantityTakeoffs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentProject?.id, currentProject?.orgId]);

  // Calculations
  const calculatedTrenchVolume = (() => {
    const pipeDiameterM = (pipeDiameterInches * 25.4) / 1000;
    const grossVol = trenchLength * trenchWidth * trenchDepth;
    const pipeVol = Math.PI * Math.pow(pipeDiameterM / 2, 2) * trenchLength;
    const netVol = Math.max(0, grossVol - pipeVol);
    return { grossVol: Math.round(grossVol * 100) / 100, pipeVol: Math.round(pipeVol * 100) / 100, netVol: Math.round(netVol * 100) / 100 };
  })();

  const calculatedConcreteVol = Math.round(concreteL * concreteW * concreteH * concreteQty * 100) / 100;

  const calculatedPipeWeightKg = (() => {
    // Weight (kg/m) = 0.02466 * (D_mm - t_mm) * t_mm
    const D_mm = pipeSizeInches * 25.4;
    const kgPerMeter = 0.02466 * (D_mm - pipeWallMm) * pipeWallMm;
    const totalKg = kgPerMeter * pipeLengthM;
    return { kgPerMeter: Math.round(kgPerMeter * 100) / 100, totalTons: Math.round((totalKg / 1000) * 100) / 100, totalKg: Math.round(totalKg * 10) / 10 };
  })();

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormWbs('CIV-EXC-01');
    setFormDesc('');
    setFormLocation('');
    setFormUnit('m3');
    setFormLength(0);
    setFormWidth(0);
    setFormHeight(0);
    setFormCount(1);
    setFormNotes('');
    setFormStatus('Borrador');
    setIsModalOpen(true);
  };

  const handleEdit = (item: TakeoffItem) => {
    setEditingItem(item);
    setFormWbs(item.wbsCode);
    setFormDesc(item.description);
    setFormLocation(item.location);
    setFormUnit(item.unit);
    setFormLength(item.lengthM);
    setFormWidth(item.widthM);
    setFormHeight(item.heightOrThicknessM);
    setFormCount(item.count);
    setFormNotes(item.notes || '');
    setFormStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-calculate total
    let computedQty = formCount * formLength;
    if (formWidth > 0) computedQty *= formWidth;
    if (formHeight > 0) computedQty *= formHeight;
    computedQty = Math.round(computedQty * 100) / 100;

    const payload: Omit<TakeoffItem, 'id'> = {
      wbsCode: formWbs,
      description: formDesc,
      location: formLocation,
      unit: formUnit,
      lengthM: formLength,
      widthM: formWidth,
      heightOrThicknessM: formHeight,
      count: formCount,
      totalQuantity: computedQty,
      notes: formNotes,
      verifiedBy: 'Ing. Inspector Obra PROINTECA',
      status: formStatus,
      createdAt: serverTimestamp()
    };

    if (currentProject?.id && currentProject?.orgId) {
      try {
        const takeoffsRef = collection(db, 'organizations', currentProject.orgId, 'projects', currentProject.id, 'quantity_takeoffs');
        if (editingItem?.id) {
          await updateDoc(doc(takeoffsRef, editingItem.id), payload);
        } else {
          await addDoc(takeoffsRef, payload);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'QuantityTakeoff');
      }
    } else {
      // Local state fallback
      if (editingItem?.id) {
        setTakeoffs(prev => prev.map(t => t.id === editingItem.id ? { ...payload, id: editingItem.id } : t));
      } else {
        setTakeoffs(prev => [{ ...payload, id: `TO-${Date.now()}` }, ...prev]);
      }
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('¿Está seguro de eliminar este registro de cómputos métricos?')) return;
    if (currentProject?.id && currentProject?.orgId) {
      try {
        const docRef = doc(db, 'organizations', currentProject.orgId, 'projects', currentProject.id, 'quantity_takeoffs', id);
        await deleteDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'DeleteTakeoff');
      }
    } else {
      setTakeoffs(prev => prev.filter(t => t.id !== id));
    }
  };

  // Export CSV for SIDCON Valuations
  const handleExportCsv = () => {
    const headers = ['Partida WBS', 'Descripción', 'Ubicación / Tramo', 'Unidad', 'Piezas (N)', 'Largo (m)', 'Ancho (m)', 'Alto (m)', 'Cantidad Total', 'Notas', 'Estado SIDCON'];
    const rows = takeoffs.map(t => [
      `"${t.wbsCode}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.location}"`,
      `"${t.unit}"`,
      t.count,
      t.lengthM,
      t.widthM,
      t.heightOrThicknessM,
      t.totalQuantity,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      `"${t.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Libro_Computos_Metricos_SIDCON_${currentProject?.id || 'PRJ'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTakeoffs = filterWbs === 'ALL' 
    ? takeoffs 
    : takeoffs.filter(t => t.wbsCode.toLowerCase().includes(filterWbs.toLowerCase()));

  const totalTakeoffVolumeM3 = takeoffs.filter(t => t.unit === 'm3').reduce((acc, curr) => acc + curr.totalQuantity, 0);
  const totalTakeoffMeters = takeoffs.filter(t => t.unit === 'm').reduce((acc, curr) => acc + curr.totalQuantity, 0);

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="bg-surface rounded-2xl border border-line p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              <Ruler size={20} />
            </span>
            <h2 className="text-lg font-bold text-ink">Visor y Libro de Cómputos Métricos SIDCON (PDVSA PIC-03-01-19)</h2>
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Memoria descriptiva de cálculo de volúmenes, metrajes y pesajes vinculados a partidas WBS contractuales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-surface hover:bg-surface-2 text-ink text-xs font-bold px-3.5 py-2 rounded-xl border border-line transition-all cursor-pointer"
          >
            <Download size={15} />
            Exportar Libro SIDCON (CSV)
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            Agregar Cómputo Métrico
          </button>
        </div>
      </div>

      {/* QUICK ENGINEERING CALCULATOR PANEL */}
      <div className="bg-surface rounded-2xl border border-line p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="text-amber-500" size={18} />
            <h3 className="text-sm font-bold text-ink">Calculadora Integrada de Volúmenes O&G</h3>
          </div>

          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-line text-xs font-medium">
            <button
              onClick={() => setCalcType('trench')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${calcType === 'trench' ? 'bg-blue-600 text-white font-bold' : 'text-ink-soft hover:text-ink'}`}
            >
              ⛏️ Zanja Tubería
            </button>
            <button
              onClick={() => setCalcType('concrete')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${calcType === 'concrete' ? 'bg-blue-600 text-white font-bold' : 'text-ink-soft hover:text-ink'}`}
            >
              🧱 Concreto / Dados
            </button>
            <button
              onClick={() => setCalcType('pipe_weight')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${calcType === 'pipe_weight' ? 'bg-blue-600 text-white font-bold' : 'text-ink-soft hover:text-ink'}`}
            >
              ⚖️ Peso Tubería (API)
            </button>
          </div>
        </div>

        {/* CALC 1: ZANJA TUBERIA */}
        {calcType === 'trench' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-surface-2 p-4 rounded-xl border border-line text-xs">
            <div>
              <label className="block text-ink-soft font-semibold mb-1">Longitud (m)</label>
              <input 
                type="number" 
                value={trenchLength} 
                onChange={(e) => setTrenchLength(Number(e.target.value))} 
                className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-bold text-ink"
              />
            </div>
            <div>
              <label className="block text-ink-soft font-semibold mb-1">Ancho Zanja (m)</label>
              <input 
                type="number" 
                step="0.1" 
                value={trenchWidth} 
                onChange={(e) => setTrenchWidth(Number(e.target.value))} 
                className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-bold text-ink"
              />
            </div>
            <div>
              <label className="block text-ink-soft font-semibold mb-1">Profundidad (m)</label>
              <input 
                type="number" 
                step="0.1" 
                value={trenchDepth} 
                onChange={(e) => setTrenchDepth(Number(e.target.value))} 
                className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-bold text-ink"
              />
            </div>
            <div>
              <label className="block text-ink-soft font-semibold mb-1">Diámetro Tubo (pulg)</label>
              <input 
                type="number" 
                value={pipeDiameterInches} 
                onChange={(e) => setPipeDiameterInches(Number(e.target.value))} 
                className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-bold text-ink"
              />
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl">
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block uppercase">Volumen Neto Relleno:</span>
              <span className="text-base font-extrabold text-blue-700 dark:text-blue-300 font-mono">
                {calculatedTrenchVolume.netVol.toLocaleString()} m³
              </span>
              <span className="text-[10px] text-ink-soft block mt-0.5">
                (Excavación Bruta: {calculatedTrenchVolume.grossVol} m³)
              </span>
            </div>
          </div>
        )}

        {/* CALC 2: CONCRETO */}
        {calcType === 'concrete' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-surface-2 p-4 rounded-xl border border-line text-xs">
            <div>
              <label className="block text-ink-soft font-semibold mb-1">Largo (m)</label>
              <input 
                type="number" 
                step="0.1" 
                value={concreteL} 
                onChange={(e) => setConcreteL(Number(e.target.value))} 
                className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-bold text-ink"
              />
            </div>
            <div>
              <label className="block text-ink-soft font-semibold mb-1">Ancho (m)</label>
              <input 
                type="number" 
                step="0.1" 
                value={concreteW} 
                onChange={(e) => setConcreteW(Number(e.target.value))} 
                className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-bold text-ink"
              />
            </div>
            <div>
              <label className="block text-ink-soft font-semibold mb-1">Alto (m)</label>
              <input 
                type="number" 
                step="0.1" 
                value={concreteH} 
                onChange={(e) => setConcreteH(Number(e.target.value))} 
                className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-bold text-ink"
              />
            </div>
            <div>
              <label className="block text-ink-soft font-semibold mb-1">Cantidad Piezas</label>
              <input 
                type="number" 
                value={concreteQty} 
                onChange={(e) => setConcreteQty(Number(e.target.value))} 
                className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-bold text-ink"
              />
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase">Volumen Vaciado:</span>
              <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                {calculatedConcreteVol.toLocaleString()} m³
              </span>
            </div>
          </div>
        )}

        {/* CALC 3: PESO TUBERIA */}
        {calcType === 'pipe_weight' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-surface-2 p-4 rounded-xl border border-line text-xs">
            <div>
              <label className="block text-ink-soft font-semibold mb-1">Longitud Total (m)</label>
              <input 
                type="number" 
                value={pipeLengthM} 
                onChange={(e) => setPipeLengthM(Number(e.target.value))} 
                className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-bold text-ink"
              />
            </div>
            <div>
              <label className="block text-ink-soft font-semibold mb-1">Diámetro Nom. (pulg)</label>
              <input 
                type="number" 
                value={pipeSizeInches} 
                onChange={(e) => setPipeSizeInches(Number(e.target.value))} 
                className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-bold text-ink"
              />
            </div>
            <div>
              <label className="block text-ink-soft font-semibold mb-1">Espesor Pared WT (mm)</label>
              <input 
                type="number" 
                step="0.01" 
                value={pipeWallMm} 
                onChange={(e) => setPipeWallMm(Number(e.target.value))} 
                className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-bold text-ink"
              />
            </div>
            <div className="col-span-2 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block uppercase">Peso Unitario:</span>
                <span className="text-sm font-bold text-ink font-mono">{calculatedPipeWeightKg.kgPerMeter} kg/m</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block uppercase">Peso Total Proyecto:</span>
                <span className="text-base font-extrabold text-amber-700 dark:text-amber-300 font-mono">
                  {calculatedPipeWeightKg.totalTons.toLocaleString()} Ton
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUMMARY STATS & METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-line p-4 shadow-sm">
          <span className="text-xs font-semibold text-ink-soft block">Partidas Medidas</span>
          <span className="text-xl font-extrabold text-ink font-mono mt-1 block">{takeoffs.length} Partidas</span>
        </div>
        <div className="bg-surface rounded-xl border border-line p-4 shadow-sm">
          <span className="text-xs font-semibold text-ink-soft block">Volumen Total Movimiento Tierras / Concreto</span>
          <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-1 block">
            {totalTakeoffVolumeM3.toLocaleString()} m³
          </span>
        </div>
        <div className="bg-surface rounded-xl border border-line p-4 shadow-sm">
          <span className="text-xs font-semibold text-ink-soft block">Longitud Acumulada Tubería</span>
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
            {totalTakeoffMeters.toLocaleString()} m
          </span>
        </div>
      </div>

      {/* TAKEOFFS TABLE */}
      <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
        <div className="p-4 bg-surface-2 border-b border-line flex items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-blue-500" />
            Tabla Principal de Cómputos Métricos
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink-soft font-semibold">Filtrar WBS:</span>
            <select
              value={filterWbs}
              onChange={(e) => setFilterWbs(e.target.value)}
              className="bg-surface border border-line rounded-lg px-2.5 py-1 text-ink font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todas las Partidas</option>
              <option value="CIV">Especialidad Civil (CIV)</option>
              <option value="MEC">Especialidad Mecánica (MEC)</option>
              <option value="ELE">Especialidad Eléctrica (ELE)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-line text-ink-soft font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">WBS</th>
                <th className="p-3.5">Descripción de la Obra</th>
                <th className="p-3.5">Ubicación / Tramo</th>
                <th className="p-3.5 text-center">Unidad</th>
                <th className="p-3.5 text-center">Dimensiones (L x W x H x N)</th>
                <th className="p-3.5 text-right">Cómputo Total</th>
                <th className="p-3.5 text-center">Estado SIDCON</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredTakeoffs.map((item) => (
                <tr key={item.id} className="hover:bg-surface-2/60 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {item.wbsCode}
                  </td>
                  <td className="p-3.5">
                    <p className="font-bold text-ink">{item.description}</p>
                    {item.notes && <p className="text-[11px] text-ink-soft mt-0.5">{item.notes}</p>}
                  </td>
                  <td className="p-3.5 text-ink-soft font-medium whitespace-nowrap">
                    {item.location}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded bg-surface-2 border border-line font-mono font-bold text-ink">
                      {item.unit}
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-mono text-ink-soft whitespace-nowrap">
                    {item.lengthM}m × {item.widthM || 1}m × {item.heightOrThicknessM || 1}m (N={item.count})
                  </td>
                  <td className="p-3.5 text-right font-mono font-extrabold text-sm text-ink whitespace-nowrap">
                    {item.totalQuantity.toLocaleString()} {item.unit}
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      item.status === 'Aprobado SIDCON'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : item.status === 'Verificado'
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-surface-2 text-ink-soft hover:text-blue-600 transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-2xl w-full max-w-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">
                {editingItem ? 'Editar Cómputo Métrico' : 'Nuevo Registro de Cómputo Métrico SIDCON'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-ink-soft hover:text-ink cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-ink mb-1">Código Partida WBS *</label>
                  <input
                    type="text"
                    required
                    value={formWbs}
                    onChange={(e) => setFormWbs(e.target.value)}
                    placeholder="Ej: CIV-EXC-01"
                    className="w-full bg-surface-2 border border-line rounded-xl px-3 py-2 font-mono text-ink font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-ink mb-1">Unidad de Medición *</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-surface-2 border border-line rounded-xl px-3 py-2 font-bold text-ink"
                  >
                    <option value="m3">Metro Cúbico (m³)</option>
                    <option value="m2">Metro Cuadrado (m²)</option>
                    <option value="m">Metro Lineal (m)</option>
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="Ton">Tonelada Metrica (Ton)</option>
                    <option value="pza">Pieza / Unidad (pza)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">Descripción de la Obra *</label>
                <input
                  type="text"
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder='Ej: Excavación en tierra para zanja de tubería 16"'
                  className="w-full bg-surface-2 border border-line rounded-xl px-3 py-2 text-ink"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">Ubicación / Progresiva / Tramo *</label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Ej: Progresiva K0+000 a K0+850"
                  className="w-full bg-surface-2 border border-line rounded-xl px-3 py-2 text-ink"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-2 p-3 rounded-xl border border-line">
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Largo (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formLength}
                    onChange={(e) => setFormLength(Number(e.target.value))}
                    className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono text-ink font-bold"
                  />
                </div>
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Ancho (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formWidth}
                    onChange={(e) => setFormWidth(Number(e.target.value))}
                    className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono text-ink font-bold"
                  />
                </div>
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Alto / Espesor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formHeight}
                    onChange={(e) => setFormHeight(Number(e.target.value))}
                    className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono text-ink font-bold"
                  />
                </div>
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Piezas (N)</label>
                  <input
                    type="number"
                    value={formCount}
                    onChange={(e) => setFormCount(Number(e.target.value))}
                    className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono text-ink font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-ink mb-1">Estado SIDCON</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-surface-2 border border-line rounded-xl px-3 py-2 text-ink font-bold"
                  >
                    <option value="Borrador">Borrador</option>
                    <option value="Verificado">Verificado</option>
                    <option value="Aprobado SIDCON">Aprobado SIDCON</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-ink mb-1">Observaciones / Notas</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Normas aplicadas, especificaciones..."
                    className="w-full bg-surface-2 border border-line rounded-xl px-3 py-2 text-ink"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-line text-ink hover:bg-surface-2 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-sm"
                >
                  {editingItem ? 'Guardar Cambios' : 'Registrar Cómputo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
