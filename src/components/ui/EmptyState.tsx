import { Ionicons } from "@expo/vector-icons";
import React, { type ComponentProps } from "react";

import { View, StyleSheet } from "react-native";

import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import { useTheme } from "@/hooks/utils/useTheme";
import { Spacing } from "@/theme/Spacing";

interface EmptyStateProps {
  icon?: ComponentProps<typeof Ionicons>["name"];
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "leaf-outline",
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const { colors, radius } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: colors.primaryMuted, borderRadius: radius.pill },
        ]}
      >
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {message && (
        <ThemedText type="caption" style={styles.message}>
          {message}
        </ThemedText>
      )}
      {actionLabel && onAction && (
        <ThemedButton
          title={actionLabel}
          onPress={onAction}
          icon="add"
          additionalStyle={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.medium,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  message: {
    textAlign: "center",
    maxWidth: 280,
  },
  button: {
    marginTop: Spacing.large,
  },
});
