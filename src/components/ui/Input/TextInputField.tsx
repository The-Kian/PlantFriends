// TextInputField.tsx

import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { ThemedText } from '@components/ui/Text/ThemedText';
import { useInputStyles } from './Input.styles';

interface TextInputFieldProps extends TextInputProps {
  label: string;
}

const TextInputField = ({ label, ...props }: TextInputFieldProps) => {
  const styles = useInputStyles();

  return (
    <View>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <TextInput
        {...props}
        style={styles.textInput}
        placeholder={`Enter ${label}`}
        placeholderTextColor={styles.inputLabel.color}
      />
    </View>
  );
};

export default TextInputField;
