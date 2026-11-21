import { Alert } from "react-native";

import { getNotificationPermission } from "@/services/NotificationService";
import { registerForPush } from "@/services/PushRegistration";

/** Resolves true if they agree to be asked, false if they decline. */
function explainFirst(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      "Plant reminders",
      "Plant Friends can remind you when a plant needs water. Your phone will " +
        "ask to allow notifications next.",
      [
        { text: "Not now", style: "cancel", onPress: () => resolve(false) },
        { text: "Continue", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

/**
 * Registers this phone for reminders at a moment where they make sense. If
 * the phone hasn't been asked about notifications yet, one line explains why
 * before the system prompt appears. Once permission is granted or refused
 * there's nothing to explain, so it goes straight to registering.
 */
export async function registerWithExplanation(
  uid: string
): Promise<string | null> {
  if ((await getNotificationPermission()) === "undetermined") {
    if (!(await explainFirst())) {
      return null;
    }
  }
  return registerForPush(uid, { prompt: true });
}
