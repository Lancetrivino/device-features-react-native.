// ─── Travel Entry Types ───────────────────────────────────────────────────────

export interface TravelEntry {
  id: string;
  imageUri: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string;
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
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;      // added
  accent: string;
  accentSoft: string;       // added
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  danger: string;
  dangerLight: string;
  success: string;
  overlay: string;
  card: string;
  shadow: string;
  // Travel Diary additions
  diaryAccent: string;      // added
  diaryGlow: string;        // added
  diaryRing: string;        // added
  warmSand: string;         // added
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