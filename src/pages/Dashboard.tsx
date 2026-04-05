import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { HardHat, TrendingUp, DollarSign, AlertCircle, Download, FileText, CloudRain, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'motion/react';

// Minimalist 3D Architectural Grid
function ArchitecturalGrid() {
  const gridRef = useRef<any>(null);
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      gridRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1 + 0.5;
    }
  });

  return (
    <group ref={gridRef}>
      <gridHelper args={[20, 20, '#10b981', '#e5e7eb']} position={[0, -2, 0]} />
      <gridHelper args={[20, 20, '#10b981', '#e5e7eb']} position={[0, 2, 0]} />
      {/* Some abstract pillars */}
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 4) * 5, 0, Math.sin(i * Math.PI / 4) * 5]}>
          <boxGeometry args={[0.2, 4, 0.2]} />
          <meshStandardMaterial color="#f3f4f6" opacity={0.5} transparent />
        </mesh>
      ))}
    </group>
  );
}

const progressData = [
  { name: 'Sem 1', planificado: 10, real: 8 },
  { name: 'Sem 2', planificado: 25, real: 22 },
  { name: 'Sem 3', planificado: 40, real: 35 },
  { name: 'Sem 4', planificado: 55, real: 50 },
  { name: 'Sem 5', planificado: 70, real: 68 },
];

const budgetData = [
  { name: 'Materiales', presupuesto: 50000, gastado: 45000 },
  { name: 'Mano de Obra', presupuesto: 30000, gastado: 32000 },
  { name: 'Equipos', presupuesto: 15000, gastado: 12000 },
  { name: 'Otros', presupuesto: 5000, gastado: 4000 },
];

export default function Dashboard() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [weatherContext, setWeatherContext] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  useEffect(() => {
    const fetchWeatherContext = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: '¿Cuál es el clima actual y pronóstico para los próximos 3 días en la ciudad principal de mi ubicación? Responde en 2 oraciones indicando cómo podría afectar labores de construcción al aire libre.',
          config: {
            tools: [{ googleSearch: {} }]
          }
        });
        setWeatherContext(response.text);
      } catch (error) {
        console.error("Error fetching weather context:", error);
        setWeatherContext("No se pudo obtener el pronóstico del clima.");
      } finally {
        setIsLoadingWeather(false);
      }
    };
    fetchWeatherContext();
  }, []);

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('informe-tecnico-obrasync.pdf');
    } catch (error) {
      console.error("Error exporting PDF", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative" 
      ref={dashboardRef}
    >
      <div className="absolute inset-0 -z-10 h-[300px] overflow-hidden rounded-3xl bg-gradient-to-b from-gray-50 to-transparent opacity-50" data-html2canvas-ignore>
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <ArchitecturalGrid />
        </Canvas>
      </div>

      <header className="mb-8 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Panel de Control</h1>
          <p className="text-gray-500 mt-1">Resumen del proyecto activo: Torre Esmeralda</p>
        </div>
        <button 
          onClick={exportToPDF}
          disabled={isExporting}
          data-html2canvas-ignore
          className="w-full sm:w-auto bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          {isExporting ? <FileText size={20} className="animate-pulse" /> : <Download size={20} />}
          {isExporting ? 'Generando PDF...' : 'Exportar Informe'}
        </button>
      </header>

      {/* Weather Context Widget */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
          <CloudRain size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Contexto Climático (IA)</h3>
          {isLoadingWeather ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" /> Analizando condiciones meteorológicas...
            </div>
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed">{weatherContext}</p>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Avance Físico</h3>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">68%</span>
            <span className="text-sm text-red-500 font-medium">-2% plan</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Presupuesto Ejecutado</h3>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">$93k</span>
            <span className="text-sm text-gray-500 font-medium">de $100k</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Personal Activo</h3>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <HardHat size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">42</span>
            <span className="text-sm text-gray-500 font-medium">trabajadores</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Alertas</h3>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">3</span>
            <span className="text-sm text-gray-500 font-medium">pendientes</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Avance Planificado vs Real</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="planificado" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" name="Planificado %" />
                <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={3} name="Real %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Presupuesto vs Gastos</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Legend />
                <Bar dataKey="presupuesto" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Presupuesto ($)" />
                <Bar dataKey="gastado" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Gastado ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
