import { StyleSheet } from "react-native";

import { useTheme } from "@/hooks/utils/useTheme";

export const useCustomizationStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    // Bottom sheet: dimmed backdrop with the form sliding up from the bottom.
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: "flex-end",
    },
    sheet: {
      maxHeight: "92%",
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      overflow: "hidden",
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
      marginTop: theme.spacing.small + 2,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.large - 4,
      paddingTop: theme.spacing.small,
    },
    modal: {
      paddingHorizontal: theme.spacing.large - 4,
      paddingBottom: theme.spacing.xl,
    },
    content: {
      paddingTop: theme.spacing.small,
    },
    title: {
      flex: 1,
      fontSize: theme.fonts.sizeXLarge,
      fontWeight: theme.fonts.weightBold,
      color: theme.colors.text,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: theme.radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surfaceMuted,
    },
    buttonContainer: {
      flexDirection: "row",
      marginTop: theme.spacing.small,
    },
    button: {
      flex: 1,
    },
  });
};
