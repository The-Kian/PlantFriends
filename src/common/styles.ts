
// src/common/styles/defaultStyles.ts

import { StyleSheet } from 'react-native';

import { useTheme } from '@hooks/useTheme';



export const useDefaultStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.medium,
      paddingVertical: theme.spacing.medium,
    },
    text: {
      color: theme.colors.text,
      fontSize: theme.fonts.sizeMedium,
    },
  });
};
