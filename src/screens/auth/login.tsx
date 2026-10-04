import { useContext, useState } from "react";

import { Alert, Pressable, StyleSheet } from "react-native";

import AuthContent from "@/components/auth/AuthContent";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import LoadingOverlay from "@/components/ui/Views/LoadingOverlay";
import { AuthContext } from "@/context/auth/AuthProvider";
import { CredentialsType } from "@/context/auth/AuthTypes";

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
    <AuthContent
      authScreenType="login"
      onSubmit={(credentials: CredentialsType) => {
        loginHandler(credentials.email, credentials.password);
      }}
    >
      <Pressable
        onPress={handleForgotPassword}
        accessibilityRole="button"
        style={styles.forgotLink}
      >
        <ThemedText type="link" style={styles.forgotText}>
          Forgot password?
        </ThemedText>
      </Pressable>
    </AuthContent>
  );
}

const styles = StyleSheet.create({
  forgotLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  forgotText: {
    fontSize: 14,
  },
});

export default LoginScreen;
