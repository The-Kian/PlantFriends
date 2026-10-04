import { Ionicons } from "@expo/vector-icons";
import { PropsWithChildren, useState } from "react";

import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ui/Text/ThemedText";
import { useTheme } from "@/hooks/utils/useTheme";
import { Spacing } from "@/theme/Spacing";

type CollapsibleProps = PropsWithChildren & {
  title: string;
  count?: number;
  defaultOpen?: boolean;
};

export function Collapsible({
  children,
  title,
  count,
  defaultOpen = false,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { colors, radius } = useTheme();

  return (
    <View>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        testID={`collapsible-${title}`}
      >
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
        {count != null && (
          <View
            style={[
              styles.countBadge,
              { backgroundColor: colors.primaryMuted, borderRadius: radius.pill },
            ]}
          >
            <ThemedText style={[styles.countText, { color: colors.primary }]}>
              {count}
            </ThemedText>
          </View>
        )}
        <Ionicons
          name={isOpen ? "chevron-down" : "chevron-forward-outline"}
          size={20}
          color={colors.icon}
          testID="collapsible-icon"
        />
      </TouchableOpacity>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.small,
    paddingVertical: Spacing.small,
  },
  title: {
    flex: 1,
    fontSize: 18,
  },
  countBadge: {
    minWidth: 28,
    paddingHorizontal: Spacing.small,
    paddingVertical: 2,
    alignItems: "center",
  },
  countText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  content: {
    marginTop: Spacing.small,
  },
});
