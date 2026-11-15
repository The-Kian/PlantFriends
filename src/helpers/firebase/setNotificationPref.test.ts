/* eslint-disable @typescript-eslint/no-explicit-any */
import firestore from "@react-native-firebase/firestore";

import setNotificationPref from "./setNotificationPref";

const mockSet = (firestore as any)._mockSet as jest.Mock;

describe("setNotificationPref", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saves just that switch on the user's profile", async () => {
    await setNotificationPref("user1", "housemateActivity", false);

    expect(mockSet).toHaveBeenCalledWith({
      notificationPrefs: { housemateActivity: false },
    });
  });
});
