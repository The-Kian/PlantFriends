import appCheck from "@react-native-firebase/app-check";

/**
 * Turns on Firebase App Check, so Cloud Functions and Firestore can tell
 * requests come from the real app. Release builds use Play Integrity (and
 * App Attest on iOS). Development builds use the debug provider: register
 * the debug token from EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN (or the one the app
 * logs) in the Firebase console under App Check → Manage debug tokens.
 */
export async function initAppCheck(): Promise<void> {
  try {
    const provider = appCheck().newReactNativeFirebaseAppCheckProvider();
    const debugToken = process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN || undefined;
    provider.configure({
      android: {
        provider: __DEV__ ? "debug" : "playIntegrity",
        debugToken,
      },
      apple: {
        provider: __DEV__ ? "debug" : "appAttestWithDeviceCheckFallback",
        debugToken,
      },
    });
    await appCheck().initializeAppCheck({
      provider,
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    // Without App Check the app still works until enforcement is turned on.
    console.warn("App Check could not start", error);
  }
}
