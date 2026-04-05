import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import { Upload, Box, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function BIMViewer() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const url = URL.createObjectURL(file);
    setModelUrl(url);
    setIsLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 h-full flex flex-col"
    >
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Visor BIM 3D</h1>
          <p className="text-gray-500 mt-1">Inspecciona modelos arquitectónicos y estructurales</p>
        </div>
        <div>
          <input
            type="file"
            id="bim-upload"
            accept=".glb,.gltf"
            className="hidden"
            onChange={handleFileUpload}
          />
          <label
            htmlFor="bim-upload"
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Upload size={20} />
            Cargar Modelo (.glb)
          </label>
        </div>
      </header>

      <div className="flex-1 bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden relative shadow-inner">
        {!modelUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <Box size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-500">Ningún modelo cargado</p>
            <p className="text-sm mt-2">Sube un archivo .glb o .gltf para visualizarlo en 3D</p>
          </div>
        ) : (
          <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          }>
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
              <color attach="background" args={['#f3f4f6']} />
              <Stage environment="city" intensity={0.5}>
                <Model url={modelUrl} />
              </Stage>
              <OrbitControls makeDefault />
            </Canvas>
          </Suspense>
        )}
      </div>
    </motion.div>
  );
}
