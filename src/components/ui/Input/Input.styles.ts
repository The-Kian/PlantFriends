import { StyleSheet } from "react-native";

import { useTheme } from "@hooks/useTheme";

export const useInputStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    textInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: theme.fonts.sizeMedium,
      color: theme.colors.text,
      marginBottom: 20,
      backgroundColor: theme.colors.background,
    },
    inputLabel: {
      fontSize: theme.fonts.sizeSmall,
      color: theme.colors.text,
      marginBottom: 8,
    },
    picker: {
      color: theme.colors.text,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      marginBottom: 20,
      backgroundColor: theme.colors.background,
    },
  });
};
