import { StyleSheet } from "react-native";

import { useTheme } from "@/hooks/utils/useTheme";

export const useInputStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    fieldContainer: {
      width: "100%",
      marginBottom: theme.spacing.medium,
    },
    textInput: {
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.medium,
      paddingHorizontal: theme.spacing.medium,
      paddingVertical: 14,
      fontSize: theme.fonts.sizeMedium,
      color: theme.colors.text,
      width: "100%",
      backgroundColor: theme.colors.surface,
    },
    textInputFocused: {
      borderColor: theme.colors.primary,
    },
    inputLabel: {
      fontSize: theme.fonts.sizeSmall,
      fontWeight: theme.fonts.weightSemiBold,
      color: theme.colors.text,
      marginBottom: 6,
      lineHeight: 20,
    },
    placeholder: {
      color: theme.colors.textMuted,
    },
    picker: {
      color: theme.colors.text,
    },
    pickerContainer: {
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.medium,
      backgroundColor: theme.colors.surface,
      width: "100%",
      overflow: "hidden",
    },
  });
};
