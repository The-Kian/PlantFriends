// AuthForm.tsx

import { useState, useContext } from "react";

import { View } from "react-native";

import DatePickerField from "@/components/ui/Input/DatePickerField";
import TextInputField from "@/components/ui/Input/TextInputField";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { AuthContext } from "@/context/auth/AuthProvider";
import { AuthProps } from "@/context/auth/AuthTypes";

import ThemedButton from "../ui/Buttons/ThemedButton";

const AuthForm = ({ authScreenType, onSubmit }: AuthProps) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const { user } = useContext(AuthContext);
  const [enteredEmail, setEnteredEmail] = useState(
    user?.email ?? (isDevelopment ? "test@gmail.com" : ""),
  );
  const [enteredConfirmEmail, setEnteredConfirmEmail] = useState(
    isDevelopment ? "test@gmail.com" : "",
  );
  const [enteredPassword, setEnteredPassword] = useState(
    isDevelopment ? "password" : "",
  );
  const [enteredConfirmPassword, setEnteredConfirmPassword] = useState(
    isDevelopment ? "password" : "",
  );
  const [enteredDisplayName, setEnteredDisplayName] = useState(
    user?.displayName ?? (isDevelopment ? "Test User" : ""),
  );
  const [enteredDateOfBirth, setEnteredDateOfBirth] = useState(
    isDevelopment ? new Date("1997-12-12") : new Date(),
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

  return (
    <View testID="AuthForm-View">
      <View>
        {authScreenType !== "update" && (
          <TextInputField
            label="Email Address"
            onChangeText={setEnteredEmail}
            value={enteredEmail}
            keyboardType="email-address"
          />
        )}
        {authScreenType === "signUp" && (
          <View>
            <TextInputField
              label="Confirm Email Address"
              onChangeText={setEnteredConfirmEmail}
              value={enteredConfirmEmail}
              keyboardType="email-address"
            />
            <DatePickerField
              label="Date of Birth"
              date={enteredDateOfBirth}
              onDateChange={setEnteredDateOfBirth}
            />
          </View>
        )}
        {authScreenType !== "login" && (
          <TextInputField
            label="Display Name"
            onChangeText={setEnteredDisplayName}
            value={enteredDisplayName}
          />
        )}
        {authScreenType !== "update" && (
          <TextInputField
            label="Password"
            onChangeText={setEnteredPassword}
            value={enteredPassword}
            secureTextEntry={true}
          />
        )}
        {authScreenType === "signUp" && (
          <TextInputField
            label="Confirm Password"
            onChangeText={setEnteredConfirmPassword}
            value={enteredConfirmPassword}
            secureTextEntry={true}
          />
        )}
        <ThemedView>
          <ThemedButton
            onPress={submitHandler}
            title={
              authScreenType === "login"
                ? "Log In"
                : authScreenType === "signUp"
                  ? "Sign Up"
                  : "Update Details"
            }
          />
        </ThemedView>
      </View>
    </View>
  );
};

export default AuthForm;
