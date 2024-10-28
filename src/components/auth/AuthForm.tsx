import { useState } from "react";
import { AuthProps } from "@context/auth/AuthTypes";

import { View } from "react-native";
import ThemedButton from "../ui/Buttons/ThemedButton";
import Input from "@components/ui/Input/TextInputField";

import { useContext } from "react";
import { AuthContext } from "@context/auth/AuthProvider";
import { ThemedView } from "@components/ui/Views/ThemedView";

const AuthForm = ({
  authScreenType,
  onSubmit,
}: AuthProps) => {
  const { user } = useContext(AuthContext);

  const [enteredEmail, setEnteredEmail] = useState(
    user?.email ?? "test@gmail.com"
  );
  const [enteredConfirmEmail, setEnteredConfirmEmail] =
    useState("test@gmail.com");
  const [enteredPassword, setEnteredPassword] = useState("password");
  const [enteredConfirmPassword, setEnteredConfirmPassword] =
    useState("password");

  const [enteredDisplayName, setEnteredDisplayName] = useState(
    user?.displayName ?? ""
  );
  const [enteredDateofBirth, setEnteredDateOfBirth] = useState(
    user?.displayName ?? "12/12/1997"
  );

  function updateInputValueHandler(inputType: string, enteredValue: string) {
    switch (inputType) {
      case "email":
        setEnteredEmail(enteredValue);
        break;
      case "confirmEmail":
        setEnteredConfirmEmail(enteredValue);
        break;
      case "password":
        setEnteredPassword(enteredValue);
        break;
      case "confirmPassword":
        setEnteredConfirmPassword(enteredValue);
        break;
      case "displayName":
        setEnteredDisplayName(enteredValue);
        break;
      case "dateOfBirth":
        setEnteredDateOfBirth(enteredValue);
        break;
    }
  }

  function submitHandler() {
    onSubmit({
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword,
      confirmPassword: enteredConfirmPassword,
      displayName: enteredDisplayName,
    });
  }

  return (
    <View>
      <View>
        {authScreenType !== "update" && (
          <Input
            label="Email Address"
            onChangeText={updateInputValueHandler.bind(this, "email")}
            value={enteredEmail}
            keyboardType="email-address"
          />
        )}
        {authScreenType === "signUp" && (
          <View>
            <Input
              label="Confirm Email Address"
              onChangeText={updateInputValueHandler.bind(this, "confirmEmail")}
              value={enteredConfirmEmail}
              keyboardType="email-address"
            />
            {/* // change */}
            <Input
              label="Date of Birth"
              onChangeText={updateInputValueHandler.bind(this, "dateOfBirth")}
              value={enteredDateofBirth}
              keyboardType="number-pad"
            />
          </View>
        )}
        {authScreenType !== "login" && (
          <Input
          label="Display Name"
            onChangeText={updateInputValueHandler.bind(this, "displayName")}
            value={enteredDisplayName}
          />
        )}
        {authScreenType !== "update" && (
          <Input
            label="Password"
            onChangeText={updateInputValueHandler.bind(this, "password")}
            value={enteredPassword}
            secureTextEntry={true}
          />
        )}
        {authScreenType === "signUp" && (
          <Input
            label="Confirm Password"
            onChangeText={updateInputValueHandler.bind(this, "confirmPassword")}
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
                : "Update details"
            }
          />
        </ThemedView>
      </View>
    </View>
  );
};

export default AuthForm;
