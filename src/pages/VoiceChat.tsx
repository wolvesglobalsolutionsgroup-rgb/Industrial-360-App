import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

export default function VoiceChat() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const connect = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "Eres un ingeniero civil experto y asistente de obra. Responde de manera profesional, concisa y estructurada a las consultas por voz.",
        },
        callbacks: {
          onopen: async () => {
            setIsConnected(true);
            setIsConnecting(false);
            await startAudioCapture(sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              playAudio(base64Audio);
            }
          },
          onclose: () => {
            setIsConnected(false);
            stopAudioCapture();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setIsConnected(false);
            stopAudioCapture();
          }
        }
      });
      
      setSession(sessionPromise);

    } catch (error) {
      console.error("Connection error:", error);
      setIsConnecting(false);
    }
  };

  const startAudioCapture = async (sessionPromise: any) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      streamRef.current = stream;
      
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32Array to Int16Array
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        
        // Convert to base64
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true); // true for little-endian
        }
        
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
        sessionPromise.then((s: any) => {
          s.sendRealtimeInput({
            audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
          });
        });
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopAudioCapture = () => {
    if (processorRef.current && sourceRef.current) {
      sourceRef.current.disconnect();
      processorRef.current.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const disconnect = () => {
    if (session) {
      session.then((s: any) => s.close());
    }
    stopAudioCapture();
    setIsConnected(false);
  };

  const playAudio = async (base64Audio: string) => {
    if (!audioContextRef.current) return;
    
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // The audio from Gemini Live is 24kHz PCM
      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">Asistente de Voz en Obra</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Habla directamente con la IA para reportar avances, consultar normativas o pedir cálculos rápidos sin usar las manos.
        </p>
      </div>

      <div className="relative">
        {/* Pulsing background when connected */}
        {isConnected && (
          <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20 scale-150"></div>
        )}
        
        <button
          onClick={isConnected ? disconnect : connect}
          disabled={isConnecting}
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-xl ${
            isConnected 
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
          }`}
        >
          {isConnecting ? (
            <Loader2 size={48} className="animate-spin" />
          ) : isConnected ? (
            <MicOff size={48} />
          ) : (
            <Mic size={48} />
          )}
        </button>
      </div>

      <div className="mt-12 text-center">
        {isConnecting ? (
          <p className="text-emerald-600 font-medium animate-pulse">Conectando con el asistente...</p>
        ) : isConnected ? (
          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <Volume2 size={20} className="animate-pulse" />
            Escuchando... Habla ahora.
          </div>
        ) : (
          <p className="text-gray-500 font-medium">Toca el micrófono para empezar</p>
        )}
      </div>
    </div>
  );
}
