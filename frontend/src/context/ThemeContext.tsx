import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useDeviceColorScheme, Platform } from 'react-native';
import Colors from '@/constants/Colors';
import { LocalCache } from '../lib/storage';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: (typeof Colors)['light'];
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  colors: Colors.light,
  toggleTheme: () => {},
  setTheme: () => {},
});

const THEME_STORAGE_KEY = 'theme';
const WEB_STORAGE_KEY = 'unicalc_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceScheme = useDeviceColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadSavedTheme() {
      try {
        let saved: string | null = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          saved = window.localStorage.getItem(WEB_STORAGE_KEY);
        }
        if (!saved) {
          saved = await LocalCache.get<string>(THEME_STORAGE_KEY);
        }

        if (saved === 'dark' || saved === 'light') {
          setThemeState(saved);
          if (Platform.OS === 'web' && typeof document !== 'undefined') {
            if (saved === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
        } else if (deviceScheme === 'dark') {
          setThemeState('dark');
        }
      } catch (e) {
        console.warn('Failed to load theme preference:', e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadSavedTheme();
  }, [deviceScheme]);

  const setTheme = async (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem(WEB_STORAGE_KEY, mode);
        if (typeof document !== 'undefined') {
          if (mode === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      }
      await LocalCache.set(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to persist theme:', e);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const colors = Colors[theme] || Colors.light;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        colors,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

