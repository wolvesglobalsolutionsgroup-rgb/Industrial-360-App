import { useState, useRef } from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { callGeminiProxy } from '../lib/geminiProxy';

export default function VoiceChat() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setTranscript('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone error:', error);
      alert('No se pudo acceder al micrófono.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const response = await callGeminiProxy({
          model: 'gemini-3.6-flash',
          contents: [
            { text: 'Eres un ingeniero civil experto y asistente de obra. Responde a la consulta de voz del usuario de manera concisa y profesional.' },
            { inlineData: { data: base64Audio, mimeType: 'audio/webm' } }
          ]
        });

        if (response.text) {
          setTranscript(response.text);
          // Play TTS audio response
          try {
            const ttsRes = await callGeminiProxy({
              model: 'gemini-3.1-flash-tts-preview',
              contents: [{ parts: [{ text: response.text }] }],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                }
              }
            });
            const audioData = ttsRes.raw?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              const audio = new Audio(`data:audio/wav;base64,${audioData}`);
              await audio.play();
            }
          } catch (ttsErr) {
            console.warn('TTS output warning:', ttsErr);
          }
        }
      };
    } catch (error) {
      console.error('Error processing voice query:', error);
      setTranscript('Error al procesar la consulta de voz.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] bg-surface rounded-2xl border border-line shadow-sm p-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-ink tracking-tight mb-4">Asistente de Voz en Obra</h1>
        <p className="text-ink-soft max-w-md mx-auto font-medium">
          Habla directamente con la IA para reportar avances, consultar normativas o pedir cálculos rápidos sin usar las manos.
        </p>
      </div>

      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 bg-brand-500 rounded-full animate-ping opacity-20 scale-150"></div>
        )}
        
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer ${
            isRecording 
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30' 
              : 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/30'
          }`}
        >
          {isProcessing ? (
            <Loader2 size={48} className="animate-spin" />
          ) : isRecording ? (
            <MicOff size={48} />
          ) : (
            <Mic size={48} />
          )}
        </button>
      </div>

      <div className="mt-8 text-center max-w-lg">
        {isProcessing ? (
          <p className="text-brand-500 dark:text-emerald-400 font-bold animate-pulse">Procesando audio y consultando al servidor...</p>
        ) : isRecording ? (
          <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
            <Volume2 size={20} className="animate-pulse" />
            Grabando... Toca el botón para detener y procesar.
          </div>
        ) : (
          <p className="text-ink-soft font-medium">Toca el micrófono para hablar con el asistente</p>
        )}

        {transcript && (
          <div className="mt-6 p-4 bg-surface-2 border border-line rounded-xl text-left text-sm text-ink leading-relaxed">
            <span className="font-bold text-brand-500 dark:text-emerald-400 block mb-1">Respuesta del Asistente:</span>
            {transcript}
          </div>
        )}
      </div>
    </div>
  );
}
