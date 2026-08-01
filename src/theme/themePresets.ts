// DEPRECATED — El sistema de tema ahora se maneja desde index.css
// (bloque @theme + .dark overrides) y ThemeContext.tsx.
// Este archivo se mantiene para compatibilidad con tipos e imports existentes.

export type ThemePresetId = 'default' | 'midnight_executive' | 'slate_industrial' | 'arctic_glass';
export type ThemeDensity = 'compact' | 'spacious';
export type ThemeBorderRadius = 'rounded' | 'sharp';
export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bgApp: string;
  bgSurface: string;
  bgSurfaceHover: string;
  bgSidebar: string;
  bgHeader: string;
  borderColor: string;
  borderGlass: string;
  textMain: string;
  textMuted: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  isDark: boolean;
}

export interface ThemePresetDefinition {
  id: ThemePresetId;
  name: string;
  category: 'dark' | 'light' | 'brand';
  description: string;
  colors: ThemeColors;
}

const DEFAULT_PRESET_DEF: ThemePresetDefinition = {
  id: 'default',
  name: 'Industrial Standard',
  category: 'dark',
  description: 'Tema industrial unificado',
  colors: {
    bgApp: 'var(--color-bg)',
    bgSurface: 'var(--color-surface)',
    bgSurfaceHover: 'var(--color-surface-2)',
    bgSidebar: 'var(--color-brand-500)',
    bgHeader: 'var(--color-surface)',
    borderColor: 'var(--color-line)',
    borderGlass: 'var(--color-line)',
    textMain: 'var(--color-ink)',
    textMuted: 'var(--color-ink-soft)',
    colorPrimary: 'var(--color-brand-500)',
    colorSecondary: 'var(--color-brand-accent)',
    colorAccent: 'var(--color-brand-accent)',
    isDark: false,
  },
};

export const THEME_PRESETS: Record<string, ThemePresetDefinition> = {
  default: DEFAULT_PRESET_DEF,
  midnight_executive: { ...DEFAULT_PRESET_DEF, id: 'midnight_executive', name: 'Midnight Executive (Oscuro)' },
  slate_industrial: { ...DEFAULT_PRESET_DEF, id: 'slate_industrial', name: 'Slate Industrial (Oscuro)' },
  arctic_glass: { ...DEFAULT_PRESET_DEF, id: 'arctic_glass', name: 'Arctic Glass (Claro)' },
};

export const DEFAULT_PRESET = 'default';
