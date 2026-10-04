import type { PropsWithChildren, ReactNode } from "react";

import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/Text/ThemedText";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { Spacing } from "@/theme/Spacing";

type Props = PropsWithChildren<{
  title: string;
  /** Small line above the title (e.g. the household name once sharing lands). */
  eyebrow?: string;
  right?: ReactNode;
}>;

/** Top-level tab screen: compact title row + scrolling content. */
export default function ScreenScrollView({
  title,
  eyebrow,
  right,
  children,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.medium },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.titles}>
            {eyebrow ? <ThemedText type="caption">{eyebrow}</ThemedText> : null}
            <ThemedText type="title">{title}</ThemedText>
          </View>
          {right}
        </View>
        {children}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.medium + 4,
    paddingBottom: Spacing.xxl,
    gap: Spacing.medium,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.small,
  },
  titles: {
    flex: 1,
  },
});
