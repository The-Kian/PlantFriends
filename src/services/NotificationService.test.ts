import * as Notifications from "expo-notifications";

import { syncAllWateringReminders } from "@/services/NotificationService";
import { mockUserPlant } from "@/test-utils/MockPlant";

describe("syncAllWateringReminders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does nothing, and asks for no permission, when there are no plants", async () => {
    await syncAllWateringReminders([]);

    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(Notifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });

  it("clears old reminders and schedules upcoming ones", async () => {
    const upcoming = {
      ...mockUserPlant,
      id: "upcoming",
      next_watering_date: Date.now() + 86_400_000,
    };
    const disabled = { ...upcoming, id: "disabled", reminders_enabled: false };

    await syncAllWateringReminders([upcoming, disabled]);

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "plantfriends-watering-upcoming" }),
    );
  });

  it("leaves reminders alone when permission is denied", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "denied" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "denied" });

    await syncAllWateringReminders([mockUserPlant]);

    expect(Notifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
