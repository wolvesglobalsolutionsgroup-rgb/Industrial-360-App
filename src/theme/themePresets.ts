export type ThemePresetId = 
  | 'midnight_executive'
  | 'slate_industrial'
  | 'titanium_pitch'
  | 'arctic_glass'
  | 'sandstone_pro'
  | 'emerald_petroleum'
  | 'contractor_brand';

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

export const THEME_PRESETS: Record<ThemePresetId, ThemePresetDefinition> = {
  midnight_executive: {
    id: 'midnight_executive',
    name: 'Midnight Executive',
    category: 'dark',
    description: 'Azul noche profundo, cian eléctrico e índigo para centro de mando ejecutivo',
    colors: {
      bgApp: '#090D16',
      bgSurface: '#111827',
      bgSurfaceHover: '#1F2937',
      bgSidebar: '#0B132B',
      bgHeader: '#0F172A',
      borderColor: '#1F2937',
      borderGlass: 'rgba(255, 255, 255, 0.08)',
      textMain: '#F9FAFB',
      textMuted: '#9CA3AF',
      colorPrimary: '#0EA5E9', // Sky Cyan
      colorSecondary: '#10B981', // Emerald
      colorAccent: '#6366F1', // Indigo
      isDark: true,
    }
  },
  slate_industrial: {
    id: 'slate_industrial',
    name: 'Slate Industrial',
    category: 'dark',
    description: 'Gris grafito, acero y verde azulado de alta precisión técnica en campo',
    colors: {
      bgApp: '#0B1120',
      bgSurface: '#151E32',
      bgSurfaceHover: '#222E48',
      bgSidebar: '#0D1527',
      bgHeader: '#151E32',
      borderColor: '#24314C',
      borderGlass: 'rgba(255, 255, 255, 0.1)',
      textMain: '#F8FAFC',
      textMuted: '#94A3B8',
      colorPrimary: '#38BDF8', // Steel Blue
      colorSecondary: '#14B8A6', // Teal
      colorAccent: '#F59E0B', // Amber
      isDark: true,
    }
  },
  titanium_pitch: {
    id: 'titanium_pitch',
    name: 'Titanium High Contrast',
    category: 'dark',
    description: 'Negro zinc puro con acentos de alta visibilidad para trabajo de campo nocturno',
    colors: {
      bgApp: '#09090B',
      bgSurface: '#18181B',
      bgSurfaceHover: '#27272A',
      bgSidebar: '#09090B',
      bgHeader: '#18181B',
      borderColor: '#27272A',
      borderGlass: 'rgba(255, 255, 255, 0.12)',
      textMain: '#FAFAFA',
      textMuted: '#A1A1AA',
      colorPrimary: '#10B981', // Emerald
      colorSecondary: '#06B6D4', // Cyan
      colorAccent: '#F59E0B', // Bright Amber
      isDark: true,
    }
  },
  arctic_glass: {
    id: 'arctic_glass',
    name: 'Arctic Glass',
    category: 'light',
    description: 'Fondo porcelana nítido, azul zafiro y esmeralda con contraste WCAG AA',
    colors: {
      bgApp: '#F8FAFC',
      bgSurface: '#FFFFFF',
      bgSurfaceHover: '#F1F5F9',
      bgSidebar: '#FFFFFF',
      bgHeader: '#FFFFFF',
      borderColor: '#E2E8F0',
      borderGlass: 'rgba(226, 232, 240, 0.8)',
      textMain: '#0F172A',
      textMuted: '#64748B',
      colorPrimary: '#0284C7', // Sky Navy
      colorSecondary: '#059669', // Emerald
      colorAccent: '#2563EB', // Cobalt
      isDark: false,
    }
  },
  sandstone_pro: {
    id: 'sandstone_pro',
    name: 'Sandstone Executive',
    category: 'light',
    description: 'Gris cálido terroso, bronce y pizarra de perfil técnico de ingeniería',
    colors: {
      bgApp: '#F7F6F2',
      bgSurface: '#FFFFFF',
      bgSurfaceHover: '#EFECE6',
      bgSidebar: '#1E293B',
      bgHeader: '#FFFFFF',
      borderColor: '#E5E2D9',
      borderGlass: 'rgba(229, 227, 220, 0.8)',
      textMain: '#1E293B',
      textMuted: '#64748B',
      colorPrimary: '#0F172A', // Slate Navy
      colorSecondary: '#D97706', // Amber Bronze
      colorAccent: '#0D9488', // Teal
      isDark: false,
    }
  },
  emerald_petroleum: {
    id: 'emerald_petroleum',
    name: 'Emerald Petroleum',
    category: 'light',
    description: 'Verde petróleo institucional, azul marino y dorado para sector energía',
    colors: {
      bgApp: '#F4F9F6',
      bgSurface: '#FFFFFF',
      bgSurfaceHover: '#E6F4ED',
      bgSidebar: '#064E3B',
      bgHeader: '#FFFFFF',
      borderColor: '#D1E7DD',
      borderGlass: 'rgba(209, 231, 221, 0.8)',
      textMain: '#062C21',
      textMuted: '#4B7268',
      colorPrimary: '#059669', // Petroleum Emerald
      colorSecondary: '#0284C7', // Navy Blue
      colorAccent: '#D97706', // Gold Accent
      isDark: false,
    }
  },
  contractor_brand: {
    id: 'contractor_brand',
    name: 'Contractor Brand',
    category: 'brand',
    description: 'Generado dinámicamente desde el kit de marca y colores de la organización',
    colors: {
      bgApp: '#F8FAFC',
      bgSurface: '#FFFFFF',
      bgSurfaceHover: '#F1F5F9',
      bgSidebar: '#0B2239',
      bgHeader: '#FFFFFF',
      borderColor: '#E2E8F0',
      borderGlass: 'rgba(226, 232, 240, 0.8)',
      textMain: '#0F172A',
      textMuted: '#64748B',
      colorPrimary: '#0B2239',
      colorSecondary: '#3CB179',
      colorAccent: '#F4C400',
      isDark: false,
    }
  }
};
