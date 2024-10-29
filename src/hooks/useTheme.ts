import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '@theme/index';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};