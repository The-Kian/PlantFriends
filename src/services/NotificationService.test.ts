import * as Notifications from "expo-notifications";

import { Alert } from "react-native";

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

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("dismisses reminders for plants that have been watered or are gone", async () => {
    jest.mocked(Notifications.getPresentedNotificationsAsync).mockResolvedValueOnce([
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
      NOW,
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

  it("doesn't call a phone that was never asked 'denied', even if it says so", async () => {
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValueOnce({ status: "denied", canAskAgain: true } as never);
    expect(await getNotificationPermission()).toBe("undetermined");
  });

  describe("asking", () => {
    const pressAlert = (text: string) => {
      const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];
      buttons.find((b) => b.text === text)?.onPress?.();
    };
    beforeEach(() => {
      jest.spyOn(Alert, "alert").mockImplementation(() => {});
      jest
        .mocked(Notifications.getPermissionsAsync)
        .mockResolvedValue({ status: "undetermined", canAskAgain: true } as never);
    });

    it("never prompts when told not to", async () => {
      expect(await requestNotificationPermissions(false)).toBe(false);
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it("says why first, and asks the phone only after 'Turn on'", async () => {
      jest
        .mocked(Notifications.requestPermissionsAsync)
        .mockResolvedValueOnce({ status: "granted" } as never);

      const asked = requestNotificationPermissions(true);
      await Promise.resolve();
      await Promise.resolve();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Turn on reminders?",
        expect.stringContaining("remind you when a plant needs water"),
        expect.any(Array),
        expect.anything(),
      );
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();

      pressAlert("Turn on");
      expect(await asked).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it("doesn't ask the phone after 'Not now', or ask again this session", async () => {
      const asked = requestNotificationPermissions(true);
      await Promise.resolve();
      await Promise.resolve();
      pressAlert("Not now");
      expect(await asked).toBe(false);

      expect(await requestNotificationPermissions(true)).toBe(false);
      expect(Alert.alert).toHaveBeenCalledTimes(1);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });
  });
});
