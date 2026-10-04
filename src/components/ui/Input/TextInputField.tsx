// TextInputField.tsx

import React, { useState } from "react";

import { TextInput, TextInputProps, View } from "react-native";

import { ThemedText } from "@/components/ui/Text/ThemedText";

import { useInputStyles } from "./Input.styles";

interface TextInputFieldProps extends TextInputProps {
  label: string;
}

const TextInputField = ({
  label,
  onFocus,
  onBlur,
  placeholder,
  ...props
}: TextInputFieldProps) => {
  const styles = useInputStyles();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <TextInput
        {...props}
        accessibilityLabel={`${label} input field`}
        style={[styles.textInput, focused && styles.textInputFocused]}
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
    </View>
  );
};

export default TextInputField;
