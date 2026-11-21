import * as Notifications from "expo-notifications";

import {
  cancelAllWateringReminders,
  dismissStaleReminders,
  getNotificationPermission,
  requestNotificationPermissions,
} from "@/services/NotificationService";
import { mockUserPlant } from "@/test-utils/MockPlant";

const NOW = 1_000_000;

function presented(identifier: string, data: object) {
  return { request: { identifier, content: { data } } };
}

describe("NotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("cancels reminders an older build scheduled", async () => {
    await cancelAllWateringReminders();

    expect(
      Notifications.cancelAllScheduledNotificationsAsync
    ).toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("dismisses reminders for plants that have been watered or are gone", async () => {
    jest
      .mocked(Notifications.getPresentedNotificationsAsync)
      .mockResolvedValueOnce([
        presented("watered", { plantId: "a", type: "due" }),
        presented("still-due", { plantId: "b", type: "nudge" }),
        presented("deleted", { plantId: "gone", type: "due" }),
        presented("housemate", { plantId: "a", type: "watered" }),
      ] as unknown as Notifications.Notification[]);

    await dismissStaleReminders(
      [
        { ...mockUserPlant, id: "a", next_watering_date: NOW + 1 },
        { ...mockUserPlant, id: "b", next_watering_date: NOW - 1 },
      ],
      NOW
    );

    const dismissed = jest
      .mocked(Notifications.dismissNotificationAsync)
      .mock.calls.map(([id]) => id);
    expect(dismissed.sort()).toEqual(["deleted", "watered"]);
  });

  it("reads the permission without asking", async () => {
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValueOnce({ status: "denied", canAskAgain: false } as never);

    expect(await getNotificationPermission()).toBe("denied");
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("treats denied-but-can-ask-again (never asked on Android 13+) as undetermined", async () => {
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValueOnce({ status: "denied", canAskAgain: true } as never);

    expect(await getNotificationPermission()).toBe("undetermined");
  });

  it("doesn't ask when the phone won't show the question again", async () => {
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValueOnce({ status: "denied", canAskAgain: false } as never);

    expect(await requestNotificationPermissions()).toBe(false);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
