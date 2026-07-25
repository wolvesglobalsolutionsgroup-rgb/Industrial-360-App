import React, { useState, useEffect } from 'react';
import { 
  Truck, Gauge, ShieldCheck, Camera, Wrench, AlertTriangle, 
  Plus, Search, Calendar, FileText, CheckCircle2, Clock, Fuel, 
  ChevronRight, Download, Activity, Cpu, Sparkles
} from 'lucide-react';
import { useProject } from '../ProjectContext';

interface Equipment {
  id: string;
  tag: string;
  name: string;
  type: 'Grúa Telescópica' | 'Camión Vacuum' | 'Planta Eléctrica' | 'Compresor de Aire' | 'Motobomba' | 'Retroexcavadora';
  brandModel: string;
  currentHorometer: number;
  lastServiceHorometer: number;
  nextServiceHorometer: number;
  fuelType: 'Diésel' | 'Gasolina';
  dailyConsumptionLiters: number;
  status: 'Operativo en Sitio' | 'En Mantenimiento' | 'Fuera de Servicio' | 'Stand-by';
  certExpiryDate: string;
  operatorName: string;
}

export default function FleetEquipment() {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'inventory' | 'checklist' | 'passports'>('inventory');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Horometer Update Form
  const [newHorometer, setNewHorometer] = useState<number>(0);
  const [isSimulatingOCR, setIsSimulatingOCR] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState('');

  // Pre-op Checklist State
  const [preOpDate, setPreOpDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkEngineOil, setCheckEngineOil] = useState(true);
  const [checkHydraulicLeaks, setCheckHydraulicLeaks] = useState(true);
  const [checkBrakesAlerts, setCheckBrakesAlerts] = useState(true);
  const [checkFireExtinguisher, setCheckFireExtinguisher] = useState(true);
  const [checkEmergencyStop, setCheckEmergencyStop] = useState(true);
  const [checklistSaved, setChecklistSaved] = useState(false);

  useEffect(() => {
    const defaultEquipment: Equipment[] = [
      {
        id: 'EQ-GR-01',
        tag: 'GRU-IC360-80T',
        name: 'Grúa Telescópica TEREX 80 Toneladas',
        type: 'Grúa Telescópica',
        brandModel: 'Terex RT-780',
        currentHorometer: 4820,
        lastServiceHorometer: 4600,
        nextServiceHorometer: 4850,
        fuelType: 'Diésel',
        dailyConsumptionLiters: 140,
        status: 'Operativo en Sitio',
        certExpiryDate: '2026-11-15',
        operatorName: 'José Gregorio Bastardo (Cert. CCO-882)'
      },
      {
        id: 'EQ-VAC-02',
        tag: 'VAC-IC360-120B',
        name: 'Camión Vacuum de Succión 120 Barriles',
        type: 'Camión Vacuum',
        brandModel: 'Mack Granite / Cusco 5000',
        currentHorometer: 3150,
        lastServiceHorometer: 3000,
        nextServiceHorometer: 3250,
        fuelType: 'Diésel',
        dailyConsumptionLiters: 95,
        status: 'Operativo en Sitio',
        certExpiryDate: '2026-09-30',
        operatorName: 'Manuel Colmenares'
      },
      {
        id: 'EQ-GEN-04',
        tag: 'GEN-IC360-250KVA',
        name: 'Planta Eléctrica Silenciosa 250 kVA',
        type: 'Planta Eléctrica',
        brandModel: 'Cummins Silent Pack C250D5',
        currentHorometer: 6940,
        lastServiceHorometer: 6700,
        nextServiceHorometer: 6950,
        fuelType: 'Diésel',
        dailyConsumptionLiters: 210,
        status: 'En Mantenimiento',
        certExpiryDate: '2027-01-20',
        operatorName: 'Cuadrilla Electromecánica'
      },
      {
        id: 'EQ-CMP-01',
        tag: 'CMP-IC360-750CFM',
        name: 'Compresor de Aire Neumático 750 CFM',
        type: 'Compresor de Aire',
        brandModel: 'Atlas Copco XATS 750',
        currentHorometer: 2410,
        lastServiceHorometer: 2200,
        nextServiceHorometer: 2450,
        fuelType: 'Diésel',
        dailyConsumptionLiters: 80,
        status: 'Operativo en Sitio',
        certExpiryDate: '2026-12-05',
        operatorName: 'Carlos Eduardo Ruiz'
      }
    ];

    setEquipmentList(defaultEquipment);
    setSelectedEquip(defaultEquipment[0]);
    setNewHorometer(defaultEquipment[0].currentHorometer + 8);
  }, []);

  const handleSimulateOCRScan = () => {
    setIsSimulatingOCR(true);
    setOcrSuccessMsg('');
    setTimeout(() => {
      setIsSimulatingOCR(false);
      if (selectedEquip) {
        const scannedValue = selectedEquip.currentHorometer + 10;
        setNewHorometer(scannedValue);
        setOcrSuccessMsg(`✅ OCR Escaneado con Éxito: ${scannedValue} hrs detectadas en foto del horómetro digital.`);
      }
    }, 1200);
  };

  const handleSaveHorometer = () => {
    if (!selectedEquip) return;
    const updated = equipmentList.map(item => {
      if (item.id === selectedEquip.id) {
        return { ...item, currentHorometer: newHorometer };
      }
      return item;
    });
    setEquipmentList(updated);
    setSelectedEquip({ ...selectedEquip, currentHorometer: newHorometer });
    alert(`Horómetro actualizado para ${selectedEquip.tag} a ${newHorometer} hrs.`);
  };

  const filteredEquip = equipmentList.filter(eq => {
    const matchesSearch = eq.tag.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          eq.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && eq.type === filterType;
  });

  const totalActiveEquip = equipmentList.filter(e => e.status === 'Operativo en Sitio').length;
  const inMaintenanceCount = equipmentList.filter(e => e.status === 'En Mantenimiento').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Truck size={16} /> Módulo Especializado de Flota & Maquinaria Crítica
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Equipos Críticos & Horómetros</h1>
          <p className="text-slate-400 text-sm mt-1">
            Control de horómetros con OCR/IoT, checklists pre-operativos diarios y pasaportes técnicos de maquinaria.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Equipos Activos</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{totalActiveEquip} / {equipmentList.length}</span>
          </div>
          <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">En Mantenimiento</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{inMaintenanceCount}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'inventory' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Gauge size={16} /> Inventario & Lectura de Horómetros (OCR/IoT)
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'checklist' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck size={16} /> Checklist Pre-operativo Diario (Móvil)
        </button>
        <button
          onClick={() => setActiveTab('passports')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'passports' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText size={16} /> Pasaporte Técnico & Certificados
        </button>
      </div>

      {/* TAB 1: INVENTARIO & HORÓMETROS */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900">Flota de Obra</h2>
              <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">
                {filteredEquip.length} Unidades
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar equipo o TAG..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredEquip.map((item) => {
                const isSelected = selectedEquip?.id === item.id;
                const hoursToService = item.nextServiceHorometer - item.currentHorometer;
                const isNearService = hoursToService <= 30;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedEquip(item);
                      setNewHorometer(item.currentHorometer + 8);
                      setOcrSuccessMsg('');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-400/20'
                        : 'border-gray-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {item.tag}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.status === 'Operativo en Sitio' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-gray-800 mt-2 line-clamp-1">{item.name}</h3>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-gray-400 text-[9px] uppercase block">Horómetro Actual</span>
                        <span className="font-bold text-gray-900">{item.currentHorometer} hrs</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[9px] uppercase block">Próx. Service</span>
                        <span className={`font-bold ${isNearService ? 'text-red-600' : 'text-gray-700'}`}>
                          en {hoursToService} hrs
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details & OCR Update */}
          <div className="lg:col-span-2 space-y-6">
            {selectedEquip ? (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-100 gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                      {selectedEquip.tag} · {selectedEquip.brandModel}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{selectedEquip.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg font-mono">
                    Operador: {selectedEquip.operatorName}
                  </span>
                </div>

                {/* OCR Capture Card */}
                <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center text-xs text-emerald-400 font-mono font-bold uppercase">
                    <span className="flex items-center gap-1.5">
                      <Camera size={16} /> Captura Móvil de Horómetro por OCR / Visión por Computador
                    </span>
                    <span>IA VISION ENG-V2</span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Toma una fotografía del panel o horómetro del equipo. La inteligencia artificial extraerá los dígitos automáticamente para evitar errores de transcripción en bitácora.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <label className="block text-xs font-mono text-slate-400">Horómetro Registrado (Horas):</label>
                      <input
                        type="number"
                        value={newHorometer}
                        onChange={(e) => setNewHorometer(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-emerald-400 text-2xl font-mono font-bold px-4 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <span className="text-[11px] text-slate-400 block">
                        Diferencia con última lectura: +{newHorometer - selectedEquip.currentHorometer} hrs de trabajo.
                      </span>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleSimulateOCRScan}
                        disabled={isSimulatingOCR}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow"
                      >
                        <Sparkles size={16} />
                        {isSimulatingOCR ? 'Analizando Foto de Panel...' : 'Simular Captura OCR con Cámara'}
                      </button>

                      <button
                        onClick={handleSaveHorometer}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs border border-slate-700 transition-all"
                      >
                        Confirmar y Actualizar Horómetro
                      </button>
                    </div>
                  </div>

                  {ocrSuccessMsg && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-200 text-xs font-mono">
                      {ocrSuccessMsg}
                    </div>
                  )}
                </div>

                {/* Specs and Maintenance alerts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-4 bg-slate-50 rounded-xl border border-gray-200">
                    <span className="text-gray-400 text-[10px] uppercase block mb-1">Consumo Estimado Diésel</span>
                    <span className="text-base font-bold text-gray-900">{selectedEquip.dailyConsumptionLiters} L / Día</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-gray-200">
                    <span className="text-gray-400 text-[10px] uppercase block mb-1">Último Mantenimiento</span>
                    <span className="text-base font-bold text-gray-900">{selectedEquip.lastServiceHorometer} hrs</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-gray-200">
                    <span className="text-gray-400 text-[10px] uppercase block mb-1">Próximo Mantenimiento</span>
                    <span className="text-base font-bold text-emerald-700">{selectedEquip.nextServiceHorometer} hrs</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 text-gray-500">
                Selecciona un equipo de la lista para gestionar su horómetro.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CHECKLIST PRE-OPERATIVO */}
      {activeTab === 'checklist' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Checklist Pre-operativo Diario de Maquinaria Pesada</h2>
            <p className="text-xs text-gray-500 mt-1">
              Verificación obligatoria de seguridad antes de dar arranque al motor en sitio de obra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Fecha de Inspección</label>
                <input
                  type="date"
                  value={preOpDate}
                  onChange={(e) => setPreOpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Puntos Críticos de Verificación SIHO-A</h3>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkEngineOil}
                    onChange={(e) => setCheckEngineOil(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                  />
                  <span>Nivel de Aceite de Motor y Refrigerante dentro de rango normal</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkHydraulicLeaks}
                    onChange={(e) => setCheckHydraulicLeaks(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                  />
                  <span>Inspección visual de fugas hidráulicas en mangueras y cilindros</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkBrakesAlerts}
                    onChange={(e) => setCheckBrakesAlerts(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                  />
                  <span>Sistema de Frenos, Dirección y Alarmas de Reversa funcionales</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkFireExtinguisher}
                    onChange={(e) => setCheckFireExtinguisher(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                  />
                  <span>Extintor PQS de 20 lbs con presión verde y fecha vigente</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkEmergencyStop}
                    onChange={(e) => setCheckEmergencyStop(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                  />
                  <span>Botón de Parada de Emergencia (Kill Switch) probado y libre</span>
                </label>
              </div>

              <button
                onClick={() => setChecklistSaved(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-all"
              >
                Firmar y Firmar Inspección Pre-operativa
              </button>

              {checklistSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} /> Inspección grabada con código de validación QR-IC360-2026.
                </div>
              )}
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-mono font-bold uppercase block mb-1">
                  ESTADO DE INSPECCIÓN OPERATIVA
                </span>
                <h3 className="text-xl font-bold">Resumen de Conformidad</h3>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <p>• Equipo Inspeccionado: {selectedEquip?.tag}</p>
                <p>• Operador a Cargo: {selectedEquip?.operatorName}</p>
                <p>• Estatus Inspección: {checkEngineOil && checkHydraulicLeaks && checkBrakesAlerts ? 'APROBADO CONFORME' : 'REQUIERE ATENCIÓN'}</p>
              </div>

              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-xs text-slate-300">
                La firma electrónica del operador compromete la verificación física en campo conforme a los estándares SIHO-A y normativas vigentes.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PASAPORTES TÉCNICOS & CERTIFICADOS */}
      {activeTab === 'passports' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Hoja de Vida y Certificados de Maquinaria (Passports)</h2>
            <p className="text-xs text-gray-500 mt-1">
              Certificaciones de prueba de carga, pólizas de seguro y calibraciones de sensores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {equipmentList.map(item => (
              <div key={item.id} className="p-4 bg-slate-50 border border-gray-200 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">{item.tag}</span>
                    <h3 className="font-bold text-sm text-gray-900 mt-1">{item.name}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
                    Vence: {item.certExpiryDate}
                  </span>
                </div>

                <div className="space-y-1 text-gray-600">
                  <p><strong>Certificación de Operador:</strong> {item.operatorName}</p>
                  <p><strong>Certificado Prueba de Carga:</strong> Vigente conforme a ASME B30.5</p>
                </div>

                <div className="pt-2 border-t border-gray-200 flex justify-end">
                  <button 
                    onClick={() => alert(`Descargando Pasaporte Técnico de ${item.tag}...`)}
                    className="flex items-center gap-1 font-bold text-slate-900 hover:underline"
                  >
                    <Download size={12} /> Descargar Dossier Maquinaria (PDF)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
