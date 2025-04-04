// PickerField.tsx

import DateTimePicker from '@react-native-community/datetimepicker';

import { TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@components/ui/Text/ThemedText';

import { useState } from 'react';


import { useInputStyles } from './Input.styles';

interface DatePickerFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

const DatePickerField = ({ label, value, onChange }: DatePickerFieldProps) => {
  const [show, setShow] = useState(false);

  const styles = useInputStyles();
  return (
    <View>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <TouchableOpacity 
        style={styles.pickerContainer}
        onPress={() => setShow(true)}
        accessibilityLabel={`${label} input field`}
    />
    {show && (
        
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShow(false);
            if (selectedDate) {
              onChange(selectedDate);
            }
          }}
        />
      )}
    </View>


  );
};

export default DatePickerField;
