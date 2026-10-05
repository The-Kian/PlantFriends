/* eslint-disable @typescript-eslint/no-explicit-any */
import firestore from "@react-native-firebase/firestore";
import * as Notifications from "expo-notifications";

import mockUser from "@/test-utils/MockFirebaseUser";

import { createSoloHousehold, displayNameFor, migrateUserPlants } from "./setupHousehold";

const mockGet = (firestore as any)._mockGet as jest.Mock;
const mockSet = (firestore as any)._mockSet as jest.Mock;
const mockBatchSet = (firestore as any)._mockBatchSet as jest.Mock;
const mockBatchCommit = (firestore as any)._mockBatchCommit as jest.Mock;

const kian = { ...mockUser, displayName: "Kian" };

describe("displayNameFor", () => {
  it("prefers the display name, then the start of the email", () => {
    expect(displayNameFor(kian)).toBe("Kian");
    expect(displayNameFor({ ...mockUser, email: "kian@example.com" })).toBe("kian");
    expect(displayNameFor(mockUser)).toBe("Plant friend");
  });
});

describe("createSoloHousehold", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a household whose ID is the user's uid, then links the user to it", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });

    const householdId = await createSoloHousehold(kian);

    expect(householdId).toBe("user1");
    expect(mockSet).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: "Kian's home",
        memberIds: ["user1"],
        members: { user1: { displayName: "Kian" } },
        createdBy: "user1",
      }),
    );
    expect(mockSet).toHaveBeenNthCalledWith(2, { householdId: "user1" });
  });

  it("doesn't recreate a household that already exists", async () => {
    mockGet.mockResolvedValueOnce({ exists: true });

    await createSoloHousehold(kian);

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith({ householdId: "user1" });
  });
});

describe("migrateUserPlants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("copies old plants into the household as the user's own, then clears local reminders", async () => {
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        { id: "p1", data: () => ({ id: "p1", plantId: "monstera", custom_name: "Monty" }) },
        { id: "p2", data: () => ({ id: "p2", plantId: "fern", notify_at: 5 }) },
      ],
    });

    const count = await migrateUserPlants(kian, "user1");

    expect(count).toBe(2);
    expect(mockBatchSet).toHaveBeenCalledTimes(2);
    const [, firstPlant] = mockBatchSet.mock.calls[0];
    expect(firstPlant).toEqual({
      id: "p1",
      plantId: "monstera",
      custom_name: "Monty",
      userId: "user1",
      addedBy: "user1",
      carerIds: ["user1"],
      shared: false,
    });
    const [, secondPlant] = mockBatchSet.mock.calls[1];
    expect(secondPlant).not.toHaveProperty("notify_at");
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith({ plantsMigratedAt: "SERVER_TIMESTAMP" });
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });
});
