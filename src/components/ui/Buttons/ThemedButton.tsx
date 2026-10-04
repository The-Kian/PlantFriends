import { Ionicons } from "@expo/vector-icons";
import { type ComponentProps } from "react";

import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/ui/Text/ThemedText";

import { useThemedButtonStyles } from "./ThemedButton.styles";

export type ThemedButtonVariant =
  | "default"
  | "accept"
  | "decline"
  | "secondary"
  | "ghost";

type ThemedButtonProps = {
  title?: string;
  onPress: () => void;
  variant?: ThemedButtonVariant;
  icon?: ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
  additionalStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

function ThemedButton({
  title,
  onPress,
  additionalStyle,
  icon,
  disabled = false,
  testID = "themed-button",
  variant = "default",
}: ThemedButtonProps) {
  const buttonStyles = useThemedButtonStyles();

  let variantStyle: StyleProp<ViewStyle> = {};
  let variantTextStyle: StyleProp<TextStyle> = {};
  if (variant === "accept") {
    variantStyle = buttonStyles.acceptButton;
  } else if (variant === "decline") {
    variantStyle = buttonStyles.cancelButton;
    variantTextStyle = buttonStyles.cancelButtonText;
  } else if (variant === "secondary") {
    variantStyle = buttonStyles.secondaryButton;
    variantTextStyle = buttonStyles.secondaryButtonText;
  } else if (variant === "ghost") {
    variantStyle = buttonStyles.ghostButton;
    variantTextStyle = buttonStyles.ghostButtonText;
  }

  const textStyle = [buttonStyles.buttonText, variantTextStyle];

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        buttonStyles.button,
        variantStyle,
        additionalStyle,
        pressed && buttonStyles.buttonPressed,
        disabled && buttonStyles.buttonDisabled,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={StyleSheet.flatten(textStyle)?.color as string | undefined}
        />
      )}
      <ThemedText style={textStyle}>{title}</ThemedText>
    </Pressable>
  );
}

export default ThemedButton;
