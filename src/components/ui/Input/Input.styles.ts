import { StyleSheet } from 'react-native';
import { useTheme } from 'src/hooks/useTheme';

export const useInputStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    inputContainer: {
      marginVertical: theme.spacing.small,
      padding: theme.spacing.small,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: theme.colors.text,
      marginHorizontal: theme.spacing.small,
    },
    label: {
      color: theme.colors.text,
      marginBottom: theme.spacing.small,
    },
    labelInvalid: {
      color: theme.colors.error,
    },
    input: {
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.small,
      backgroundColor: theme.colors.background,
      borderRadius: 4,
      fontSize: theme.fonts.sizeMedium,
      color: theme.colors.text,
    },
    inputInvalid: {
      backgroundColor: theme.colors.error || 'pink',
    },
  });
};
