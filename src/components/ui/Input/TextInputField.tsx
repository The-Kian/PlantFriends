// TextInputField.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";

import { Pressable, StyleSheet, TextInput, TextInputProps, View } from "react-native";

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
  accessibilityLabel,
  ...props
}: TextInputFieldProps) => {
  const styles = useInputStyles();
  const [focused, setFocused] = useState(false);
  // Password fields get a show/hide button.
  const isSecret = props.secureTextEntry === true;
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.fieldContainer}>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <View>
      <TextInput
        {...props}
        secureTextEntry={isSecret ? hidden : props.secureTextEntry}
        accessibilityLabel={accessibilityLabel ?? `${label} input field`}
        style={[
          styles.textInput,
          focused && styles.textInputFocused,
          isSecret && toggleStyles.inputWithToggle,
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
      {isSecret ? (
        <Pressable
          onPress={() => setHidden((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={`${hidden ? "Show" : "Hide"} ${label}`}
          hitSlop={8}
          style={toggleStyles.toggle}
        >
          <Ionicons
            name={hidden ? "eye-outline" : "eye-off-outline"}
            size={22}
            color={styles.placeholder.color}
          />
        </Pressable>
      ) : null}
      </View>
    </View>
  );
};

const toggleStyles = StyleSheet.create({
  inputWithToggle: {
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
