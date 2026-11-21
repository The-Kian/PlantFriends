import * as Notifications from "expo-notifications";

import { Linking } from "react-native";

import { IUserPlant } from "@/constants/IPlant";

/**
 * NotificationService — what the app itself does with notifications.
 *
 * Watering reminders come from the server (`sendWateringReminders`), as push
 * notifications. The app asks for permission, shows pushes that arrive while
 * it's open, opens the plant a notification was tapped on (App.tsx), and
 * clears a reminder once someone has watered the plant.
 */

// Show notifications that arrive while the app is open, too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** The data every PlantFriends notification carries, used to open the right plant. */
export interface PlantNotificationData {
  plantId?: string;
  householdId?: string;
  type?: "watered" | "due" | "nudge";
}

export type NotificationPermission = "granted" | "denied" | "undetermined";

/**
 * Whether notification permission is granted. Only asks when `prompt` is
 * true, so the question comes at a useful moment rather than on launch.
 */
export async function requestNotificationPermissions(
  prompt: boolean = true
): Promise<boolean> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === "granted") {
      return true;
    }
    // Refused for good: the phone won't show its question again.
    if (!prompt || existing.canAskAgain === false) {
      return false;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.warn("requestNotificationPermissions failed:", error);
    return false;
  }
}

/**
 * The current permission, without asking. "denied" means refused for good
 * (the phone won't ask again). Android 13+ reports "denied" for a phone that
 * was never asked, with `canAskAgain` true: that is "undetermined" here.
 */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  try {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status === "granted") return "granted";
    if (status === "denied" && canAskAgain === false) return "denied";
    return "undetermined";
  } catch (error) {
    console.warn("getNotificationPermission failed:", error);
    return "undetermined";
  }
}

/** Opens this app's page in the phone's settings, to allow notifications. */
export function openNotificationSettings(): void {
  Linking.openSettings().catch((error) =>
    console.warn("openNotificationSettings failed:", error)
  );
}

/**
 * Cancels every reminder scheduled on this phone. Older builds scheduled
 * their own; the server sends them now, so this runs once on each launch
 * (it's cheap, and nothing schedules local notifications any more), and on
 * sign-out.
 */
export async function cancelAllWateringReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn("cancelAllWateringReminders failed:", error);
  }
}

/**
 * Clears reminders in the notification tray that no longer apply: the plant
 * has been watered (its next watering is in the future) or is gone. Called
 * whenever the household's plants change, so a housemate watering a plant
 * clears the reminder on everyone's phone.
 */
export async function dismissStaleReminders(
  plants: IUserPlant[],
  now: number = Date.now()
): Promise<void> {
  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    const byId = new Map(plants.map((p) => [p.id, p]));

    await Promise.all(
      presented
        .filter((notification) => {
          const data = notification.request.content.data as
            PlantNotificationData | undefined;
          if (
            !data?.plantId ||
            (data.type !== "due" && data.type !== "nudge")
          ) {
            return false;
          }
          const plant = byId.get(data.plantId);
          return (
            !plant ||
            (plant.next_watering_date != null && plant.next_watering_date > now)
          );
        })
        .map((notification) =>
          Notifications.dismissNotificationAsync(
            notification.request.identifier
          )
        )
    );
  } catch (error) {
    console.warn("dismissStaleReminders failed:", error);
  }
}
