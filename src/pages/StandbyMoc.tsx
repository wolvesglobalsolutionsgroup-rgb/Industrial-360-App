import React, { useState, useEffect } from 'react';
import { 
  Clock, ShieldAlert, FileText, CircleDollarSign, AlertTriangle, 
  Send, Plus, CheckCircle2, XCircle, ChevronRight, Calculator, 
  Building2, UserCheck, Scale, Sparkles, FileCheck, Layers
} from 'lucide-react';
import { useProject } from '../ProjectContext';

interface StandbyEvent {
  id: string;
  date: string;
  cause: string;
  responsibleParty: 'Cliente / Supervisor' | 'Condiciones Ambientales' | 'Interferencia Terceros';
  equipmentAffected: string;
  personnelAffectedCount: number;
  hoursDelayed: number;
  standbyRatePerHour: number;
  totalCostUsd: number;
  status: 'Registrado' | 'Notificado a Cliente' | 'Reclamo Formal Presentado' | 'Aprobado para Pago';
}

interface MocRequest {
  id: string;
  code: string;
  title: string;
  description: string;
  requestedBy: string;
  costImpactUsd: number;
  timeImpactDays: number;
  status: 'Borrador' | 'Pendiente Aprobación Cliente' | 'Aprobada' | 'Rechazada';
  date: string;
}

