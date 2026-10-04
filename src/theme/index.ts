// src/theme/index.ts
import { ViewStyle } from "react-native";

import { Colors, ThemeColors } from "./Colors";
import { Fonts } from "./Fonts";
import { Radius, Spacing } from "./Spacing";

// Soft, low-contrast elevation used for cards and floating surfaces.
const makeShadow = (colors: ThemeColors): ViewStyle => ({
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 2,
});

export const lightTheme = {
  dark: false,
  colors: Colors.light,
  spacing: Spacing,
  radius: Radius,
  fonts: Fonts,
  shadow: makeShadow(Colors.light),
};

export const darkTheme = {
  dark: true,
  colors: Colors.dark,
  spacing: Spacing,
  radius: Radius,
  fonts: Fonts,
  shadow: makeShadow(Colors.dark),
};

export type Theme = typeof lightTheme;
