// ─── Travel Entry Types ───────────────────────────────────────────────────────

export interface TravelEntry {
  id: string;
  imageUri: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  caption?: string;
  title?: string;
}

export interface RawLocation {
  latitude: number;
  longitude: number;
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  Home: undefined;
  AddEntry: undefined;
};

// ─── Theme Types ──────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;

  // Brand
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Accent
  accent: string;
  accentSoft: string;

  // Borders
  border: string;
  borderLight: string;

  // Semantic
  success: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;

  // Utility
  overlay: string;
  shadow: string;

  // Diary-specific
  diaryAccent: string;
  diaryGlow: string;
  diaryRing: string;
  warmSand: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

// ─── Context Types ────────────────────────────────────────────────────────────

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export interface DiaryContextType {
  entries: TravelEntry[];
  addEntry: (entry: TravelEntry) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  clearAllEntries: () => Promise<void>;
  isLoading: boolean;
}

// ─── Permission Types ─────────────────────────────────────────────────────────

export interface PermissionStatus {
  camera: boolean;
  location: boolean;
  notifications: boolean;
}

// ─── Component Props Types ────────────────────────────────────────────────────

export interface EntryCardProps {
  entry: TravelEntry;
  onRemove: (id: string) => void;
  theme: Theme;
}

export interface EmptyStateProps {
  theme: Theme;
}

export interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}