export default function StandbyMoc() {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'standby' | 'letterGenerator' | 'moc'>('standby');

  // Standby Events List
  const [events, setEvents] = useState<StandbyEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<StandbyEvent | null>(null);

  // New Standby Form
  const [cause, setCause] = useState('Demora en Firma de Permiso SIHO / Permiso de Trabajo en Caliente');
  const [equipment, setEquipment] = useState('Grúa Telescópica 80T + Camión Chuto Vacuum');
  const [personnelCount, setPersonnelCount] = useState(12);
  const [hours, setHours] = useState(6);
  const [ratePerHour, setRatePerHour] = useState(350);

  // MOC Requests List
  const [mocList, setMocList] = useState<MocRequest[]>([]);

  // AI Letter Generator State
  const [letterRecipient, setLetterRecipient] = useState('Ing. Pedro Escalona - Gerente de Obras PDVSA / Client Supervisor');
  const [letterContractRef, setLetterContractRef] = useState('Contrato N° IC360-2026-CT-049');
  const [generatedLetter, setGeneratedLetter] = useState('');

  useEffect(() => {
    const defaultEvents: StandbyEvent[] = [
      {
        id: 'STB-001',
        date: '2026-07-20',
        cause: 'Falta de liberación de línea por purgado de gas por parte de Operaciones Cliente',
        responsibleParty: 'Cliente / Supervisor',
        equipmentAffected: 'Planta de Soldadura Diésel + Camión Grúa 15T',
        personnelAffectedCount: 8,
        hoursDelayed: 7.5,
        standbyRatePerHour: 280,
        totalCostUsd: 2100,
        status: 'Notificado a Cliente'
      },
      {
        id: 'STB-002',
        date: '2026-07-22',
        cause: 'Retraso de 5 horas en inspección de gasotester por falta de inspector SIHO del cliente',
        responsibleParty: 'Cliente / Supervisor',
        equipmentAffected: 'Cuadrilla de Izamiento y Pipping',
        personnelAffectedCount: 14,
        hoursDelayed: 5.0,
        standbyRatePerHour: 420,
        totalCostUsd: 2100,
        status: 'Reclamo Formal Presentado'
      }
    ];

    const defaultMoc: MocRequest[] = [
      {
        id: 'MOC-001',
        code: 'MOC-IC360-2026-01',
        title: 'Modificación de trazado de tubería 12" por interferencia no mapeada',
        description: 'Cruce no registrado con línea de fibra óptica y tubería de agua servida de 6". Requiere desvío de 45 metros adicionales.',
        requestedBy: 'Ing. Carlos Mendoza (Inspector de Campo)',
        costImpactUsd: 18500,
        timeImpactDays: 4,
        status: 'Pendiente Aprobación Cliente',
        date: '2026-07-21'
      },
      {
        id: 'MOC-002',
        code: 'MOC-IC360-2026-02',
        title: 'Cambio de especificación de recubrimiento epóxico por alta salinidad',
        description: 'Aplicación de sistema de pintura tricapa polietileno en lugar de epoxi simple.',
        requestedBy: 'Ing. María Rivas (QA/QC)',
        costImpactUsd: 9200,
        timeImpactDays: 2,
        status: 'Aprobada',
        date: '2026-07-18'
      }
    ];

    setEvents(defaultEvents);
    setSelectedEvent(defaultEvents[0]);
    setMocList(defaultMoc);
  }, []);

  const handleAddEvent = () => {
    const total = hours * ratePerHour;
    const newEv: StandbyEvent = {
      id: `STB-00${events.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      cause,
      responsibleParty: 'Cliente / Supervisor',
      equipmentAffected: equipment,
      personnelAffectedCount: personnelCount,
      hoursDelayed: hours,
      standbyRatePerHour: ratePerHour,
      totalCostUsd: total,
      status: 'Registrado'
    };
    setEvents([newEv, ...events]);
    setSelectedEvent(newEv);
  };

  const handleGenerateLetter = () => {
    if (!selectedEvent) return;

    const letter = `
CONTRATISTA DE OBRA INDUSTRIAL
SISTEMA DE CONTROL IC360
Fecha: ${new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })}

CARTA REF: IC360-NOT-STB-${selectedEvent.id}-2026

Atención:
${letterRecipient}

ASUNTO: NOTIFICACIÓN FORMAL DE STAND-BY / TIEMPO MUERTO NO IMPUTABLE A LA CONTRATISTA
REFERENCIA CONTRACTUAL: ${letterContractRef}

Estimados Señores:

Por medio de la presente, nos dirigimos a ustedes en relación con los trabajos ejecutados bajo el contrato de la referencia en el proyecto "${currentProject?.name || 'Obra Industrial en Ejecución'}".

Hacemos de su conocimiento formal que en fecha ${selectedEvent.date}, las actividades de campo sufrieron una paralización no imputable a la Contratista, debido a la siguiente causa atribuible a la supervisión / cliente:

CAUSA DEL STAND-BY:
"${selectedEvent.cause}"

IMPACTO RECURSOS Y RECLAMO FINANCIERO:
- Equipos Paralizados: ${selectedEvent.equipmentAffected}
- Personal Afectado: ${selectedEvent.personnelAffectedCount} trabajadores en sitio
- Horas de Inactividad: ${selectedEvent.hoursDelayed} Horas
- Tarifa de Stand-by Aplicable: ${selectedEvent.standbyRatePerHour} USD/Hora
- COSTO TOTAL DEL RECLAMO: $${selectedEvent.totalCostUsd.toLocaleString()} USD

En virtud de lo dispuesto en las Cláusulas Contractuales de Paradas Involuntarias y Caso Fortuito / Retraso Atribuible al Contratante, solicitamos formalmente:
1. Reconocimiento y aprobación del monto de $${selectedEvent.totalCostUsd.toLocaleString()} USD en la próxima valuación.
2. Extensión del plazo de ejecución por un total de ${selectedEvent.hoursDelayed} horas operativas.

Agradeciendo su pronta atención y firma de recibido de la presente notificación.

Atentamente,

___________________________________
GERENCIA DE PROYECTOS Y OBRAS
CONTRATISTA DE OBRA / INDUSTRIAL CONTROL 360
    `.trim();

    setGeneratedLetter(letter);
    setActiveTab('letterGenerator');
  };

  const totalStandbyClaimUsd = events.reduce((sum, e) => sum + e.totalCostUsd, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-line p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-500 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Clock size={16} /> Módulo Prioritario 4 · Protección Financiera & Gestión de Cambios
          </div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Gestión de Standby, Tiempos Muertos & MOC</h1>
          <p className="text-ink-soft text-sm mt-1 font-medium">
            Registro blindado de tiempos muertos no imputables, redacción de cartas legales con IA y control de Órdenes de Cambio.
          </p>
        </div>
        <div className="bg-brand-500/10 border border-brand-500/20 p-3.5 rounded-xl text-right">
          <span className="text-[10px] font-mono text-brand-500 dark:text-emerald-400 uppercase block font-bold">Total Reclamos Acumulados</span>
          <span className="text-2xl font-black font-mono text-brand-500 dark:text-emerald-400">${totalStandbyClaimUsd.toLocaleString()} USD</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border border-line bg-surface rounded-2xl p-1 shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('standby')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'standby' ? 'bg-brand-500 text-white shadow-xs' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
          }`}
        >
          <Clock size={16} /> Registro de Tiempos Muertos (Stand-by)
        </button>
        <button
          onClick={() => setActiveTab('letterGenerator')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'letterGenerator' ? 'bg-brand-500 text-white shadow-xs' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
          }`}
        >
          <Sparkles size={16} /> Generador IA de Cartas Legales
        </button>
        <button
          onClick={() => setActiveTab('moc')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'moc' ? 'bg-brand-500 text-white shadow-xs' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
          }`}
        >
          <Layers size={16} /> Management of Change (MOC)
        </button>
      </div>

      {/* TAB 1: STANDBY REGISTRATION */}
      {activeTab === 'standby' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Standby Event Form */}
          <div className="lg:col-span-1 bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Plus size={18} className="text-brand-500" />
              Registrar Evento de Stand-by
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Causa de la Inactividad</label>
                <textarea
                  rows={2}
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-medium text-ink outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Equipos Afectados</label>
                <input
                  type="text"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-medium text-ink outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Personal Afectado</label>
                  <input
                    type="number"
                    value={personnelCount}
                    onChange={(e) => setPersonnelCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-mono font-medium text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Horas Retraso</label>
                  <input
                    type="number"
                    step="0.5"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-mono font-medium text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Tarifa Horaria Stand-by (USD/h)</label>
                <input
                  type="number"
                  value={ratePerHour}
                  onChange={(e) => setRatePerHour(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-mono font-medium text-ink outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="p-3 bg-surface-2 border border-line text-ink rounded-xl flex justify-between items-center font-mono">
                <span className="text-[11px] text-ink-soft font-bold">Total Reclamo:</span>
                <span className="text-lg font-black text-brand-500 dark:text-emerald-400">${(hours * ratePerHour).toLocaleString()} USD</span>
              </div>

              <button
                onClick={handleAddEvent}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Guardar Evento en Bitácora
              </button>
            </div>
          </div>

          {/* List & Detail */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-ink">Histórico de Reclamos Stand-by</h2>
              
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedEvent?.id === ev.id
                        ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/20'
                        : 'border-line bg-surface hover:bg-surface-2'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-ink">{ev.id}</span>
                          <span className="text-[10px] bg-surface-2 px-2 py-0.5 rounded text-ink-soft font-bold">{ev.date}</span>
                        </div>
                        <p className="text-xs text-ink font-semibold mt-1">{ev.cause}</p>
                      </div>
                      <span className="text-sm font-black font-mono text-brand-500 dark:text-emerald-400 shrink-0">
                        ${ev.totalCostUsd.toLocaleString()} USD
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-line flex justify-between items-center text-[11px] text-ink-soft">
                      <span>Equipos: {ev.equipmentAffected} ({ev.hoursDelayed}h)</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                          handleGenerateLetter();
                        }}
                        className="flex items-center gap-1 text-ink font-bold hover:text-brand-500 cursor-pointer"
                      >
                        <Sparkles size={12} className="text-brand-500" /> Redactar Carta IA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI LETTER GENERATOR */}
      {activeTab === 'letterGenerator' && (
        <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs space-y-6">
          <div className="flex justify-between items-center border-b border-line pb-4">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Sparkles size={18} className="text-brand-500" /> Redactor IA de Notificación de Reclamo Stand-by
              </h2>
              <p className="text-xs text-ink-soft">Documento formal redactado con respaldo contractual para el cliente.</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedLetter);
                alert('Carta copiada al portapapeles.');
              }}
              className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              Copiar Carta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Destinatario / Representante Cliente</label>
              <input
                type="text"
                value={letterRecipient}
                onChange={(e) => setLetterRecipient(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-medium outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Referencia Contrato</label>
              <input
                type="text"
                value={letterContractRef}
                onChange={(e) => setLetterContractRef(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-medium outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="bg-surface-2 text-ink p-6 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed border border-line shadow-inner">
            {generatedLetter || 'Selecciona un evento de Stand-by y presiona "Redactar Carta IA".'}
          </div>
        </div>
      )}

      {/* TAB 3: MANAGEMENT OF CHANGE (MOC) */}
      {activeTab === 'moc' && (
        <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs space-y-6">
          <div className="flex justify-between items-center border-b border-line pb-4">
            <div>
              <h2 className="text-lg font-bold text-ink">Control de Órdenes de Cambio (MOC)</h2>
              <p className="text-xs text-ink-soft">Gestión de variaciones técnicas y de alcance aprobadas antes de su ejecución.</p>
            </div>
          </div>

          <div className="space-y-4">
            {mocList.map((m) => (
              <div key={m.id} className="p-4 border border-line rounded-xl space-y-2 bg-surface-2/40">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold bg-surface-2 text-ink px-2 py-0.5 rounded border border-line">{m.code}</span>
                    <h3 className="text-sm font-bold text-ink mt-1">{m.title}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    m.status === 'Aprobada' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  }`}>
                    {m.status}
                  </span>
                </div>

                <p className="text-xs text-ink-soft leading-relaxed">{m.description}</p>

                <div className="flex justify-between items-center pt-2 border-t border-line text-xs font-mono">
                  <span className="text-ink-soft">Impacto Costo: <strong className="text-ink">${m.costImpactUsd.toLocaleString()} USD</strong></span>
                  <span className="text-ink-soft">Impacto Tiempo: <strong className="text-ink">+{m.timeImpactDays} días</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
