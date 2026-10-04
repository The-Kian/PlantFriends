import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { type ReactNode } from "react";

import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/Text/ThemedText";
import { useTheme } from "@/hooks/utils/useTheme";
import { Spacing } from "@/theme/Spacing";

type ScreenHeaderProps = {
  title?: string;
  right?: ReactNode;
  /** Render over content (e.g. a hero image) without taking up layout space. */
  floating?: boolean;
};

export default function ScreenHeader({
  title,
  right,
  floating = false,
}: ScreenHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, radius, shadow } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.small },
        floating && styles.floating,
      ]}
    >
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        testID="screen-header-back"
        hitSlop={8}
        style={({ pressed }) => [
          styles.backButton,
          { backgroundColor: colors.surface, borderRadius: radius.pill },
          floating && shadow,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={1}>
        {title ?? ""}
      </ThemedText>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.medium,
    paddingBottom: Spacing.small,
    gap: Spacing.small,
  },
  floating: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
  },
  right: {
    width: 40,
    alignItems: "flex-end",
  },
});
