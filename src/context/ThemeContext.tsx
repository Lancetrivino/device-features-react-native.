import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { ThemeContextType, Theme, ThemeMode } from '../types';
import { loadTheme, saveTheme } from '../utils';

// ─── Travel Diary — Eye-friendly Sage & Forest Palette ───────────────────────
// Light: soft sage-white canvas, earthy teal-green brand, warm sand accents.
// Dark:  deep forest ink — rich and restful, never harsh pure-black.

export const LIGHT_COLORS = {
  background:      '#F4F7F2',   // soft sage white
  surface:         '#FFFFFF',
  surfaceElevated: '#EEF3EB',   // gentle green tint
  card:            '#FFFFFF',

  text:            '#1C2B1A',   // deep forest
  textSecondary:   '#4A6147',   // muted sage
  textMuted:       '#8DA688',   // light sage

  primary:         '#3D7A5F',   // forest teal
  primaryLight:    '#D4EDE3',   // soft mint
  primaryDark:     '#2A5C44',

  accent:          '#C8956C',   // warm sand
  accentSoft:      '#F5EAE0',

  border:          '#D6E4D0',
  borderLight:     '#E8F0E5',

  success:         '#3D7A5F',
  danger:          '#C0392B',
  dangerLight:     '#FDECEB',

  overlay:         'rgba(28, 43, 26, 0.50)',
  shadow:          '#A8C4A2',

  diaryAccent:     '#3D7A5F',
  diaryGlow:       'rgba(61, 122, 95, 0.18)',
  diaryRing:       '#3D7A5F',
  warmSand:        '#F5EAE0',
};

export const DARK_COLORS = {
  background:      '#111A10',   // deep forest ink
  surface:         '#182017',
  surfaceElevated: '#1F2A1E',
  card:            '#1A2419',

  text:            '#E8F0E5',
  textSecondary:   '#93B48D',
  textMuted:       '#507A4A',

  primary:         '#5AAE87',
  primaryLight:    '#1A3028',
  primaryDark:     '#3D8A68',

  accent:          '#D4A574',
  accentSoft:      '#1E1610',

  border:          '#2A3D28',
  borderLight:     '#222E21',

  success:         '#5AAE87',
  danger:          '#E06060',
  dangerLight:     '#2A1515',

  overlay:         'rgba(8, 14, 8, 0.65)',
  shadow:          '#000000',

  diaryAccent:     '#5AAE87',
  diaryGlow:       'rgba(90, 174, 135, 0.22)',
  diaryRing:       '#5AAE87',
  warmSand:        '#1E1610',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => { loadTheme().then(setMode); }, []);

  const toggleTheme = useCallback(async () => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    await saveTheme(next);
  }, [mode]);

  const theme: Theme = {
    mode,
    colors: mode === 'dark' ? DARK_COLORS : LIGHT_COLORS,
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};