import { StyleSheet } from 'react-native';
import { useTheme } from 'src/hooks/useTheme';

export const useThemedButtonStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    button: {
      borderRadius: 6,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.medium,
      backgroundColor: theme.colors.background,
      elevation: 2,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      marginTop: theme.spacing.small,
    },
    iconButton: {
      margin: theme.spacing.small,
      borderRadius: 20,
    },
    buttonPressed: {
      opacity: 0.7,
    },
    buttonText: {
      textAlign: 'center',
      color: theme.colors.text,
      fontSize: theme.fonts.sizeMedium,
      fontWeight: theme.fonts.weightBold as "700",
    },
  });
};
