import * as Notifications from "expo-notifications";

import { IUserPlant } from "@/constants/IPlant";

/**
 * NotificationService — schedules local watering reminders for plants.
 *
 * Local notifications are used for v1 (no server needed). Each plant gets a
 * scheduled notification at its `next_watering_date`. Notifications are
 * re-scheduled when a plant is watered/updated and cancelled when deleted.
 */

const NOTIFICATION_PREFIX = "plantfriends-watering-";

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

function notificationIdFor(plantId: string): string {
  return `${NOTIFICATION_PREFIX}${plantId}`;
}

/**
 * Request permission for local notifications.
 * Returns true if granted (or already granted).
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.warn("requestNotificationPermissions failed:", error);
    return false;
  }
}

/**
 * Schedule (or replace) a watering reminder for a plant.
 * Does nothing if the plant has no next_watering_date.
 */
export async function scheduleWateringReminder(
  plant: IUserPlant,
): Promise<void> {
  if (!plant.next_watering_date) {
    return;
  }

  // Don't schedule in the past.
  if (plant.next_watering_date <= Date.now()) {
    return;
  }

  try {
    const identifier = notificationIdFor(plant.id);
    const displayName = plant.custom_name || "Your plant";

    // Cancel any existing reminder for this plant before scheduling a new one.
    await Notifications.cancelScheduledNotificationAsync(identifier);

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: "Time to water! 💧",
        body: `${displayName} is ready for watering.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(plant.next_watering_date),
      },
    });
  } catch (error) {
    console.warn("scheduleWateringReminder failed:", error);
  }
}

/**
 * Cancel a plant's watering reminder (e.g. on delete).
 */
export async function cancelWateringReminder(plantId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(
      notificationIdFor(plantId),
    );
  } catch (error) {
    console.warn("cancelWateringReminder failed:", error);
  }
}

/**
 * Schedule reminders for all plants that have upcoming watering dates.
 * Intended to be called on app start after plants are loaded.
 */
export async function syncAllWateringReminders(
  plants: IUserPlant[],
): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) {
    return;
  }

  await Promise.all(
    plants.map((plant) =>
      plant.reminders_enabled === false
        ? cancelWateringReminder(plant.id)
        : scheduleWateringReminder(plant),
    ),
  );
}
