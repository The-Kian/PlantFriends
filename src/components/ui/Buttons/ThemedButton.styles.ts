import { StyleSheet } from "react-native";

import { useTheme } from "@/hooks/utils/useTheme";

export const useThemedButtonStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    button: {
      minHeight: 50,
      borderRadius: theme.radius.medium,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.small,
      paddingHorizontal: theme.spacing.large,
      paddingVertical: theme.spacing.small,
      backgroundColor: theme.colors.primary,
      marginTop: theme.spacing.small,
    },
    buttonPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      textAlign: "center",
      color: theme.colors.onPrimary,
      fontSize: theme.fonts.sizeMedium,
      fontWeight: theme.fonts.weightSemiBold,
    },
    acceptButton: {
      backgroundColor: theme.colors.primary,
    },
    cancelButton: {
      backgroundColor: theme.colors.errorMuted,
    },
    cancelButtonText: {
      color: theme.colors.error,
    },
    secondaryButton: {
      backgroundColor: theme.colors.primaryMuted,
    },
    secondaryButtonText: {
      color: theme.colors.primary,
    },
    ghostButton: {
      backgroundColor: "transparent",
    },
    ghostButtonText: {
      color: theme.colors.primary,
    },
  });
};
