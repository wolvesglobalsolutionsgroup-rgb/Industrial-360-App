import { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, FileText, Loader2, Sparkles, X, Paperclip } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function ProjectBrain() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: 'Hola. Soy el Cerebro del Proyecto. Puedo analizar planos, especificaciones técnicas, cuadros de Excel y ayudarte a gestionar el proyecto, crear partidas, hacer estimaciones o resolver dudas. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAskBrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userQuery = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsProcessing(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("La API Key de Gemini no está configurada.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Eres el "Cerebro Operativo" de un proyecto de construcción. 
      El usuario te está haciendo una consulta sobre la gestión del proyecto.
      Tu objetivo es ayudar a simplificar el control de avance, planificación, presupuesto, y gestión documental.
      Si el usuario menciona planos, especificaciones o Excel, asume que tienes acceso a esa información en el contexto general (aunque en esta demo no se suban los archivos directamente, responde como si pudieras procesar esa información y guíalo sobre cómo estructurar las partidas, hacer cómputos métricos o estimaciones).
      
      Consulta del usuario: "${userQuery}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      setMessages(prev => [...prev, { role: 'ai', content: response.text || 'No pude generar una respuesta.' }]);
    } catch (error: any) {
      console.error("Error asking Project Brain:", error);
      setMessages(prev => [...prev, { role: 'ai', content: `Ocurrió un error: ${error.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-emerald-900 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-800 rounded-xl flex items-center justify-center">
            <BrainCircuit size={24} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Cerebro del Proyecto</h1>
            <p className="text-emerald-300 text-xs">Asistente IA para Gestión y Análisis Documental</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-emerald-800 px-3 py-1.5 rounded-full text-emerald-200">
          <Sparkles size={14} />
          Gemini 3.1 Pro
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-sm' 
                : 'bg-white border border-gray-200 text-gray-800 shadow-sm rounded-tl-sm'
            }`}>
              {msg.role === 'ai' && (
                <div className="flex items-center gap-2 mb-2 text-emerald-700 font-semibold text-sm">
                  <BrainCircuit size={16} />
                  Cerebro IA
                </div>
              )}
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center gap-3 text-gray-500">
              <Loader2 size={18} className="animate-spin text-emerald-600" />
              <span className="text-sm">Analizando proyecto y documentos...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 shrink-0">
        <form onSubmit={handleAskBrain} className="relative flex items-end gap-2">
          <button 
            type="button"
            className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors shrink-0"
            title="Adjuntar documento (Plano, Excel, Spec)"
          >
            <Paperclip size={20} />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: Extrae las partidas necesarias del plano estructural adjunto o calcula el cómputo métrico..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAskBrain(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || isProcessing}
            className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
          >
            <Send size={20} />
          </button>
        </form>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button type="button" onClick={() => setQuery("¿Cuáles son las partidas críticas según las especificaciones técnicas?")} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors">
            Analizar Especificaciones
          </button>
          <button type="button" onClick={() => setQuery("Ayúdame a hacer el cómputo métrico de la losa de fundación.")} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors">
            Cómputos Métricos
          </button>
          <button type="button" onClick={() => setQuery("Genera un borrador de valuación para el avance de esta semana.")} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors">
            Generar Valuación
          </button>
        </div>
      </div>
    </div>
  );
}
