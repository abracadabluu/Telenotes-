import React, { useEffect } from 'react';
import { ThemeId } from '../../types';

interface AndroidContainerProps {
  children: React.ReactNode;
  theme: ThemeId;
  customHexColor?: string;
  activeFontFamily?: string;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  bg: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textMuted: string;
  accent: string;
  accentContrast: string; // High contrast text on accent buttons
  border: string;
  isDark: boolean;
  statusColor: string;
}

export const THEME_REGISTRY: Record<ThemeId, ThemeConfig> = {
  light: {
    id: 'light',
    name: 'Light Pure',
    bg: '#ffffff',
    surface: '#f8fafc',
    surfaceHover: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    accent: '#0284c7',
    accentContrast: '#ffffff',
    border: '#e2e8f0',
    isDark: false,
    statusColor: '#ffffff',
  },
  dark: {
    id: 'dark',
    name: 'Telegram Dark',
    bg: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    accent: '#38bdf8',
    accentContrast: '#0f172a',
    border: '#334155',
    isDark: true,
    statusColor: '#0f172a',
  },
  amoled: {
    id: 'amoled',
    name: 'AMOLED Black',
    bg: '#000000',
    surface: '#0a0a0a',
    surfaceHover: '#171717',
    text: '#ffffff',
    textMuted: '#a3a3a3',
    accent: '#38bdf8',
    accentContrast: '#000000',
    border: '#262626',
    isDark: true,
    statusColor: '#000000',
  },
  system: {
    id: 'system',
    name: 'System Default',
    bg: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    accent: '#38bdf8',
    accentContrast: '#0f172a',
    border: '#334155',
    isDark: true,
    statusColor: '#0f172a',
  },
  'cyberpunk-neon': {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    bg: '#090014',
    surface: '#16012e',
    surfaceHover: '#2a0259',
    text: '#fdf4ff',
    textMuted: '#c084fc',
    accent: '#f43f5e',
    accentContrast: '#ffffff',
    border: '#a855f7',
    isDark: true,
    statusColor: '#090014',
  },
  'minimalist-monochrome': {
    id: 'minimalist-monochrome',
    name: 'Minimal Monochrome',
    bg: '#121212',
    surface: '#1c1c1c',
    surfaceHover: '#262626',
    text: '#ededed',
    textMuted: '#8c8c8c',
    accent: '#ffffff',
    accentContrast: '#000000', // Stark black text on white accent button!
    border: '#333333',
    isDark: true,
    statusColor: '#121212',
  },
  'nordic-pastel': {
    id: 'nordic-pastel',
    name: 'Nordic Pastel',
    bg: '#1c232b',
    surface: '#242f3a',
    surfaceHover: '#314050',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    accent: '#6ee7b7',
    accentContrast: '#0f172a',
    border: '#334155',
    isDark: true,
    statusColor: '#1c232b',
  },
  'retro-vintage': {
    id: 'retro-vintage',
    name: 'Retro Vintage Paper',
    bg: '#fbf4e6',
    surface: '#f3e8d2',
    surfaceHover: '#e6d5b8',
    text: '#451a03',
    textMuted: '#92400e',
    accent: '#b45309',
    accentContrast: '#ffffff',
    border: '#d7c2a5',
    isDark: false,
    statusColor: '#fbf4e6',
  },
  'midnight-ocean': {
    id: 'midnight-ocean',
    name: 'Midnight Ocean',
    bg: '#021024',
    surface: '#052659',
    surfaceHover: '#0a3a82',
    text: '#e0f2fe',
    textMuted: '#7dd3fc',
    accent: '#38bdf8',
    accentContrast: '#021024',
    border: '#0c4a6e',
    isDark: true,
    statusColor: '#021024',
  },
  'forest-emerald': {
    id: 'forest-emerald',
    name: 'Forest Emerald',
    bg: '#032219',
    surface: '#064e3b',
    surfaceHover: '#065f46',
    text: '#ecfdf5',
    textMuted: '#6ee7b7',
    accent: '#34d399',
    accentContrast: '#032219',
    border: '#047857',
    isDark: true,
    statusColor: '#032219',
  },
  'sunset-terracotta': {
    id: 'sunset-terracotta',
    name: 'Sunset Terracotta',
    bg: '#2b0d06',
    surface: '#431407',
    surfaceHover: '#5e1c0a',
    text: '#fff7ed',
    textMuted: '#fdba74',
    accent: '#fb923c',
    accentContrast: '#2b0d06',
    border: '#7c2d12',
    isDark: true,
    statusColor: '#2b0d06',
  },
  'material-you': {
    id: 'material-you',
    name: 'Material You Dynamic',
    bg: '#111827',
    surface: '#1f2937',
    surfaceHover: '#374151',
    text: '#f3f4f6',
    textMuted: '#9ca3af',
    accent: '#818cf8',
    accentContrast: '#ffffff',
    border: '#374151',
    isDark: true,
    statusColor: '#111827',
  },
  glassmorphism: {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    bg: '#070d1e',
    surface: 'rgba(30, 41, 59, 0.75)',
    surfaceHover: 'rgba(51, 65, 85, 0.85)',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    accent: '#60a5fa',
    accentContrast: '#ffffff',
    border: 'rgba(255, 255, 255, 0.15)',
    isDark: true,
    statusColor: '#070d1e',
  },
  neumorphism: {
    id: 'neumorphism',
    name: 'Neumorphism Soft',
    bg: '#1a1f2c',
    surface: '#1e2433',
    surfaceHover: '#262d40',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    accent: '#38bdf8',
    accentContrast: '#0f172a',
    border: '#2a3245',
    isDark: true,
    statusColor: '#1a1f2c',
  },
  custom: {
    id: 'custom',
    name: 'Custom Hex',
    bg: '#090d16',
    surface: '#161d2d',
    surfaceHover: '#222d44',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    accent: '#38bdf8',
    accentContrast: '#0f172a',
    border: '#2a354f',
    isDark: true,
    statusColor: '#090d16',
  },
};

export const AndroidContainer: React.FC<AndroidContainerProps> = ({
  children,
  theme,
  customHexColor,
  activeFontFamily,
}) => {
  const currentTheme = THEME_REGISTRY[theme] || THEME_REGISTRY['dark'];

  const effectiveBg =
    theme === 'custom' && customHexColor ? customHexColor : currentTheme.bg;

  // Apply CSS Variables strictly to root & sync status bar meta theme
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-bg', effectiveBg);
    root.style.setProperty('--theme-surface', currentTheme.surface);
    root.style.setProperty('--theme-surface-hover', currentTheme.surfaceHover);
    root.style.setProperty('--theme-text', currentTheme.text);
    root.style.setProperty('--theme-text-muted', currentTheme.textMuted);
    root.style.setProperty('--theme-accent', currentTheme.accent);
    root.style.setProperty('--theme-accent-contrast', currentTheme.accentContrast);
    root.style.setProperty('--theme-border', currentTheme.border);

    if (activeFontFamily) {
      root.style.setProperty('--font-active', activeFontFamily);
    }

    document.body.style.backgroundColor = effectiveBg;
    document.body.style.color = currentTheme.text;

    // Sync HTML Meta theme-color for Android status bar
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', effectiveBg);
  }, [theme, effectiveBg, currentTheme, activeFontFamily]);

  return (
    <div
      style={{
        backgroundColor: effectiveBg,
        color: currentTheme.text,
        fontFamily: activeFontFamily || 'var(--font-sans)',
      }}
      className="fixed inset-0 w-full h-full flex flex-col overflow-hidden antialiased pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] transition-colors duration-200"
    >
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};
