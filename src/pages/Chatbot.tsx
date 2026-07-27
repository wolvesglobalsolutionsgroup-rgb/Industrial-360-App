import { useState, useRef, useEffect } from 'react';
import { callGeminiProxy } from '../lib/geminiProxy';
import { Send, Bot, User, Loader2, Paperclip, FileText, X } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hola, soy tu asistente de obra. Puedo ayudarte a generar informes técnicos, analizar datos de avance o responder preguntas sobre normativas de construcción. Puedes adjuntar documentos (PDF, TXT) para que los analice.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ file: File, base64: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo es muy grande. Máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setAttachedFile({ file, base64: base64String });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (!input.trim() && !attachedFile) return;
    if (isLoading) return;

    const userMsg = input.trim() || 'Analiza este documento.';
    setInput('');
    
    // Add user message to UI
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: attachedFile ? `[Documento adjunto: ${attachedFile.file.name}]\n${userMsg}` : userMsg 
    }]);
    
    setIsLoading(true);

    try {
      // Build contents array
      const contents: any[] = [];
      
      // Add previous context (last 6 messages to keep it lightweight)
      const contextMessages = messages.slice(-6).map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.text}`).join('\n\n');
      
      let prompt = `Eres un ingeniero civil experto y asistente de gestión de obras. 
      Historial de conversación:\n${contextMessages}\n\nUsuario: ${userMsg}`;

      if (attachedFile) {
        contents.push({
          inlineData: {
            data: attachedFile.base64,
            mimeType: attachedFile.file.type
          }
        });
        prompt += "\n\nPor favor, responde basándote en el documento adjunto.";
      }

      contents.push(prompt);

      const response = await callGeminiProxy({
        model: 'gemini-3.6-flash',
        contents: contents,
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
      setAttachedFile(null); // Clear attachment after sending
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Lo siento, hubo un error al procesar tu solicitud o el documento es demasiado complejo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <header className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Asistente IA de Obra</h2>
            <p className="text-sm text-gray-500">Gemini 3.1 Pro + RAG</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <div className="prose prose-sm prose-emerald max-w-none">
                  <Markdown>{msg.text}</Markdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
              <Bot size={18} />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">Analizando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto">
          {attachedFile && (
            <div className="mb-3 flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg w-fit">
              <FileText size={16} />
              <span className="text-sm font-medium truncate max-w-[200px]">{attachedFile.file.name}</span>
              <button onClick={() => setAttachedFile(null)} className="p-1 hover:bg-blue-100 rounded-full transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input 
              type="file" 
              accept=".pdf,.txt" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
              title="Adjuntar documento (PDF, TXT)"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe tu consulta o pide un análisis del documento..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !attachedFile)}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl transition-colors flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
