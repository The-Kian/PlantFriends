// AuthForm.tsx

import { useState, useContext } from 'react';
import { View, Alert } from 'react-native';

import DatePickerField from '@components/ui/Input/DatePickerField';
import TextInputField from '@components/ui/Input/TextInputField';
import { ThemedView } from '@components/ui/Views/ThemedView';
import { AuthContext } from '@context/auth/AuthProvider';
import { AuthProps } from '@context/auth/AuthTypes';

import ThemedButton from '../ui/Buttons/ThemedButton';

const AuthForm = ({ authScreenType, onSubmit }: AuthProps) => {
  const { user } = useContext(AuthContext);
  const [enteredEmail, setEnteredEmail] = useState(
    user?.email ?? 'test@gmail.com'
  );
  const [enteredConfirmEmail, setEnteredConfirmEmail] = useState('test@gmail.com');
  const [enteredPassword, setEnteredPassword] = useState('password');
  const [enteredConfirmPassword, setEnteredConfirmPassword] = useState('password');
  const [enteredDisplayName, setEnteredDisplayName] = useState(
    user?.displayName ?? ''
  );
  const [enteredDateOfBirth, setEnteredDateOfBirth] = useState(
    new Date('1997-12-12')
  );

  const submitHandler = () => {
    onSubmit({
      email: enteredEmail,
      password: enteredPassword,
      displayName: enteredDisplayName,
      dateOfBirth: enteredDateOfBirth,
      confirmEmail: enteredConfirmEmail,
      confirmPassword: enteredConfirmPassword,
    });
  };

  function updateInputValueHandler(inputType: string, enteredValue: any) {
    switch (inputType) {
      case 'email':
        setEnteredEmail(enteredValue);
        break;
      case 'confirmEmail':
        setEnteredConfirmEmail(enteredValue);
        break;
      case 'password':
        setEnteredPassword(enteredValue);
        break;
      case 'confirmPassword':
        setEnteredConfirmPassword(enteredValue);
        break;
      case 'displayName':
        setEnteredDisplayName(enteredValue);
        break;
      case 'dateOfBirth':
        setEnteredDateOfBirth(enteredValue);
        break;
    }
  }

  return (
    <View testID='AuthForm-View'>
      <View>
        {authScreenType !== 'update' && (
          <TextInputField
            label="Email Address"
            onChangeText={(text) => updateInputValueHandler('email', text)}
            value={enteredEmail}
            keyboardType="email-address"
          />
        )}
        {authScreenType === 'signUp' && (
          <View>
            <TextInputField
              label="Confirm Email Address"
              onChangeText={(text) => updateInputValueHandler('confirmEmail', text)}
              value={enteredConfirmEmail}
              keyboardType="email-address"
            />
            <DatePickerField
              label="Date of Birth"
              date={enteredDateOfBirth}
              onDateChange={(date) => updateInputValueHandler('dateOfBirth', date)}
            />
          </View>
        )}
        {authScreenType !== 'login' && (
          <TextInputField
            label="Display Name"
            onChangeText={(text) => updateInputValueHandler('displayName', text)}
            value={enteredDisplayName}
          />
        )}
        {authScreenType !== 'update' && (
          <TextInputField
            label="Password"
            onChangeText={(text) => updateInputValueHandler('password', text)}
            value={enteredPassword}
            secureTextEntry={true}
          />
        )}
        {authScreenType === 'signUp' && (
          <TextInputField
            label="Confirm Password"
            onChangeText={(text) => updateInputValueHandler('confirmPassword', text)}
            value={enteredConfirmPassword}
            secureTextEntry={true}
          />
        )}
        <ThemedView>
          <ThemedButton
            onPress={submitHandler}
            title={
              authScreenType === 'login'
                ? 'Log In'
                : authScreenType === 'signUp'
                ? 'Sign Up'
                : 'Update Details'
            }
          />
        </ThemedView>
      </View>
    </View>
  );
};

export default AuthForm;
