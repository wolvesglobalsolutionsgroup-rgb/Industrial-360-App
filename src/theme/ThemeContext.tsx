import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ThemePresetId, 
  ThemeDensity, 
  ThemeBorderRadius, 
  ThemePresetDefinition, 
  THEME_PRESETS 
} from './themePresets';
import { useProject } from '../ProjectContext';

interface ThemeContextType {
  preset: ThemePresetId;
  setPreset: (preset: ThemePresetId) => void;
  density: ThemeDensity;
  setDensity: (density: ThemeDensity) => void;
  borderRadius: ThemeBorderRadius;
  setBorderRadius: (radius: ThemeBorderRadius) => void;
  isDarkMode: boolean;
  toggleMode: () => void;
  activeTheme: ThemePresetDefinition;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { brandKit } = useProject();

  const [preset, setPresetState] = useState<ThemePresetId>(() => {
    const saved = localStorage.getItem('ic360_theme_preset') as ThemePresetId;
    if (saved && THEME_PRESETS[saved]) {
      return saved;
    }
    return 'arctic_glass';
  });

  const [density, setDensityState] = useState<ThemeDensity>(() => {
    const saved = localStorage.getItem('ic360_theme_density') as ThemeDensity;
    if (saved === 'compact' || saved === 'spacious') {
      return saved;
    }
    return 'spacious';
  });

  const [borderRadius, setBorderRadiusState] = useState<ThemeBorderRadius>(() => {
    const saved = localStorage.getItem('ic360_theme_radius') as ThemeBorderRadius;
    if (saved === 'rounded' || saved === 'sharp') {
      return saved;
    }
    return 'rounded';
  });

  const handleSetPreset = (newPreset: ThemePresetId) => {
    setPresetState(newPreset);
    localStorage.setItem('ic360_theme_preset', newPreset);
  };

  const handleSetDensity = (newDensity: ThemeDensity) => {
    setDensityState(newDensity);
    localStorage.setItem('ic360_theme_density', newDensity);
  };

  const handleSetBorderRadius = (newRadius: ThemeBorderRadius) => {
    setBorderRadiusState(newRadius);
    localStorage.setItem('ic360_theme_radius', newRadius);
  };

  // Compute active theme colors
  const activePresetObj: ThemePresetDefinition = JSON.parse(JSON.stringify(THEME_PRESETS[preset] || THEME_PRESETS['arctic_glass']));
  
  if (preset === 'contractor_brand' && brandKit) {
    activePresetObj.colors = {
      ...activePresetObj.colors,
      colorPrimary: brandKit.primaryColor || '#0B2239',
      colorSecondary: brandKit.secondaryColor || '#3CB179',
      bgSidebar: brandKit.primaryColor || '#0B2239',
    };
  }

  const isDarkMode = activePresetObj.colors.isDark;

  // Function to toggle between Dark and Light mode
  const toggleMode = () => {
    if (isDarkMode) {
      // Switch from dark to light preset
      if (preset === 'midnight_executive' || preset === 'slate_industrial' || preset === 'titanium_pitch') {
        handleSetPreset('arctic_glass');
      } else {
        handleSetPreset('arctic_glass');
      }
    } else {
      // Switch from light to dark preset
      if (preset === 'arctic_glass' || preset === 'sandstone_pro' || preset === 'emerald_petroleum' || preset === 'contractor_brand') {
        handleSetPreset('midnight_executive');
      } else {
        handleSetPreset('midnight_executive');
      }
    }
  };

  // Inject CSS Variables into document root
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = activePresetObj;

    root.style.setProperty('--theme-bg-app', colors.bgApp);
    root.style.setProperty('--theme-bg-surface', colors.bgSurface);
    root.style.setProperty('--theme-bg-surface-hover', colors.bgSurfaceHover);
    root.style.setProperty('--theme-bg-sidebar', colors.bgSidebar);
    root.style.setProperty('--theme-bg-header', colors.bgHeader);
    root.style.setProperty('--theme-border-color', colors.borderColor);
    root.style.setProperty('--theme-border-glass', colors.borderGlass);
    root.style.setProperty('--theme-text-main', colors.textMain);
    root.style.setProperty('--theme-text-muted', colors.textMuted);
    root.style.setProperty('--theme-color-primary', colors.colorPrimary);
    root.style.setProperty('--theme-color-secondary', colors.colorSecondary);
    root.style.setProperty('--theme-color-accent', colors.colorAccent);

    // Border radius
    const radiusVal = borderRadius === 'sharp' ? '0.25rem' : '1rem';
    root.style.setProperty('--theme-radius', radiusVal);

    // Density padding / gap
    const densityPad = density === 'compact' ? '0.75rem' : '1.25rem';
    const densityGap = density === 'compact' ? '0.75rem' : '1.5rem';
    root.style.setProperty('--theme-density-padding', densityPad);
    root.style.setProperty('--theme-density-gap', densityGap);

    if (colors.isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [preset, density, borderRadius, brandKit, activePresetObj]);

  return (
    <ThemeContext.Provider
      value={{
        preset,
        setPreset: handleSetPreset,
        density,
        setDensity: handleSetDensity,
        borderRadius,
        setBorderRadius: handleSetBorderRadius,
        isDarkMode,
        toggleMode,
        activeTheme: activePresetObj,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
