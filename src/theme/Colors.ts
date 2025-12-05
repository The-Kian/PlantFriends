/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#34a1eb",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    headerBackground: "#A1CEDC",
    error: "#FF5252",
    border: "#E2E8F0",
    greenButton: "#00A86B",
    redButton: "#FF0000",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    headerBackground: "#1D3D47",
    error: "#FF5252",
    border: "#39424E",
    greenButton: "#00A86B",
    redButton: "#FF0000",
  },
};
