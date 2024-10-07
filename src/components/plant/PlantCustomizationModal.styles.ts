import { StyleSheet } from "react-native";

import { useTheme } from "@hooks/useTheme";

export const useCustomizationModalStyles = () => {
    const theme = useTheme();

    return StyleSheet.create({
        modalOverlay: {
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
          justifyContent: "center",
          alignItems: "center",
        },
        modalContent: {
          width: "80%",
          borderRadius: 10,
          padding: 20,
          opacity: 0.9,
          backgroundColor: theme.colors.tint, 
          // Shadows for iOS
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          // Elevation for Android
          elevation: 5,
        },
        title: {
          fontSize: theme.fonts.sizeLarge,
          fontWeight: theme.fonts.weightBold as "700",
          marginBottom: 15,
          textAlign: "center",
          color: theme.colors.text,
        },
        textInput: {
          borderWidth: 1,
          borderRadius: 5,
          padding: 10,
          fontSize: theme.fonts.sizeMedium,
          color: theme.colors.text,
          marginBottom: 20,
          backgroundColor: theme.colors.background, // Use theme color
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