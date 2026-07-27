import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEME_PRESETS } from './themePresets';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
  // Compatibility properties
  preset: string;
  setPreset: (preset: string) => void;
  density: string;
  setDensity: (density: string) => void;
  borderRadius: string;
  setBorderRadius: (radius: string) => void;
  activeTheme: typeof THEME_PRESETS['default'];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('ic360_theme_mode') as ThemeMode;
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [preset, setPresetState] = useState<string>('default');
  const [density, setDensityState] = useState<string>('spacious');
  const [borderRadius, setBorderRadiusState] = useState<string>('rounded');

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('ic360_theme_mode', newMode);
  };

  const toggleMode = () => setMode(mode === 'dark' ? 'light' : 'dark');

  const setPreset = (p: string) => {
    setPresetState(p);
    // If user selects a dark-leaning preset name, switch mode to dark, else light
    if (p.includes('dark') || p.includes('midnight') || p.includes('slate') || p.includes('titanium')) {
      setMode('dark');
    } else if (p.includes('light') || p.includes('arctic') || p.includes('sandstone')) {
      setMode('light');
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.style.colorScheme = mode;
  }, [mode]);

  const activeTheme = {
    ...THEME_PRESETS.default,
    name: mode === 'dark' ? 'Modo Oscuro' : 'Modo Claro',
    colors: {
      ...THEME_PRESETS.default.colors,
      isDark: mode === 'dark',
    },
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        toggleMode,
        setMode,
        isDarkMode: mode === 'dark',
        preset,
        setPreset,
        density,
        setDensity: setDensityState,
        borderRadius,
        setBorderRadius: setBorderRadiusState,
        activeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
