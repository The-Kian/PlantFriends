// AuthForm.tsx

import { useState, useContext } from "react";

import { View } from "react-native";

import TextInputField from "@/components/ui/Input/TextInputField";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { AuthContext } from "@/context/auth/AuthProvider";
import { AuthProps } from "@/context/auth/AuthTypes";

import ThemedButton from "../ui/Buttons/ThemedButton";

// Dev builds only fill the form in when explicitly asked to, so they behave
// like release builds by default.
const devPrefill = __DEV__ && process.env.EXPO_PUBLIC_DEV_PREFILL === "true";

const AuthForm = ({ authScreenType, onSubmit }: AuthProps) => {
  const { user } = useContext(AuthContext);
  const [enteredEmail, setEnteredEmail] = useState(
    user?.email ?? (devPrefill ? "test@gmail.com" : "")
  );
  const [enteredConfirmEmail, setEnteredConfirmEmail] = useState(
    devPrefill ? "test@gmail.com" : ""
  );
  const [enteredPassword, setEnteredPassword] = useState(
    devPrefill ? "password" : ""
  );
  const [enteredConfirmPassword, setEnteredConfirmPassword] = useState(
    devPrefill ? "password" : ""
  );
  const [enteredDisplayName, setEnteredDisplayName] = useState(
    user?.displayName ?? (devPrefill ? "Test User" : "")
  );

  const submitHandler = () => {
    onSubmit({
      email: enteredEmail,
      password: enteredPassword,
      displayName: enteredDisplayName,
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
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
        )}
        {authScreenType === "signUp" && (
          <TextInputField
            label="Confirm Email Address"
            onChangeText={setEnteredConfirmEmail}
            value={enteredConfirmEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
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
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={
              authScreenType === "signUp" ? "new-password" : "current-password"
            }
            textContentType={
              authScreenType === "signUp" ? "newPassword" : "password"
            }
          />
        )}
        {authScreenType === "signUp" && (
          <TextInputField
            label="Confirm Password"
            onChangeText={setEnteredConfirmPassword}
            value={enteredConfirmPassword}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
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
