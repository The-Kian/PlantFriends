import { Text, type TextProps, StyleSheet } from "react-native";

import { useTheme } from "@/hooks/utils/useTheme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "default"
    | "title"
    | "defaultSemiBold"
    | "subtitle"
    | "link"
    | "caption"
    | "label";
};

export function ThemedText({
  style,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  const color =
    type === "link"
      ? theme.colors.primary
      : type === "caption" || type === "label"
        ? theme.colors.textMuted
        : theme.colors.text;

  return <Text style={[{ color }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  link: {
    lineHeight: 24,
    fontSize: 16,
    fontWeight: "600",
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
