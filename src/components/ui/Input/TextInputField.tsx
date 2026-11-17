// TextInputField.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";

import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { ThemedText } from "@/components/ui/Text/ThemedText";
import { useTheme } from "@/hooks/utils/useTheme";

import { useInputStyles } from "./Input.styles";

interface TextInputFieldProps extends TextInputProps {
  label: string;
}

const TextInputField = ({
  label,
  onFocus,
  onBlur,
  placeholder,
  accessibilityLabel,
  secureTextEntry,
  ...props
}: TextInputFieldProps) => {
  const styles = useInputStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <View style={styles.fieldContainer}>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <View>
        <TextInput
          {...props}
          secureTextEntry={isPassword && !revealed}
          accessibilityLabel={accessibilityLabel ?? `${label} input field`}
          style={[
            styles.textInput,
            focused && styles.textInputFocused,
            isPassword && local.passwordInput,
          ]}
          placeholder={placeholder ?? `Enter ${label}`}
          placeholderTextColor={styles.placeholder.color}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {isPassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            onPress={() => setRevealed((r) => !r)}
            hitSlop={4}
            style={local.toggle}
          >
            <Ionicons
              name={revealed ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.icon}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const local = StyleSheet.create({
  passwordInput: {
    paddingRight: 52,
  },
  toggle: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TextInputField;
