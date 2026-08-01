import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '../ui';

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number | null;
}

export interface GPSPickerProps {
  onLocationChange: (location: LocationData) => void;
  initialLocation?: LocationData | null;
  disabled?: boolean;
}

export default function GPSPicker({ onLocationChange, initialLocation, disabled = false }: GPSPickerProps) {
  const [location, setLocation] = useState<LocationData | null>(initialLocation || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  const captureGPS = () => {
    if (!('geolocation' in navigator)) {
      setErrorMsg('Navegador sin soporte de geolocalización GPS.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLoc: LocationData = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
          altitude: pos.coords.altitude ? Number(pos.coords.altitude.toFixed(1)) : null
        };
        setLocation(newLoc);
        onLocationChange(newLoc);
        setLoading(false);
      },
      (err) => {
        console.warn('GPS position error:', err);
        setLoading(false);
        let msg = 'Error al consultar GPS.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Permiso de ubicación denegado en el navegador.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Señal de GPS no disponible en este momento.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Tiempo de espera agotado al consultar GPS.';
        }
        setErrorMsg(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  const accuracyBadge = () => {
    if (!location?.accuracy) return null;
    const acc = location.accuracy;
    if (acc <= 10) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
          <CheckCircle2 size={12} /> Alta Precisión (±{acc}m)
        </span>
      );
    }
    if (acc <= 50) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
          <AlertCircle size={12} /> Precisión Media (±{acc}m)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
        <ShieldAlert size={12} /> Baja Precisión (±{acc}m)
      </span>
    );
  };

  return (
    <div className="bg-surface-2 p-4 rounded-xl border border-line space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-brand-500" />
          <h4 className="text-xs font-bold text-ink uppercase tracking-wide">
            Captura Geográfica GPS (Campo)
          </h4>
        </div>
        {location && accuracyBadge()}
      </div>

      {location ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-surface p-3 rounded-xl border border-line text-xs font-mono">
            <div>
              <span className="block text-[10px] text-ink-faint uppercase font-sans font-bold">Latitud</span>
              <span className="font-bold text-ink">{location.lat}°</span>
            </div>
            <div>
              <span className="block text-[10px] text-ink-faint uppercase font-sans font-bold">Longitud</span>
              <span className="font-bold text-ink">{location.lng}°</span>
            </div>
            <div>
              <span className="block text-[10px] text-ink-faint uppercase font-sans font-bold">Altitud</span>
              <span className="font-bold text-ink">{location.altitude ? `${location.altitude}m` : 'N/A'}</span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || loading}
              isLoading={loading}
              onClick={captureGPS}
              leftIcon={<RefreshCw size={12} />}
              className="text-[11px] h-7"
            >
              Recapturar Coordenadas GPS
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-3 space-y-2">
          <p className="text-xs text-ink-faint">
            Presione para capturar automáticamente la ubicación GPS exacta del frente de trabajo.
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={disabled || loading}
            isLoading={loading}
            onClick={captureGPS}
            leftIcon={<Navigation size={14} />}
            className="font-bold text-xs"
          >
            Obtener Coordenadas GPS
          </Button>
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
          <AlertCircle size={14} className="shrink-0" />
          {errorMsg}
        </p>
      )}
    </div>
  );
}
