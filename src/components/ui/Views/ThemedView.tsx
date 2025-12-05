import { StyleProp, View, ViewStyle, type ViewProps } from "react-native";

import { useTheme } from "@/hooks/utils/useTheme";

export type ThemedViewProps = ViewProps & {
  style?: StyleProp<ViewStyle>;
};

export function ThemedView({ style, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return (
    <View
      style={[{ backgroundColor: theme.colors.background }, style]}
      {...otherProps}
    />
  );
}
