import { useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, Ruler, ArrowRightLeft, Droplets, Box, Layers, Hammer } from 'lucide-react';

export default function EngineeringTools() {
  const [activeTab, setActiveTab] = useState<'conversions' | 'computations'>('computations');

  // Conversion State
  const [convValue, setConvValue] = useState<number>(1);
  const [convType, setConvType] = useState<'length' | 'weight' | 'volume'>('length');
  const [convFrom, setConvFrom] = useState<string>('m');
  const [convTo, setConvTo] = useState<string>('ft');

  // Computation State
  const [compType, setCompType] = useState<'concrete' | 'bricks' | 'paint'>('concrete');
  const [compLength, setCompLength] = useState<number>(0);
  const [compWidth, setCompWidth] = useState<number>(0);
  const [compHeight, setCompHeight] = useState<number>(0);

  const conversionRates = {
    length: { m: 1, ft: 3.28084, in: 39.3701, cm: 100, km: 0.001, mi: 0.000621371 },
    weight: { kg: 1, lb: 2.20462, g: 1000, oz: 35.274, ton: 0.001 },
    volume: { l: 1, gal: 0.264172, m3: 0.001, ft3: 0.0353147 }
  };

  const handleConversion = () => {
    const rates = conversionRates[convType] as any;
    if (!rates[convFrom] || !rates[convTo]) return 0;
    const baseValue = convValue / rates[convFrom];
    return (baseValue * rates[convTo]).toFixed(4);
  };

  const calculateComputations = () => {
    if (compType === 'concrete') {
      // Volume = L * W * H
      const volume = compLength * compWidth * compHeight;
      // Typical mix 1:2:3 (Cement:Sand:Gravel)
      // 1m3 concrete = ~350kg cement, 0.5m3 sand, 0.8m3 gravel
      return {
        volume: volume.toFixed(2),
        cement: (volume * 350).toFixed(0), // kg
        sand: (volume * 0.5).toFixed(2), // m3
        gravel: (volume * 0.8).toFixed(2) // m3
      };
    } else if (compType === 'bricks') {
      // Area = L * H
      const area = compLength * compHeight;
      // Assume standard brick 25x12x6 cm with 1.5cm mortar
      // ~38 bricks per m2
      const bricks = Math.ceil(area * 38);
      const mortar = (area * 0.025).toFixed(2); // m3 of mortar
      return {
        area: area.toFixed(2),
        bricks: bricks,
        mortar: mortar
      };
    } else if (compType === 'paint') {
      // Area = L * H
      const area = compLength * compHeight;
      // Assume 1 gallon covers ~35 m2 (1 coat)
      const gallons = (area / 35).toFixed(2);
      return {
        area: area.toFixed(2),
        gallons: gallons
      };
    }
    return null;
  };

  const compResult = calculateComputations();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Herramientas de Ingeniería</h1>
        <p className="text-gray-500 mt-1">Conversiones de campo y cálculos de cómputos métricos</p>
      </header>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('computations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'computations' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calculator size={16} />
          Cómputos Métricos
        </button>
        <button
          onClick={() => setActiveTab('conversions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'conversions' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowRightLeft size={16} />
          Conversiones
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'computations' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Ruler className="text-emerald-600" />
                  Calculadora de Materiales
                </h2>
              </div>
              <div className="p-6">
                <div className="flex gap-4 mb-6">
                  {[
                    { id: 'concrete', label: 'Concreto', icon: Box },
                    { id: 'bricks', label: 'Mampostería', icon: Layers },
                    { id: 'paint', label: 'Pintura', icon: Droplets }
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setCompType(type.id as any)}
                        className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          compType === type.id 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                            : 'border-gray-100 hover:border-gray-200 text-gray-600'
                        }`}
                      >
                        <Icon size={24} />
                        <span className="font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Largo (m)</label>
                    <input 
                      type="number" 
                      value={compLength || ''} 
                      onChange={(e) => setCompLength(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  {compType === 'concrete' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ancho (m)</label>
                      <input 
                        type="number" 
                        value={compWidth || ''} 
                        onChange={(e) => setCompWidth(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {compType === 'concrete' ? 'Espesor/Alto (m)' : 'Alto (m)'}
                    </label>
                    <input 
                      type="number" 
                      value={compHeight || ''} 
                      onChange={(e) => setCompHeight(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {compResult && (compLength > 0 && compHeight > 0) && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Resultados Estimados</h3>
                    
                    {compType === 'concrete' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Volumen Total</p>
                          <p className="text-xl font-bold text-gray-900">{(compResult as any).volume} <span className="text-sm font-normal text-gray-500">m³</span></p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Cemento</p>
                          <p className="text-xl font-bold text-gray-900">{(compResult as any).cement} <span className="text-sm font-normal text-gray-500">kg</span></p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Arena</p>
                          <p className="text-xl font-bold text-gray-900">{(compResult as any).sand} <span className="text-sm font-normal text-gray-500">m³</span></p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Piedra Picada</p>
                          <p className="text-xl font-bold text-gray-900">{(compResult as any).gravel} <span className="text-sm font-normal text-gray-500">m³</span></p>
                        </div>
                      </div>
                    )}

                    {compType === 'bricks' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Área Total</p>
                          <p className="text-xl font-bold text-gray-900">{(compResult as any).area} <span className="text-sm font-normal text-gray-500">m²</span></p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Bloques (Aprox)</p>
                          <p className="text-xl font-bold text-gray-900">{(compResult as any).bricks} <span className="text-sm font-normal text-gray-500">und</span></p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Mortero</p>
                          <p className="text-xl font-bold text-gray-900">{(compResult as any).mortar} <span className="text-sm font-normal text-gray-500">m³</span></p>
                        </div>
                      </div>
                    )}

                    {compType === 'paint' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Área Total</p>
                          <p className="text-xl font-bold text-gray-900">{(compResult as any).area} <span className="text-sm font-normal text-gray-500">m²</span></p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Pintura (1 Mano)</p>
                          <p className="text-xl font-bold text-gray-900">{(compResult as any).gallons} <span className="text-sm font-normal text-gray-500">gal</span></p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'conversions' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ArrowRightLeft className="text-emerald-600" />
                  Conversor de Unidades
                </h2>
              </div>
              <div className="p-6">
                <div className="flex gap-4 mb-6">
                  {['length', 'weight', 'volume'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setConvType(type as any);
                        setConvFrom(Object.keys(conversionRates[type as keyof typeof conversionRates])[0]);
                        setConvTo(Object.keys(conversionRates[type as keyof typeof conversionRates])[1]);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                        convType === type 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {type === 'length' ? 'Longitud' : type === 'weight' ? 'Peso' : 'Volumen'}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex w-full sm:flex-1 gap-2">
                    <input 
                      type="number" 
                      value={convValue} 
                      onChange={(e) => setConvValue(Number(e.target.value))}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-medium min-w-0"
                    />
                    <select 
                      value={convFrom} 
                      onChange={(e) => setConvFrom(e.target.value)}
                      className="w-24 px-2 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                    >
                      {Object.keys(conversionRates[convType]).map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="text-gray-400 rotate-90 sm:rotate-0">
                    <ArrowRightLeft size={20} />
                  </div>
                  
                  <div className="flex w-full sm:flex-1 gap-2">
                    <div className="flex-1 px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-lg font-bold text-gray-900 min-w-0 overflow-hidden text-ellipsis">
                      {handleConversion()}
                    </div>
                    <select 
                      value={convTo} 
                      onChange={(e) => setConvTo(e.target.value)}
                      className="w-24 px-2 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                    >
                      {Object.keys(conversionRates[convType]).map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info Area */}
        <div className="space-y-6">
          <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Hammer size={120} />
            </div>
            <h3 className="text-lg font-semibold mb-2 relative z-10">Fórmulas Estándar</h3>
            <p className="text-emerald-100 text-sm mb-4 relative z-10">
              Los cálculos utilizan proporciones estándar de la industria. Para dosificaciones exactas, consulte las especificaciones técnicas del proyecto.
            </p>
            <ul className="space-y-3 text-sm text-emerald-50 relative z-10">
              <li className="flex justify-between border-b border-emerald-800 pb-2">
                <span>Concreto (1:2:3)</span>
                <span className="font-mono">350kg Cemento/m³</span>
              </li>
              <li className="flex justify-between border-b border-emerald-800 pb-2">
                <span>Mampostería</span>
                <span className="font-mono">38 bloques/m²</span>
              </li>
              <li className="flex justify-between">
                <span>Pintura</span>
                <span className="font-mono">35m²/galón</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
