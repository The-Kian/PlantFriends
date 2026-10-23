/* eslint-disable @typescript-eslint/no-explicit-any */
import firestore from "@react-native-firebase/firestore";
import * as Notifications from "expo-notifications";

import { registerForPush, unregisterForPush } from "./PushRegistration";

const mockSet = (firestore as any)._mockSet as jest.Mock;
const mockDelete = (firestore as any)._mockDelete as jest.Mock;

describe("PushRegistration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("doesn't ask for permission on launch, and registers nothing without it", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "undetermined",
    });

    expect(await registerForPush("user1", { prompt: false })).toBeNull();
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("registers this device's token and time zone", async () => {
    const token = await registerForPush("user1", { prompt: true });

    expect(token).toBe("ExponentPushToken[test-device]");
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        expoPushToken: "ExponentPushToken[test-device]",
        updatedAt: "SERVER_TIMESTAMP",
      }),
    );
    expect(mockSet).toHaveBeenCalledWith({ timeZone: expect.any(String) });
  });

  it("removes this device on sign-out", async () => {
    await registerForPush("user1", { prompt: true });
    await unregisterForPush("user1");

    expect(mockDelete).toHaveBeenCalledTimes(1);

    // Nothing left to remove.
    await unregisterForPush("user1");
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it("gives up quietly when the device can't get a token", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValueOnce(
      new Error("No Google Play services"),
    );

    expect(await registerForPush("user1", { prompt: true })).toBeNull();
  });
});
