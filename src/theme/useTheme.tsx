import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, Palette } from './index';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'themeMode.v1';

type ThemeValue = {
  colors: Palette;
  isDark: boolean;
  /** What the user picked; 'system' follows the phone's appearance setting. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeValue>({
  colors: lightColors,
  isDark: false,
  mode: 'system',
  setMode: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');

  const value = useMemo<ThemeValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      mode,
      setMode: (next) => {
        setModeState(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
      },
    }),
    [isDark, mode]
  );

  // Hold the first frame until the saved choice is read, so a dark-mode user
  // never sees a flash of the light theme.
  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

export function useColors(): Palette {
  return useContext(ThemeContext).colors;
}
