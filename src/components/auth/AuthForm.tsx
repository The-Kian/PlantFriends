import { useState } from "react";
import { AuthProps } from "@context/auth/AuthTypes";

import { View } from "react-native";
import ThemedButton from "../ui/Buttons/ThemedButton";
import Input from "@components/ui/Input/Input";

import { useContext } from "react";
import { AuthContext } from "@context/auth/AuthProvider";
import { ThemedView } from "@components/ui/Views/ThemedView";

const AuthForm = ({
  authScreenType,
  onSubmit,
  credentialsInvalid,
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

  const {
    email: emailIsInvalid,
    confirmEmail: emailsDontMatch,
    password: passwordIsInvalid,
    confirmPassword: passwordsDontMatch,
  } = credentialsInvalid;

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
            placeholder="Email Address"
            onChangeText={updateInputValueHandler.bind(this, "email")}
            value={enteredEmail}
            keyboardType="email-address"
            isInvalid={emailIsInvalid}
          />
        )}
        {authScreenType == "signUp" && (
          <View>
            <Input
              placeholder="Confirm Email Address"
              onChangeText={updateInputValueHandler.bind(this, "confirmEmail")}
              value={enteredConfirmEmail}
              keyboardType="email-address"
              isInvalid={emailsDontMatch}
            />
            <Input
              placeholder="Date of Birth"
              onChangeText={updateInputValueHandler.bind(this, "dateOfBirth")}
              value={enteredDateofBirth}
              keyboardType="number-pad"
              isInvalid={false}
            />
          </View>
        )}
        {authScreenType !== "login" && (
          <Input
            placeholder="Display Name"
            onChangeText={updateInputValueHandler.bind(this, "displayName")}
            value={enteredDisplayName}
            isInvalid={false}
          />
        )}
        {authScreenType !== "update" && (
          <Input
            placeholder="Password"
            onChangeText={updateInputValueHandler.bind(this, "password")}
            secure
            value={enteredPassword}
            isInvalid={passwordIsInvalid}
          />
        )}
        {authScreenType == "signUp" && (
          <Input
            placeholder="Confirm Password"
            onChangeText={updateInputValueHandler.bind(this, "confirmPassword")}
            secure
            value={enteredConfirmPassword}
            isInvalid={passwordsDontMatch}
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
