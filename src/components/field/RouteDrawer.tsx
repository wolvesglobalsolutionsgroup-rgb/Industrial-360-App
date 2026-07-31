import React, { useState } from 'react';
import * as turf from '@turf/turf';
import { Route, MapPin, Trash2, Plus, Download, Save, Undo, Compass, ShieldCheck, Check } from 'lucide-react';
import { Button, Input } from '../ui';
import { exportRouteToKML, downloadKMLFile } from '../../lib/kml/kmlExporter';
import { saveRouteOffline } from '../../lib/offline/syncEngine';
import { useRequiredProject } from '../../hooks/useRequiredProject';

export interface RoutePoint {
  lat: number;
  lng: number;
  altitude?: number;
  timestamp?: number;
}

export interface RouteDrawerProps {
  onRouteSaved?: (route: { name: string; points: RoutePoint[]; distanceKm: number }) => void;
  activePoints?: RoutePoint[];
  onPointsChange?: (points: RoutePoint[]) => void;
}

export default function RouteDrawer({ onRouteSaved, activePoints, onPointsChange }: RouteDrawerProps) {
  const { orgId, projectId } = useRequiredProject();
  const [points, setPoints] = useState<RoutePoint[]>(activePoints || []);
  const [routeName, setRouteName] = useState<string>('Ruta de Transporte / Trazado de Oleoducto');
  const [routeDesc, setRouteDesc] = useState<string>('Inspección de servidumbre de paso y accesos de maquinaria.');
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const updatePoints = (newPoints: RoutePoint[]) => {
    setPoints(newPoints);
    if (onPointsChange) onPointsChange(newPoints);
  };

  const addManualPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(manualLat);
    const lngNum = parseFloat(manualLng);

    if (isNaN(latNum) || isNaN(lngNum)) return;

    const newPts = [...points, { lat: Number(latNum.toFixed(6)), lng: Number(lngNum.toFixed(6)) }];
    updatePoints(newPts);
    setManualLat('');
    setManualLng('');
  };

  const removePoint = (index: number) => {
    const newPts = points.filter((_, i) => i !== index);
    updatePoints(newPts);
  };

  const clearAll = () => {
    updatePoints([]);
  };

  const undoLast = () => {
    if (points.length === 0) return;
    updatePoints(points.slice(0, -1));
  };

  // Compute exact geospatial metrics with Turf.js
  const computeDistanceKm = (): number => {
    if (points.length < 2) return 0;
    try {
      const lineCoords = points.map(p => [p.lng, p.lat]);
      const line = turf.lineString(lineCoords);
      const dist = turf.length(line, { units: 'kilometers' });
      return Number(dist.toFixed(3));
    } catch (err) {
      console.error("Turf length calculation error:", err);
      return 0;
    }
  };

  const computeAreaHa = (): number => {
    if (points.length < 3) return 0;
    try {
      // Close loop for polygon
      const polyCoords = [...points.map(p => [p.lng, p.lat]), [points[0].lng, points[0].lat]];
      const poly = turf.polygon([polyCoords]);
      const areaM2 = turf.area(poly);
      return Number((areaM2 / 10000).toFixed(2)); // Hectares
    } catch (err) {
      return 0;
    }
  };

  const distanceKm = computeDistanceKm();
  const areaHa = computeAreaHa();

  const handleExportKML = () => {
    if (points.length === 0) return;
    const kmlXml = exportRouteToKML(routeName, points, routeDesc);
    const safeFileName = routeName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadKMLFile(kmlXml, `${safeFileName}_${Date.now()}.kml`);
  };

  const handleSaveRoute = async () => {
    if (points.length < 2 || !routeName.trim()) return;

    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      await saveRouteOffline({
        name: routeName,
        distanceKm,
        path: points,
        startTime: Date.now(),
        endTime: Date.now(),
        createdAt: new Date().toISOString(),
        orgId,
        projectId
      } as any);

      if (onRouteSaved) {
        onRouteSaved({ name: routeName, points, distanceKm });
      }

      setSaveSuccessMsg('Ruta y trazado guardados exitosamente (Sincronizado/Offline).');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Error saving route:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Route size={20} className="text-brand-500" />
          <div>
            <h3 className="font-bold text-sm text-ink">Dibujador de Trazado y Rutas (Turf.js)</h3>
            <p className="text-xs text-ink-soft">Generación GeoJSON/KML y cálculo geoespacial de servidumbre</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {points.length > 0 && (
            <Button variant="ghost" size="sm" onClick={undoLast} leftIcon={<Undo size={14} />} title="Deshacer último punto">
              Deshacer
            </Button>
          )}
          {points.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} leftIcon={<Trash2 size={14} />} className="text-rose-600 hover:bg-rose-50">
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink mb-1">Nombre del Trazado / Tramo</label>
          <input
            type="text"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            className="input-base text-xs"
            placeholder="Ej: Trazado Tubo 16 pulg. Tramo A-B"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">Descripción / Observaciones</label>
          <input
            type="text"
            value={routeDesc}
            onChange={(e) => setRouteDesc(e.target.value)}
            className="input-base text-xs"
            placeholder="Ej: Inspección de derecho de vía y cruces de río"
          />
        </div>
      </div>

      {/* Geospatial Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-surface-2 p-3 rounded-xl border border-line">
          <span className="block text-[10px] uppercase font-bold text-ink-faint">Puntos de Control</span>
          <span className="text-xl font-display font-bold text-brand-500 tabular">{points.length}</span>
        </div>
        <div className="bg-surface-2 p-3 rounded-xl border border-line">
          <span className="block text-[10px] uppercase font-bold text-ink-faint">Longitud de Ruta (Turf)</span>
          <span className="text-xl font-display font-bold text-emerald-600 tabular">{distanceKm} <span className="text-xs font-normal">km</span></span>
        </div>
        <div className="bg-surface-2 p-3 rounded-xl border border-line col-span-2 sm:col-span-1">
          <span className="block text-[10px] uppercase font-bold text-ink-faint">Área de Polígono</span>
          <span className="text-xl font-display font-bold text-amber-600 tabular">
            {areaHa > 0 ? `${areaHa} ha` : 'N/A (3+ pts)'}
          </span>
        </div>
      </div>

      {/* Add Vertices Form */}
      <form onSubmit={addManualPoint} className="bg-surface-2/50 p-3 rounded-xl border border-line space-y-2">
        <span className="text-xs font-bold text-ink block">Agregar Vértice / Coordenada Manual</span>
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <input
            type="number"
            step="any"
            placeholder="Latitud (ej: 8.8234)"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            className="input-base text-xs py-1.5"
          />
          <input
            type="number"
            step="any"
            placeholder="Longitud (ej: -63.5129)"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            className="input-base text-xs py-1.5"
          />
          <Button type="submit" variant="secondary" size="sm" leftIcon={<Plus size={14} />} className="shrink-0 text-xs py-1.5">
            Agregar
          </Button>
        </div>
      </form>

      {/* Points List */}
      {points.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-ink block">Vértices del Trazado ({points.length})</span>
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
            {points.map((pt, idx) => (
              <div key={idx} className="flex items-center justify-between bg-surface p-2 rounded-lg border border-line text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-500 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>Lat: {pt.lat}°</span>
                  <span className="text-ink-faint">|</span>
                  <span>Lng: {pt.lng}°</span>
                </div>
                <button
                  type="button"
                  onClick={() => removePoint(idx)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                  title="Eliminar vértice"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {saveSuccessMsg && (
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 p-2.5 rounded-xl border border-emerald-500/30 flex items-center gap-2">
          <Check size={14} />
          {saveSuccessMsg}
        </p>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-t border-line pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={points.length === 0}
          onClick={handleExportKML}
          leftIcon={<Download size={14} />}
          className="text-xs font-bold"
        >
          Exportar KML (PDVSA)
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={points.length < 2 || isSaving}
          isLoading={isSaving}
          onClick={handleSaveRoute}
          leftIcon={<Save size={14} />}
          className="text-xs font-bold"
        >
          Guardar Trazado
        </Button>
      </div>
    </div>
  );
}
