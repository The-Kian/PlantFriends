import React from "react";

import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { Fonts } from "@/theme/Fonts";
import { Spacing } from "@/theme/Spacing";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "📭",
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.large,
  },
  icon: {
    fontSize: 56,
    marginBottom: Spacing.medium,
  },
  title: {
    fontSize: Fonts.sizeLarge,
    fontWeight: "600",
    marginBottom: Spacing.small,
    textAlign: "center",
    color: "#11181C",
  },
  message: {
    fontSize: Fonts.sizeMedium,
    color: "#666",
    textAlign: "center",
    marginBottom: Spacing.large,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#0a7ea4",
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
    borderRadius: 8,
    marginTop: Spacing.medium,
  },
  buttonText: {
    color: "#fff",
    fontSize: Fonts.sizeMedium,
    fontWeight: "600",
  },
});
