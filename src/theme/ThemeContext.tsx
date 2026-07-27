import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
  preset: string;
  setPreset: (preset: string) => void;
  density: string;
  setDensity: (density: string) => void;
  borderRadius: string;
  setBorderRadius: (radius: string) => void;
  activeTheme: { name: string };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('ic360_theme_mode') as ThemeMode;
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('ic360_theme_mode', newMode);
  };

  const toggleMode = () => setMode(mode === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        toggleMode,
        setMode,
        isDarkMode: mode === 'dark',
        preset: 'default',
        setPreset: () => {},
        density: 'spacious',
        setDensity: () => {},
        borderRadius: 'rounded',
        setBorderRadius: () => {},
        activeTheme: { name: mode === 'dark' ? 'Modo Oscuro' : 'Modo Claro' },
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
