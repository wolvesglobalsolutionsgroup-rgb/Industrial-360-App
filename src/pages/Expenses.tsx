import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, Plus, Receipt, Download } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc, query, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

export default function Expenses() {
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'expenses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const exp = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(exp);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'expenses');
    });
    return () => unsubscribe();
  }, []);

  const exportToCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['Fecha', 'Proveedor', 'Categoría', 'Descripción', 'Monto'];
    const csvContent = [
      headers.join(','),
      ...expenses.map(e => `"${e.date}","${e.vendor}","${e.category}","${e.description}",${e.amount}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'gastos_obra.csv';
    link.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    await analyzeReceipt(file);
  };

  const analyzeReceipt = async (file: File) => {
    setIsScanning(true);
    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(file);
      });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Analiza esta factura o recibo de compra para una obra de construcción. 
      Extrae la siguiente información en formato JSON estricto:
      {
        "vendor": "Nombre de la tienda o proveedor",
        "date": "Fecha en formato YYYY-MM-DD",
        "amount": "Monto total como número (sin símbolos de moneda)",
        "description": "Breve descripción de los artículos comprados (ej. Cemento, Herramientas)",
        "category": "Categoría sugerida (Materiales, Equipos, Mano de Obra, Otros)"
      }
      Devuelve SOLO el JSON, sin formato markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type
            }
          },
          prompt
        ]
      });

      const jsonText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonText);
      setExtractedData(data);

    } catch (error) {
      console.error("Error analyzing receipt:", error);
      alert("Hubo un error al analizar la factura. Por favor, intenta de nuevo.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!extractedData || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'expenses'), {
        ...extractedData,
        amount: Number(extractedData.amount),
        projectId: 'default-project', // En un caso real, se seleccionaría el proyecto
        ownerId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      
      alert("Gasto guardado exitosamente");
      setExtractedData(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Error al guardar el gasto");
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Control de Gastos</h1>
          <p className="text-gray-500 mt-1">Escanea facturas y recibos para automatizar el registro</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Download size={20} />
          Exportar CSV
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="text-emerald-600" />
            Escanear Factura
          </h3>
          
          <div 
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-sm" />
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <Upload className="text-emerald-600 w-8 h-8" />
                </div>
                <p className="text-gray-900 font-medium">Haz clic para subir una imagen</p>
                <p className="text-gray-500 text-sm mt-1">Soporta JPG, PNG</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload}
            />
          </div>

          {isScanning && (
            <div className="mt-6 flex items-center justify-center gap-3 text-emerald-600 bg-emerald-50 p-4 rounded-lg">
              <Loader2 className="animate-spin" />
              <span className="font-medium">La IA está analizando la factura...</span>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Receipt className="text-blue-600" />
            Datos Extraídos
          </h3>

          {extractedData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Proveedor</label>
                  <input 
                    type="text" 
                    value={extractedData.vendor} 
                    onChange={(e) => setExtractedData({...extractedData, vendor: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Fecha</label>
                  <input 
                    type="date" 
                    value={extractedData.date} 
                    onChange={(e) => setExtractedData({...extractedData, date: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Monto ($)</label>
                  <input 
                    type="number" 
                    value={extractedData.amount} 
                    onChange={(e) => setExtractedData({...extractedData, amount: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Categoría</label>
                  <input 
                    type="text" 
                    value={extractedData.category} 
                    onChange={(e) => setExtractedData({...extractedData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Descripción</label>
                <textarea 
                  value={extractedData.description} 
                  onChange={(e) => setExtractedData({...extractedData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24"
                />
              </div>

              <button 
                onClick={handleSave}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Registrar Gasto
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
              <Receipt size={48} className="mb-4 opacity-20" />
              <p>Sube una factura para extraer sus datos automáticamente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
