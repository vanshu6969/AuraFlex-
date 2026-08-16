import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeStorage } from './storageAdapter';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  textSub: string;
  border: string;
  headerBg: string;
}

const darkColors: ThemeColors = {
  bg: '#0f0f12',
  card: '#18181f',
  text: '#ffffff',
  textSub: '#9ca3af',
  border: 'rgba(255, 255, 255, 0.08)',
  headerBg: '#0f0f12',
};

const lightColors: ThemeColors = {
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  textSub: '#475569',
  border: 'rgba(0, 0, 0, 0.1)',
  headerBg: '#ffffff',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  isLight: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'dark',
  isLight: false,
  colors: darkColors,
  setThemeMode: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    safeStorage.getItem('auraflex_theme_mode').then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeState(saved as ThemeMode);
      }
    });
  }, []);

  const isLight = themeMode === 'light';
  const colors = isLight ? lightColors : darkColors;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isLight) {
        document.body.style.backgroundColor = '#f8fafc';
        document.body.style.color = '#0f172a';
      } else {
        document.body.style.backgroundColor = '#0f0f12';
        document.body.style.color = '#ffffff';
      }
    }
  }, [isLight]);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeState(mode);
    await safeStorage.setItem('auraflex_theme_mode', mode);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, isLight, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
