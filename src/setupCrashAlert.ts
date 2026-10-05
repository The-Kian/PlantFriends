import { Alert } from "react-native";

// In release builds an uncaught JS error closes the app with no explanation.
// Show the error in an alert instead so startup crashes can be diagnosed on a
// device without adb. Only enabled for test builds (EXPO_PUBLIC_SHOW_CRASH_ALERT,
// set in eas.json); store builds rely on Crashlytics and never show users a
// stack trace. Imported first from index.js so it is installed before any
// other module runs.
if (!__DEV__ && process.env.EXPO_PUBLIC_SHOW_CRASH_ALERT === "true") {
  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    if (!isFatal) {
      defaultHandler(error, isFatal);
      return;
    }

    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}\n\n${error.stack ?? ""}`
        : String(error);

    Alert.alert("PlantFriends crashed", message.slice(0, 1500), [
      { text: "Close app", onPress: () => defaultHandler(error, isFatal) },
    ]);
  });
}
