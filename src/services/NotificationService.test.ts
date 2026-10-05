import * as Notifications from "expo-notifications";

import {
  dismissPlantNotifications,
  requestNotificationPermissions,
} from "@/services/NotificationService";

const presented = (identifier: string, data: object) => ({
  request: { identifier, content: { data } },
});

describe("NotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requestNotificationPermissions", () => {
    it("doesn't ask when prompt is false", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "undetermined",
      });

      expect(await requestNotificationPermissions(false)).toBe(false);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it("asks when prompt is true", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: "undetermined",
      });

      expect(await requestNotificationPermissions(true)).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe("dismissPlantNotifications", () => {
    it("clears the plant's reminders but keeps 'watered' notifications", async () => {
      (Notifications.getPresentedNotificationsAsync as jest.Mock).mockResolvedValueOnce([
        presented("due-1", { plantId: "p1", type: "due" }),
        presented("nudge-1", { plantId: "p1", type: "nudge" }),
        presented("watered-1", { plantId: "p1", type: "watered" }),
        presented("due-2", { plantId: "p2", type: "due" }),
      ]);

      await dismissPlantNotifications(["p1"]);

      const dismissed = (Notifications.dismissNotificationAsync as jest.Mock).mock.calls.map(
        ([id]) => id,
      );
      expect(dismissed).toEqual(["due-1", "nudge-1"]);
    });

    it("doesn't look at the tray when there's nothing to clear", async () => {
      await dismissPlantNotifications([]);

      expect(Notifications.getPresentedNotificationsAsync).not.toHaveBeenCalled();
    });
  });
});
