import { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, FileText, Loader2, Sparkles, X, Paperclip, Mic, Square, Volume2, Settings2 } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel, Modality } from '@google/genai';

export default function ProjectBrain() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: 'Hola. Soy el Cerebro del Proyecto. Puedo analizar planos, especificaciones técnicas, cuadros de Excel y ayudarte a gestionar el proyecto, crear partidas, hacer estimaciones o resolver dudas. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHighThinking, setIsHighThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key no configurada");

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            { text: 'Transcribe el siguiente audio del usuario. Solo devuelve el texto transcrito.' },
            { inlineData: { data: base64Audio, mimeType: 'audio/webm' } }
          ]
        });
        
        if (response.text) {
          setQuery(prev => prev ? `${prev} ${response.text}` : response.text);
        }
      };
    } catch (error) {
      console.error("Error transcribing audio:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const playTTS = async (text: string) => {
    if (isPlayingAudio) {
      audioPlayerRef.current?.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsPlayingAudio(true);
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key no configurada");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioUrl = `data:audio/wav;base64,${base64Audio}`;
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;
        audio.onended = () => setIsPlayingAudio(false);
        await audio.play();
      } else {
        setIsPlayingAudio(false);
      }
    } catch (error) {
      console.error("Error playing TTS:", error);
      setIsPlayingAudio(false);
    }
  };

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
      Si el usuario menciona normas de PDVSA, especificaciones o Excel, asume que tienes acceso a esa información en el contexto general y responde con autoridad técnica.
      
      Consulta del usuario: "${userQuery}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: isHighThinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined,
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsHighThinking(!isHighThinking)}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full transition-colors ${
              isHighThinking ? 'bg-purple-600 text-white' : 'bg-emerald-800 text-emerald-200 hover:bg-emerald-700'
            }`}
            title="Modo de Pensamiento Profundo (Ideal para cálculos complejos o análisis de normativas)"
          >
            <Settings2 size={14} />
            {isHighThinking ? 'Pensamiento Profundo: ON' : 'Pensamiento Profundo: OFF'}
          </button>
          <div className="flex items-center gap-2 text-xs bg-emerald-800 px-3 py-1.5 rounded-full text-emerald-200">
            <Sparkles size={14} />
            Gemini 3.1 Pro
          </div>
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                    <BrainCircuit size={16} />
                    Cerebro IA
                  </div>
                  <button
                    onClick={() => playTTS(msg.content)}
                    className={`p-1.5 rounded-lg transition-colors ${isPlayingAudio ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:bg-gray-100 hover:text-emerald-600'}`}
                    title={isPlayingAudio ? "Detener audio" : "Escuchar respuesta"}
                  >
                    {isPlayingAudio ? <Square size={14} /> : <Volume2 size={14} />}
                  </button>
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
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-xl transition-colors shrink-0 ${
              isRecording 
                ? 'bg-red-100 text-red-600 animate-pulse' 
                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={isRecording ? "Detener grabación" : "Dictar consulta"}
          >
            {isRecording ? <Square size={20} /> : <Mic size={20} />}
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
