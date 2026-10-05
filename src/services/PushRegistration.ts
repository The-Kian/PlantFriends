import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";
import * as Notifications from "expo-notifications";

import { Platform } from "react-native";

import { userDoc } from "@/helpers/firebase/householdPaths";
import { requestNotificationPermissions } from "@/services/NotificationService";

// The token registered by this install, so sign-out removes only this device.
let registeredToken: string | null = null;

function devicesDoc(uid: string, token: string) {
  return doc(collection(userDoc(getFirestore(), uid), "Devices"), token);
}

/** The device's IANA time zone, e.g. "Europe/London". */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Registers this device for push notifications under `Users/{uid}/Devices`.
 * The Expo push token is the document ID, so registering again is harmless.
 *
 * With `prompt: false` (on launch) it only registers if permission was
 * already granted. With `prompt: true` it asks first; call it at a moment
 * where a reminder makes sense, such as after adding or watering a plant.
 */
export async function registerForPush(
  uid: string,
  { prompt }: { prompt: boolean },
): Promise<string | null> {
  try {
    const granted = await requestNotificationPermissions(prompt);
    if (!granted) {
      return null;
    }

    // The EAS project ID comes from app.config.js (extra.eas.projectId).
    const { data: token } = await Notifications.getExpoPushTokenAsync();

    await setDoc(devicesDoc(uid, token), {
      expoPushToken: token,
      platform: Platform.OS,
      updatedAt: serverTimestamp(),
    });
    await setDoc(
      userDoc(getFirestore(), uid),
      { timeZone: deviceTimeZone() },
      { merge: true },
    );

    registeredToken = token;
    return token;
  } catch (error) {
    // Simulators and emulators without Google Play can't get a token.
    console.warn("registerForPush failed:", error);
    return null;
  }
}

/** Stops pushes to this device for `uid`. Call before signing out. */
export async function unregisterForPush(uid: string): Promise<void> {
  if (!registeredToken) {
    return;
  }
  try {
    await deleteDoc(devicesDoc(uid, registeredToken));
  } catch (error) {
    console.warn("unregisterForPush failed:", error);
  } finally {
    registeredToken = null;
  }
}
