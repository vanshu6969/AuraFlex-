import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return memoryStorage[key] || null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return memoryStorage[key] || null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryStorage[key] = value;
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },

  async removeItem(key: string): Promise<void> {
    delete memoryStorage[key];
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};
