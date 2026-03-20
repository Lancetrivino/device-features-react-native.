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

// ── Travel Diary — Golden Hour Palette ────────────────────────────────────────
// Light: warm cream canvas, rich ocean blue brand, golden amber accents.
// Dark:  deep ink navy — immersive and cinematic.

export const LIGHT_COLORS = {
  background:      '#F7F3EE',   // warm cream
  surface:         '#FFFFFF',
  surfaceElevated: '#EDE8E1',   // soft warm tint
  card:            '#FFFFFF',

  text:            '#1A1A2E',   // deep ink
  textSecondary:   '#4A5568',   // warm slate
  textMuted:       '#94A3B8',   // soft muted

  primary:         '#2A7BB5',   // rich ocean blue
  primaryLight:    '#B8D9F0',   // pale sky
  primaryDark:     '#1A5A8A',

  accent:          '#E8841A',   // golden amber
  accentSoft:      '#FEF0DC',

  border:          '#DDD6CC',   // warm sand border
  borderLight:     '#EDE8E1',

  success:         '#2A7BB5',
  danger:          '#D64545',
  dangerLight:     '#FCEAEA',
  warning:         '#E8841A',
  warningLight:    '#FEF0DC',

  overlay:         'rgba(26, 26, 46, 0.55)',
  shadow:          '#C5B9AA',

  diaryAccent:     '#2A7BB5',
  diaryGlow:       'rgba(42, 123, 181, 0.15)',
  diaryRing:       '#2A7BB5',
  warmSand:        '#FEF0DC',
};

export const DARK_COLORS = {
  background:      '#0F1117',   // deep space ink
  surface:         '#161B26',
  surfaceElevated: '#1E2535',
  card:            '#161B26',

  text:            '#EEE8E0',   // warm white
  textSecondary:   '#8BA4BD',   // muted blue-grey
  textMuted:       '#3E5068',   // deep muted

  primary:         '#4FA3D8',   // vivid sky blue
  primaryLight:    '#4FA3D820',
  primaryDark:     '#2A7BB5',

  accent:          '#F0952A',   // warm amber glow
  accentSoft:      '#F0952A18',

  border:          '#1E2D3E',
  borderLight:     '#1A2535',

  success:         '#4FA3D8',
  danger:          '#E05656',
  dangerLight:     '#E0565618',
  warning:         '#F0952A',
  warningLight:    '#F0952A18',

  overlay:         'rgba(8, 10, 18, 0.70)',
  shadow:          '#000000',

  diaryAccent:     '#4FA3D8',
  diaryGlow:       'rgba(79, 163, 216, 0.18)',
  diaryRing:       '#4FA3D8',
  warmSand:        '#1E2535',
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