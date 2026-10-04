import { ActivityIndicator, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/Text/ThemedText";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { useTheme } from "@/hooks/utils/useTheme";
import { Spacing } from "@/theme/Spacing";

function LoadingOverlay(props: { message: string }) {
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator
        size="large"
        color={colors.primary}
        testID="activity-indicator"
      />
      <ThemedText type="caption">{props.message}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.medium,
    padding: Spacing.xl,
  },
});

export default LoadingOverlay;
