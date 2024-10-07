import { View, Text, TextInput, KeyboardTypeOptions } from 'react-native';
import { useInputStyles } from './Input.styles';


function Input(props: {
  placeholder?: string,
  keyboardType?: KeyboardTypeOptions,
  onChangeText: ((enteredValue: string) => void),
  secure?: boolean,
  value: string,
  isInvalid: boolean,
}) {

	const inputStyles = useInputStyles();
	return (
		<View style={inputStyles.inputContainer}>
			<TextInput
				style={[inputStyles.input, props.isInvalid && inputStyles.inputInvalid]}
				placeholder={props.placeholder}
				autoCapitalize="none"
				keyboardType={props.keyboardType}
				secureTextEntry={props.secure}
				onChangeText={props.onChangeText}
				value={props.value}
			/>
		</View>
	)
}

export default Input

