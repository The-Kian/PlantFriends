import { useContext, useState } from "react";

import { StyleSheet, View } from "react-native";

import AuthContent from "@/components/auth/AuthContent";
import LoadingOverlay from "@/components/ui/Views/LoadingOverlay";
import { AuthContext } from "@/context/auth/AuthProvider";
import { CredentialsType } from "@/context/auth/AuthTypes";

function SignupScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { register } = useContext(AuthContext);

  async function signupHandler(
    email: string,
    password: string,
    displayName: string
  ) {
    setIsAuthenticating(true);
    // The name goes in with the account, so the household is named after it.
    await register({ email, password, displayName });
    setIsAuthenticating(false);
  }

  return (
    <View style={styles.screen}>
      <AuthContent
        onSubmit={(credentials: CredentialsType) => {
          signupHandler(
            credentials.email,
            credentials.password,
            credentials.displayName
          );
        }}
        credentialsInvalid={{
          email: false,
          confirmEmail: false,
          password: false,
          confirmPassword: false,
        }}
        authScreenType={"signUp"}
      />
      {/* On top of the form, not instead of it, so a failed sign-up keeps
          what was typed. */}
      {isAuthenticating ? (
        <View style={StyleSheet.absoluteFill}>
          <LoadingOverlay message="Signing up..." />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});

export default SignupScreen;
