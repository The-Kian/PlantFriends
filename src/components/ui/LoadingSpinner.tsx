import React from "react";

import { View, ActivityIndicator, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/Text/ThemedText";
import { useTheme } from "@/hooks/utils/useTheme";
import { Spacing } from "@/theme/Spacing";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "large",
  color,
  message,
  fullScreen = false,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        fullScreen ? styles.fullScreenContainer : styles.container,
        fullScreen && { backgroundColor: colors.background },
      ]}
    >
      <ActivityIndicator size={size} color={color ?? colors.primary} />
      {message && (
        <ThemedText type="caption" style={styles.message}>
          {message}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.large,
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    marginTop: Spacing.medium,
  },
});
