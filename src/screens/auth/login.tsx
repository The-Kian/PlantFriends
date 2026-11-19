import { useContext, useState } from "react";

import { Pressable, StyleSheet, View } from "react-native";

import AuthContent from "@/components/auth/AuthContent";
import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import TextInputField from "@/components/ui/Input/TextInputField";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import LoadingOverlay from "@/components/ui/Views/LoadingOverlay";
import { AuthContext } from "@/context/auth/AuthProvider";
import { CredentialsType } from "@/context/auth/AuthTypes";
import { Spacing } from "@/theme/Spacing";

function LoginScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const { login, resetPassword } = useContext(AuthContext);

  async function loginHandler(email: string, password: string) {
    setIsAuthenticating(true);
    await login({ email, password });
    setIsAuthenticating(false);
  }

  // Alert.prompt only exists on iOS, so the email is asked for inline.
  async function sendReset() {
    const email = resetEmail.trim();
    if (!email) return;
    setSendingReset(true);
    await resetPassword({ email });
    setSendingReset(false);
  }

  return (
    <View style={styles.screen}>
      <AuthContent
        authScreenType="login"
        onSubmit={(credentials: CredentialsType) => {
          loginHandler(credentials.email, credentials.password);
        }}
      >
        <Pressable
          onPress={() => setShowReset((shown) => !shown)}
          accessibilityRole="button"
          style={styles.forgotLink}
        >
          <ThemedText type="link" style={styles.forgotText}>
            Forgot password?
          </ThemedText>
        </Pressable>
        {showReset ? (
          <View style={styles.resetForm}>
            <TextInputField
              label="Email for the reset link"
              placeholder="you@example.com"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Email for the reset link"
            />
            <ThemedButton
              title={sendingReset ? "Sending..." : "Send reset link"}
              onPress={sendReset}
              disabled={sendingReset || !resetEmail.trim()}
              accessibilityLabel="Send reset link"
              testID="send-reset-link"
            />
          </View>
        ) : null}
      </AuthContent>
      {/* On top of the form, not instead of it, so a failed login keeps what
          was typed. */}
      {isAuthenticating ? (
        <View style={StyleSheet.absoluteFill}>
          <LoadingOverlay message="Logging you in..." />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  forgotLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  forgotText: {
    fontSize: 14,
  },
  resetForm: {
    gap: Spacing.medium,
  },
});

export default LoginScreen;
