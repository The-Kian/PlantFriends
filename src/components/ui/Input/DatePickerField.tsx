// DatePickerField.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';

import { TouchableOpacity, Platform } from 'react-native';


import TextInputField from './TextInputField';

interface DatePickerFieldProps {
  label: string;
  date: Date;
  onDateChange: (date: Date) => void;
}

const DatePickerField = ({ label, date, onDateChange }: DatePickerFieldProps) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  return (
    <TouchableOpacity onPress={() => setShowPicker(true)}>
      <TextInputField
        label={label}
        value={date.toDateString()}
        editable={false}
        pointerEvents="none"
      />
      {showPicker && (
        <DateTimePicker
          testID='date-picker'
          value={date}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </TouchableOpacity>
  );
};

export default DatePickerField;
