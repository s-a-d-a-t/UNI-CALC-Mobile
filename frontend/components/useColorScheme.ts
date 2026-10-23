import { useTheme } from '@/src/context/ThemeContext';

export const useColorScheme = () => {
  const { theme } = useTheme();
  return theme;
};
