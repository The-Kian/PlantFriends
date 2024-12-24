// PickerField.tsx

import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@components/ui/Text/ThemedText';
import { Picker } from '@react-native-picker/picker';

import { useInputStyles } from './Input.styles';

interface PickerFieldProps {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: string[];
}

const PickerField = ({ label, selectedValue, onValueChange, options }: PickerFieldProps) => {
  const styles = useInputStyles();
  return (
    <View>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.picker}
          accessibilityLabel={`${label} input field`}
        >
          {options.map((option) => (
            <Picker.Item label={option} value={option} key={option} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

export default PickerField;
