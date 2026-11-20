import { Alert } from "react-native";

import { getNotificationPermission } from "@/services/NotificationService";
import { registerForPush } from "@/services/PushRegistration";

import { registerWithExplanation } from "./registerWithExplanation";

jest.mock("@/services/NotificationService", () => ({
  getNotificationPermission: jest.fn(),
}));
jest.mock("@/services/PushRegistration", () => ({
  registerForPush: jest.fn(),
}));

// Presses a button in the last Alert.alert call.
const press = (text: string) => {
  const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];
  buttons.find((b) => b.text === text)?.onPress?.();
};

describe("registerWithExplanation", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.mocked(registerForPush).mockResolvedValue("token");
  });

  it("explains first, then asks, when the phone hasn't been asked", async () => {
    jest.mocked(getNotificationPermission).mockResolvedValue("undetermined");

    const result = registerWithExplanation("u1");
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Plant reminders",
      expect.stringContaining("remind you when a plant needs water"),
      expect.any(Array),
      expect.any(Object)
    );
    expect(registerForPush).not.toHaveBeenCalled();

    press("Continue");

    await expect(result).resolves.toBe("token");
    expect(registerForPush).toHaveBeenCalledWith("u1", { prompt: true });
  });

  it("doesn't ask the phone when they say not now", async () => {
    jest.mocked(getNotificationPermission).mockResolvedValue("undetermined");

    const result = registerWithExplanation("u1");
    await new Promise<void>((resolve) => setImmediate(resolve));
    press("Not now");

    await expect(result).resolves.toBeNull();
    expect(registerForPush).not.toHaveBeenCalled();
  });

  it.each(["granted", "denied"] as const)(
    "goes straight to registering when permission is %s",
    async (status) => {
      jest.mocked(getNotificationPermission).mockResolvedValue(status);

      await registerWithExplanation("u1");

      expect(Alert.alert).not.toHaveBeenCalled();
      expect(registerForPush).toHaveBeenCalledWith("u1", { prompt: true });
    }
  );
});
