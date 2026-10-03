import { useContext, useState } from "react";

import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";

import AuthContent from "@/components/auth/AuthContent";
import LoadingOverlay from "@/components/ui/Views/LoadingOverlay";
import { AuthContext } from "@/context/auth/AuthProvider";
import { CredentialsType } from "@/context/auth/AuthTypes";
import { Colors } from "@/theme/Colors";

function LoginScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { login, resetPassword } = useContext(AuthContext);

  async function loginHandler(email: string, password: string) {
    setIsAuthenticating(true);
    await login({ email, password });
    setIsAuthenticating(false);
  }

  const handleForgotPassword = () => {
    Alert.prompt(
      "Reset password",
      "Enter the email address associated with your account.",
      async (email) => {
        if (!email || !email.trim()) return;
        await resetPassword({ email: email.trim() });
      },
    );
  };

  if (isAuthenticating) {
    return <LoadingOverlay message="Logging you in..." />;
  }

  return (
    <>
      <AuthContent
        authScreenType="login"
        onSubmit={(credentials: CredentialsType) => {
          loginHandler(credentials.email, credentials.password);
        }}
      />
      <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotLink}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  forgotLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  forgotText: {
    color: Colors.light.tint,
    fontSize: 14,
  },
});

export default LoginScreen;
