// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from 'src/theme';

export const useTheme = () => {
  const colorScheme = useColorScheme() || 'light';
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};
