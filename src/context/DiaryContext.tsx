import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Alert } from 'react-native';
import { DiaryContextType, TravelEntry } from '../types';
import { loadEntries, saveEntries } from '../utils';
import { isValidEntry } from '../utils/storage';

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

interface DiaryProviderProps {
  children: ReactNode;
}

export const DiaryProvider: React.FC<DiaryProviderProps> = ({ children }) => {
  const [entries, setEntries] = useState<TravelEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      try {
        const loaded = await loadEntries();
        setEntries(loaded);
      } catch (error) {
        console.error('[DiaryContext] Failed to load entries:', error);
        Alert.alert('Error', 'Failed to load your travel entries. Please restart the app.');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const addEntry = useCallback(async (entry: TravelEntry): Promise<void> => {
    if (!isValidEntry(entry)) {
      throw new Error('Invalid travel entry data');
    }

    const updated = [entry, ...entries];
    setEntries(updated);
    await saveEntries(updated);
  }, [entries]);

  const removeEntry = useCallback(async (id: string): Promise<void> => {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid entry ID');
    }

    const exists = entries.some(e => e.id === id);
    if (!exists) {
      console.warn('[DiaryContext] Attempted to remove non-existent entry:', id);
      return;
    }

    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    await saveEntries(updated);
  }, [entries]);

  const clearAllEntries = useCallback(async (): Promise<void> => {
    setEntries([]);
    await saveEntries([]);
  }, []);

  return (
    <DiaryContext.Provider value={{ entries, addEntry, removeEntry, clearAllEntries, isLoading }}>
      {children}
    </DiaryContext.Provider>
  );
};

export const useDiary = (): DiaryContextType => {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error('useDiary must be used within DiaryProvider');
  return ctx;
};