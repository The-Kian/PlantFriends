// NumericInputField.tsx

import React from 'react';
import TextInputField from './TextInputField';

interface NumericInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}

const NumericInputField = ({ label, value, onChangeText }: NumericInputFieldProps) => (
  <TextInputField
    label={label}
    value={value}
    onChangeText={onChangeText}
    keyboardType="numeric"
  />
);

export default NumericInputField;
