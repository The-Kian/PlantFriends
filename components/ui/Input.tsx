import { View, Text, TextInput, KeyboardTypeOptions } from 'react-native';
import { inputStyles } from '@/styles/inputStyles';

function Input(props: {
  label: string,
  keyboardType?: KeyboardTypeOptions,
  onUpdateValue: ((enteredValue: string) => void),
  secure?: boolean,
  value: string,
  isInvalid: boolean,
}) {
	return (
		<View style={inputStyles.inputContainer}>
			<Text style={[inputStyles.label, props.isInvalid && inputStyles.labelInvalid]}>
				{props.label}
			</Text>
			<TextInput
				style={[inputStyles.input, props.isInvalid && inputStyles.inputInvalid]}
				autoCapitalize="none"
				keyboardType={props.keyboardType}
				secureTextEntry={props.secure}
				onChangeText={props.onUpdateValue}
				value={props.value}
			/>
		</View>
	)
}

export default Input

