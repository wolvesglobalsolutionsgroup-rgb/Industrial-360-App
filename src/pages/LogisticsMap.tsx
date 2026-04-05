import { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Navigation, Loader2, Map as MapIcon, Play, Square, Route, History } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function LogisticsMap() {
  const [queryText, setQueryText] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapLinks, setMapLinks] = useState<any[]>([]);
  
  // Tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0); // in km
  const [path, setPath] = useState<{lat: number, lng: number, timestamp: number}[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    // Initial location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Error getting location:", err)
      );
    }
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Haversine formula to calculate distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; // Distance in km
  };

  const toggleTracking = async () => {
    if (isTracking) {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
      
      // Save route to Firebase if there's distance
      if (distance > 0 && auth.currentUser) {
        try {
          await addDoc(collection(db, 'routes'), {
            userId: auth.currentUser.uid,
            distanceKm: distance,
            path: path,
            startTime: path[0]?.timestamp,
            endTime: Date.now(),
            createdAt: serverTimestamp()
          });
          alert(`Ruta guardada. Distancia total: ${distance.toFixed(2)} km`);
        } catch (error) {
          console.error("Error saving route:", error);
        }
      }
    } else {
      // Start tracking
      setDistance(0);
      setPath([]);
      lastLocationRef.current = location;
      setIsTracking(true);
      
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setLocation(newLoc);
            
            setPath(prev => [...prev, { ...newLoc, timestamp: Date.now() }]);
            
            if (lastLocationRef.current) {
              const dist = calculateDistance(
                lastLocationRef.current.lat, lastLocationRef.current.lng,
                newLoc.lat, newLoc.lng
              );
              // Only add distance if it's significant (e.g., > 10 meters) to avoid GPS jitter
              if (dist > 0.01) {
                setDistance(prev => prev + dist);
                lastLocationRef.current = newLoc;
              }
            } else {
              lastLocationRef.current = newLoc;
            }
          },
          (err) => console.error("Error tracking location:", err),
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;

    setIsProcessing(true);
    setResponse('');
    setMapLinks([]);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key no configurada");

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Eres un asistente de logística de obra. El usuario está en el campo y necesita información geográfica, rutas, o proveedores cercanos.
      Pregunta: ${queryText}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: location ? {
                latitude: location.lat,
                longitude: location.lng
              } : undefined
            }
          }
        }
      });

      setResponse(res.text || 'No se encontró información.');
      
      const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const links = chunks.map((chunk: any) => chunk.web?.uri || chunk.maps?.uri).filter(Boolean);
        setMapLinks(links);
      }

    } catch (error: any) {
      console.error("Error en mapa:", error);
      setResponse(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <MapIcon className="text-emerald-600" size={32} />
          Logística y Ubicación
        </h1>
        <p className="text-gray-500 mt-1">Mapeo de frentes de trabajo, rutas de transporte y seguimiento de recorridos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tracking Panel */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Route size={20} className="text-emerald-600" />
              Seguimiento de Ruta
            </h2>
            
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {distance.toFixed(2)} <span className="text-lg text-gray-500 font-normal">km</span>
              </div>
              <p className="text-sm text-gray-500">Distancia recorrida hoy</p>
            </div>

            <button
              onClick={toggleTracking}
              className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                isTracking 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 animate-pulse' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
              }`}
            >
              {isTracking ? (
                <>
                  <Square size={20} />
                  Detener Tracking
                </>
              ) : (
                <>
                  <Play size={20} />
                  Iniciar Recorrido
                </>
              )}
            </button>
            
            {isTracking && (
              <p className="text-xs text-center text-gray-500 mt-3">
                Registrando ubicación en segundo plano...
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2 p-3 bg-blue-50 text-blue-800 rounded-xl">
              <MapPin size={20} className="shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Ubicación Actual</h3>
                <p className="text-xs opacity-80 font-mono mt-1">
                  {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Buscando GPS...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Panel */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search size={20} className="text-emerald-600" />
            Asistente Geográfico IA
          </h2>
          
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Ej: Ferreterías industriales cerca de mi ubicación, o ruta hacia el botadero..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <button 
              type="submit"
              disabled={isProcessing || !queryText.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />}
              Buscar
            </button>
          </form>

          {response && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapIcon size={18} className="text-emerald-600" />
                Respuesta del Asistente
              </h3>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-6">
                {response}
              </div>
              
              {mapLinks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Enlaces de Google Maps:</h4>
                  <div className="flex flex-wrap gap-2">
                    {mapLinks.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <MapPin size={12} />
                        Ver en Maps {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
