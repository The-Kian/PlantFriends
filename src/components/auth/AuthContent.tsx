import { NavigationProp, useNavigation } from "@react-navigation/native";

import { Alert } from "react-native";

import { RootStackParamList } from "@/components/navigation/types";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { AuthProps, CredentialsType } from "@/context/auth/AuthTypes";
import validateCredentials from "@/helpers/auth/validateCredentials";

import AuthForm from "./AuthForm";
import ThemedButton from "../ui/Buttons/ThemedButton";

function AuthContent({ authScreenType, onSubmit }: AuthProps) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  function switchAuthModeHandler() {
    if (authScreenType === "login") {
      navigation.navigate("SignUp");
    } else if (authScreenType === "signUp") {
      navigation.navigate("Login");
    }
  }

  function submitHandler(credentials: CredentialsType) {
    const validationResult = validateCredentials(credentials, authScreenType);

    if (!validationResult.isValid) {
      Alert.alert("Invalid input", "Please check your entered credentials.");
      return;
    }
    onSubmit(credentials);
  }

  return (
    <ThemedView testID={"AuthContent-View"}>
      <AuthForm onSubmit={submitHandler} authScreenType={authScreenType} />
      <ThemedView>
        {authScreenType !== "update" && (
          <ThemedButton
            onPress={switchAuthModeHandler}
            title={
              authScreenType === "login" ? "Create a new user" : "Login instead"
            }
          />
        )}
      </ThemedView>
    </ThemedView>
  );
}

export default AuthContent;
