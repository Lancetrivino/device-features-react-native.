import AsyncStorage from '@react-native-async-storage/async-storage';
import { TravelEntry } from '../types';
const STORAGE_KEY = '@travel_diary_entries';
const THEME_KEY = '@travel_diary_theme';

// ─── Entry Storage ─────────────────────────────────────────────────────────────

export const loadEntries = async (): Promise<TravelEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch (error) {
    console.error('[Storage] Failed to load entries:', error);
    return [];
  }
};

export const saveEntries = async (entries: TravelEntry[]): Promise<void> => {
  try {
    if (!Array.isArray(entries)) {
      throw new Error('Entries must be an array');
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('[Storage] Failed to save entries:', error);
    throw error;
  }
};

export const clearAllEntries = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[Storage] Failed to clear entries:', error);
    throw error;
  }
};

// ─── Theme Storage ─────────────────────────────────────────────────────────────

export const loadTheme = async (): Promise<'light' | 'dark'> => {
  try {
    const raw = await AsyncStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
    return 'dark';
  } catch {
    return 'dark';
  }
};

export const saveTheme = async (mode: 'light' | 'dark'): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_KEY, mode);
  } catch (error) {
    console.error('[Storage] Failed to save theme:', error);
  }
};

// ─── Validation Helpers ────────────────────────────────────────────────────────

export const isValidEntry = (entry: unknown): entry is TravelEntry => {
  if (!entry || typeof entry !== 'object') return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.id === 'string' && e.id.trim().length > 0 &&
    typeof e.imageUri === 'string' && e.imageUri.trim().length > 0 &&
    typeof e.address === 'string' &&
    typeof e.latitude === 'number' &&
    typeof e.longitude === 'number' &&
    typeof e.createdAt === 'string'
  );
};
