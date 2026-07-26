export type ThemePresetId = 
  | 'midnight_executive'
  | 'slate_industrial'
  | 'arctic_glass'
  | 'sandstone_pro'
  | 'contractor_brand';

export type ThemeDensity = 'compact' | 'spacious';
export type ThemeBorderRadius = 'rounded' | 'sharp';

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
  description: string;
  colors: ThemeColors;
}

export const THEME_PRESETS: Record<ThemePresetId, ThemePresetDefinition> = {
  midnight_executive: {
    id: 'midnight_executive',
    name: 'Midnight Executive',
    description: 'Azules y cian eléctricos oscuros con acabado de cristal sobrio',
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
      colorPrimary: '#06B6D4', // Electric Cyan
      colorSecondary: '#3B82F6', // Electric Blue
      colorAccent: '#10B981', // Emerald
      isDark: true,
    }
  },
  slate_industrial: {
    id: 'slate_industrial',
    name: 'Slate Industrial',
    description: 'Gris grafito, acero y verde azulado de alta precisión técnica',
    colors: {
      bgApp: '#0F172A',
      bgSurface: '#1E293B',
      bgSurfaceHover: '#334155',
      bgSidebar: '#0F172A',
      bgHeader: '#1E293B',
      borderColor: '#334155',
      borderGlass: 'rgba(255, 255, 255, 0.08)',
      textMain: '#F8FAFC',
      textMuted: '#94A3B8',
      colorPrimary: '#0EA5E9', // Steel Blue
      colorSecondary: '#14B8A6', // Teal
      colorAccent: '#F59E0B', // Amber
      isDark: true,
    }
  },
  arctic_glass: {
    id: 'arctic_glass',
    name: 'Arctic Glass',
    description: 'Fondo claro suave, azul hielo y plata con contraste nítido',
    colors: {
      bgApp: '#F4F7FA',
      bgSurface: '#FFFFFF',
      bgSurfaceHover: '#F1F5F9',
      bgSidebar: '#FFFFFF',
      bgHeader: '#FFFFFF',
      borderColor: '#E2E8F0',
      borderGlass: 'rgba(226, 232, 240, 0.8)',
      textMain: '#0F172A',
      textMuted: '#64748B',
      colorPrimary: '#0284C7', // Ice Blue
      colorSecondary: '#0F766E', // Teal
      colorAccent: '#2563EB', // Blue
      isDark: false,
    }
  },
  sandstone_pro: {
    id: 'sandstone_pro',
    name: 'Sandstone Pro',
    description: 'Gris cálido, bronce y pizarra de perfil técnico ejecutivo',
    colors: {
      bgApp: '#F5F4F0',
      bgSurface: '#FAF9F5',
      bgSurfaceHover: '#EFECE6',
      bgSidebar: '#1A202C',
      bgHeader: '#FAF9F5',
      borderColor: '#E5E3DC',
      borderGlass: 'rgba(229, 227, 220, 0.8)',
      textMain: '#1A202C',
      textMuted: '#718096',
      colorPrimary: '#2D3748', // Slate Ink
      colorSecondary: '#C05621', // Bronze
      colorAccent: '#D69E2E', // Gold
      isDark: false,
    }
  },
  contractor_brand: {
    id: 'contractor_brand',
    name: 'Contractor Brand',
    description: 'Generado dinámicamente desde el kit de marca de la organización',
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
