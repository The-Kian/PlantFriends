import { Alert, View } from "react-native";
import { useState } from "react";

import AuthForm from "./AuthForm";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { AuthProps, CredentialsType } from "@context/auth/AuthTypes";
import { ThemedView } from "../ThemedView";
import ThemedButton from "../ui/ThemedButton";
import { RootStackParamList } from "@components/navigation/types";


function AuthContent({ authScreenType, onSubmit }: AuthProps) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [credentialsInvalid, setCredentialsInvalid] = useState({
    email: false,
    password: false,
    confirmEmail: false,
    confirmPassword: false,
  });

  function switchAuthModeHandler() {
    if (authScreenType == "login") {
      navigation.navigate("SignUp");
    } else if (authScreenType == "signUp") {
      navigation.navigate("Login");
    }
  }

  function submitHandler(credentials: CredentialsType) {
    // eslint-disable-next-line prefer-const
    let { email, confirmEmail, password, confirmPassword } = credentials;

    email = email.trim();
    password = password.trim();

    const emailIsValid = email.includes("@");
    const passwordIsValid = password.length > 6;
    const emailsAreEqual = email === confirmEmail;
    const passwordsAreEqual = password === confirmPassword;

    if (!emailIsValid || !passwordIsValid || (authScreenType == "signUp" && (!emailsAreEqual || !passwordsAreEqual))) {
      Alert.alert("Invalid input", "Please check your entered credentials.");
      setCredentialsInvalid({
        email: !emailIsValid,
        confirmEmail: !emailIsValid || !emailsAreEqual,
        password: !passwordIsValid,
        confirmPassword: !passwordIsValid || !passwordsAreEqual,
      });
      return;
    }
    onSubmit(credentials);
  }

  return (
    <ThemedView >
      <AuthForm onSubmit={submitHandler} credentialsInvalid={credentialsInvalid} authScreenType={authScreenType} />
      <ThemedView>
        {authScreenType !== "update" && (
          <ThemedButton onPress={switchAuthModeHandler}>
            {authScreenType === "login" ? "Create a new user" : "Login instead"}
          </ThemedButton>
        )}
      </ThemedView>
    </ThemedView>
  );
}

export default AuthContent;
