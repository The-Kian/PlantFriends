import { Picker } from "@react-native-picker/picker";

import { View } from "react-native";

import { ThemedText } from "@/components/ui/Text/ThemedText";

import { useInputStyles } from "./Input.styles";

interface PickerFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

const PickerField = ({
  label,
  value,
  onValueChange,
  options,
  placeholder,
}: PickerFieldProps) => {
  const styles = useInputStyles();

  return (
    <View>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={styles.picker}
          accessibilityLabel={`${label} input field`}
        >
          <Picker.Item label={placeholder} value="" />
          {options.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

export default PickerField;
