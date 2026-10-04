import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { useContext, useEffect, useState } from "react";

import { Platform, StyleSheet, useColorScheme, View } from "react-native";

import { AuthContext } from "@/context/auth/AuthProvider";

function SocialSignInButtons() {
  const { signInWithGoogle, signInWithApple } = useContext(AuthContext);
  const dark = useColorScheme() === "dark";
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let mounted = true;
    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (mounted) setAppleAvailable(available);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const run = async (signIn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await signIn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container} testID="social-sign-in">
      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          testID="apple-sign-in"
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            dark
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={8}
          style={styles.appleButton}
          onPress={() => run(signInWithApple)}
        />
      )}
      <GoogleSigninButton
        testID="google-sign-in"
        size={GoogleSigninButton.Size.Wide}
        color={dark ? GoogleSigninButton.Color.Dark : GoogleSigninButton.Color.Light}
        disabled={busy}
        onPress={() => run(signInWithGoogle)}
        style={styles.googleButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  appleButton: {
    width: 312,
    height: 44,
  },
  googleButton: {
    width: 320,
    height: 48,
  },
});

export default SocialSignInButtons;
