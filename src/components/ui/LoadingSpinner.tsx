import React from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";

import { Spacing } from "@/theme/Spacing";
import { Fonts } from "@/theme/Fonts";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "large",
  color = "#0a7ea4",
  message,
  fullScreen = false,
}) => {
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
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
    backgroundColor: "#fff",
  },
  message: {
    marginTop: Spacing.medium,
    fontSize: Fonts.sizeMedium,
    color: "#666",
  },
});
