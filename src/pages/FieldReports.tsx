import { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Users, Clock, Save, FileText, CheckCircle2, Mic, Square, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { callGeminiProxy } from '../lib/geminiProxy';
import { collection, query, onSnapshot, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';
import { queueOfflineOperation } from '../lib/offlineSync';

export default function FieldReports() {
  const { currentProject } = useProject();
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState('Soleado');
  const [personnelCount, setPersonnelCount] = useState(0);
  const [notes, setNotes] = useState('');
  const [slumpTest, setSlumpTest] = useState('');
  const [temperature, setTemperature] = useState('');
  const [equipmentSerial, setEquipmentSerial] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // New features state
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [tasks, setTasks] = useState<any[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Error getting location:", err)
      );
    }

    if (!currentProject) {
      setTasks([]);
      return;
    }

    // Fetch tasks for correlation
    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', currentProject.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
    });
    return () => unsubscribe();
  }, [currentProject]);

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
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const response = await callGeminiProxy({
          model: 'gemini-2.5-flash',
          contents: [
            { text: 'Transcribe este reporte de campo dictado por el ingeniero. Solo devuelve el texto transcrito, sin comentarios adicionales.' },
            { inlineData: { data: base64Audio, mimeType: 'audio/webm' } }
          ]
        });
        
        setNotes(prev => prev ? `${prev}\n${response.text}` : response.text || '');
      };
    } catch (error) {
      console.error("Error transcribing audio:", error);
      alert("Error al transcribir el audio.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsAnalyzingImage(true);
    try {
      const base64Reader = new FileReader();
      base64Reader.readAsDataURL(file);
      base64Reader.onloadend = async () => {
        const base64Image = (base64Reader.result as string).split(',')[1];
        
        const tasksContext = tasks.map(t => `- ${t.name} (Planificado: ${t.plannedQuantity} ${t.unit})`).join('\n');
        
        const prompt = `Eres un ingeniero inspector de obra. Analiza esta fotografía del sitio.
        1. Describe brevemente las actividades que se observan.
        2. Identifica posibles riesgos de seguridad si los hay.
        3. Correlaciona esta imagen con una de las siguientes partidas del proyecto (si aplica):
        ${tasksContext}
        
        Responde de forma concisa y profesional.`;

        const response = await callGeminiProxy({
          model: 'gemini-2.5-flash',
          contents: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType: file.type } }
          ]
        });
        
        setAiAnalysis(response.text || '');
      };
    } catch (error) {
      console.error("Error analyzing image:", error);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) {
      alert("Por favor, selecciona un proyecto primero.");
      return;
    }
    setIsSubmitting(true);
    const reportData = {
      projectId: currentProject.id,
      date: reportDate,
      weather,
      personnelCount: Number(personnelCount),
      notes,
      slumpTest: slumpTest ? Number(slumpTest) : null,
      temperature: temperature ? Number(temperature) : null,
      equipmentSerial,
      location,
      imagePreview,
      aiAnalysis,
    };

    try {
      if (!navigator.onLine) {
        // Queue offline for automatic background sync when network returns
        await queueOfflineOperation('field_reports', 'create', reportData);
        alert("Modo Sin Conexión: Reporte guardado localmente. Se sincronizará automáticamente al recuperar la conexión.");
      } else {
        try {
          await addDoc(collection(db, 'field_reports'), {
            ...reportData,
            timestamp: serverTimestamp()
          });
        } catch (err) {
          // Fallback to offline queue if network fails
          console.warn("Error enviando reporte en línea, guardando en cola offline:", err);
          await queueOfflineOperation('field_reports', 'create', reportData);
        }
      }
      setSubmitted(true);
      setNotes('');
      setSlumpTest('');
      setTemperature('');
      setEquipmentSerial('');
      setAiAnalysis('');
      setImagePreview(null);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'field_reports');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reporte Diario de Campo</h1>
        <p className="text-gray-500 text-sm">Registro de actividades, personal, clima y evidencia fotográfica con IA.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Info */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={20} className="text-emerald-600" />
              Información General
            </h2>
            {location && (
              <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                <MapPin size={14} />
                GPS Activo
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del Reporte</label>
              <input 
                type="date" 
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clima</label>
              <select 
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Soleado">Soleado</option>
                <option value="Nublado">Nublado</option>
                <option value="Lluvia Ligera">Lluvia Ligera</option>
                <option value="Lluvia Fuerte">Lluvia Fuerte</option>
                <option value="Tormenta">Tormenta</option>
              </select>
            </div>
          </div>
        </div>

        {/* Personnel & Equipment */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users size={20} className="text-emerald-600" />
            Recursos en Sitio
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Total (Obreros + Staff)</label>
              <input 
                type="number" 
                min="0"
                value={personnelCount}
                onChange={(e) => setPersonnelCount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horas Trabajadas</label>
              <div className="relative">
                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="number" 
                  min="0"
                  step="0.5"
                  defaultValue={8}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quality Control & NDT */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles size={20} className="text-emerald-600" />
            Control de Calidad (Norma A-211 / NDT)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slump / Asentamiento (pulg)</label>
              <input 
                type="number" 
                step="0.25"
                value={slumpTest}
                onChange={(e) => setSlumpTest(e.target.value)}
                placeholder="Ej: 4.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temp. Mezcla/Amb (°C)</label>
              <input 
                type="number" 
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="Ej: 28.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Equipo (NDT)</label>
              <input 
                type="text" 
                value={equipmentSerial}
                onChange={(e) => setEquipmentSerial(e.target.value)}
                placeholder="Ej: DFX-615-1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">Datos requeridos para ensayos no destructivos y vaciado de concreto estructural.</p>
        </div>

        {/* Activities & Notes */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MapPin size={20} className="text-emerald-600" />
              Actividades y Observaciones
            </h2>
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isRecording ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {isRecording ? <Square size={16} /> : <Mic size={16} />}
              {isRecording ? 'Detener' : 'Dictar'}
            </button>
          </div>
          
          <div className="relative">
            <textarea 
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describa las actividades realizadas hoy, problemas encontrados, etc. Puede usar el botón 'Dictar' para hablar."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              required
            ></textarea>
            {isTranscribing && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                  <Loader2 size={18} className="animate-spin" />
                  Transcribiendo audio...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Photos & AI Analysis */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Camera size={20} className="text-emerald-600" />
            Evidencia Fotográfica
          </h2>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />

          {!imagePreview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Camera size={32} className="mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 font-medium">Toca para tomar una foto o subir desde la galería</p>
              <p className="text-xs text-gray-400 mt-1">La IA analizará la foto y la vinculará a una partida</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <img src={imagePreview} alt="Evidencia" className="w-full h-48 object-cover" />
                <button 
                  type="button"
                  onClick={() => { setImagePreview(null); setAiAnalysis(''); }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70"
                >
                  <Square size={16} />
                </button>
              </div>

              {isAnalyzingImage ? (
                <div className="flex items-center gap-3 text-emerald-600 p-4 bg-emerald-50 rounded-xl">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm font-medium">La IA está analizando la imagen y buscando partidas relacionadas...</span>
                </div>
              ) : aiAnalysis ? (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                  <h3 className="flex items-center gap-2 text-purple-800 font-semibold mb-2 text-sm">
                    <Sparkles size={16} />
                    Análisis de IA (Correlación de Partidas)
                  </h3>
                  <div className="prose prose-sm max-w-none text-purple-900 whitespace-pre-wrap">
                    {aiAnalysis}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || submitted || isTranscribing || isAnalyzingImage}
            className={`w-full py-3 px-4 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all ${
              submitted 
                ? 'bg-green-500' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg disabled:opacity-50'
            }`}
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : submitted ? (
              <>
                <CheckCircle2 size={20} />
                Reporte Enviado
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar Reporte Diario
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
