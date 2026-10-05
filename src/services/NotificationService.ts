import * as Notifications from "expo-notifications";

/**
 * NotificationService — notifications on this device.
 *
 * Watering reminders and "Sam watered your Monstera" are push notifications
 * sent by Cloud Functions (functions/notifications.js), because only the
 * server knows when a housemate has already watered a plant. This module
 * handles permission, how notifications look while the app is open, and
 * clearing ones that are out of date.
 */

// Configure the default handler so foreground notifications also show.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** The data every PlantFriends push carries, used to open the right plant. */
export interface PlantNotificationData {
  plantId?: string;
  householdId?: string;
  type?: "watered" | "due" | "nudge";
}

/**
 * Whether notification permission is granted. Only asks when `prompt` is
 * true, so the question comes at a useful moment rather than on launch.
 */
export async function requestNotificationPermissions(
  prompt: boolean = true,
): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") {
      return true;
    }
    if (!prompt) {
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
 * Cancel every locally scheduled reminder. Older builds scheduled reminders
 * on the device; the server sends them now, so these would be duplicates.
 * Also used on sign-out and account deletion.
 */
export async function cancelAllWateringReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn("cancelAllWateringReminders failed:", error);
  }
}

/**
 * Remove these plants' reminders from the notification centre, e.g. "needs
 * watering" once a housemate has watered it. "Sam watered your Monstera"
 * notifications are left alone.
 */
export async function dismissPlantNotifications(
  plantIds: string[],
): Promise<void> {
  if (plantIds.length === 0) {
    return;
  }
  try {
    const ids = new Set(plantIds);
    const presented = await Notifications.getPresentedNotificationsAsync();
    await Promise.all(
      presented
        .filter((n) => {
          const data = n.request.content.data as
            | PlantNotificationData
            | undefined;
          return (
            !!data?.plantId && ids.has(data.plantId) && data.type !== "watered"
          );
        })
        .map((n) => Notifications.dismissNotificationAsync(n.request.identifier)),
    );
  } catch (error) {
    console.warn("dismissPlantNotifications failed:", error);
  }
}
