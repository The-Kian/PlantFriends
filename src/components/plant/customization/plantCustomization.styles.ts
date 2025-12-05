import { StyleSheet } from "react-native";

import { useTheme } from "@/hooks/utils/useTheme";

export const useCustomizationStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
      justifyContent: "center",
      alignItems: "center",
    },
    modal: {
      width: "85%",
      borderRadius: 12,
      padding: 20,
      // Shadows for iOS
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      // Elevation for Android
      elevation: 5,
      backgroundColor: theme.colors.background,
    },
    content: {
      backgroundColor: theme.colors.tint,
    },
    title: {
      fontSize: theme.fonts.sizeLarge,
      fontWeight: theme.fonts.weightBold as "700",
      marginBottom: 20,
      textAlign: "left",
      color: theme.colors.text,
    },
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
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    button: {
      flex: 1,
      marginHorizontal: 5,
    },
  });
};
