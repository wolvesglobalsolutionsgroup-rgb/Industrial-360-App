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
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-line p-6 rounded-2xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-brand-500 dark:text-emerald-400 font-mono text-xs uppercase tracking-wider font-bold mb-1">
            <Box size={16} /> Visor 3D CAD & BIM
          </div>
          <h1 className="text-2xl font-black text-ink tracking-tight">Visor BIM 3D</h1>
          <p className="text-ink-soft text-xs mt-1 font-medium">
            Inspecciona modelos arquitectónicos, mecánicos y estructurales en tiempo real.
          </p>
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
            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer text-xs"
          >
            <Upload size={18} />
            Cargar Modelo (.glb)
          </label>
        </div>
      </header>

      <div className="flex-1 min-h-[450px] bg-surface-2 rounded-2xl border border-line overflow-hidden relative shadow-inner">
        {!modelUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-brand-500/10 text-brand-500 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 border border-brand-500/20">
              <Box size={32} />
            </div>
            <p className="text-base font-bold text-ink">Ningún modelo 3D cargado</p>
            <p className="text-xs text-ink-soft mt-1 font-medium max-w-sm">
              Sube un archivo <span className="font-mono text-brand-500 font-bold">.glb</span> o <span className="font-mono text-brand-500 font-bold">.gltf</span> para visualizarlo interactiva y tridimensionalmente.
            </p>
          </div>
        ) : (
          <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500 dark:text-emerald-400" />
            </div>
          }>
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
              <color attach="background" args={['#0f172a']} />
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
