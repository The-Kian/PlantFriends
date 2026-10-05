/* eslint-disable @typescript-eslint/no-explicit-any */
import firestore from "@react-native-firebase/firestore";

import { IUserPlantMerged } from "@/constants/IPlant";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockHousehold } from "@/test-utils/MockHousehold";
import { mockUserPlant } from "@/test-utils/MockPlant";

import saveUserPlantToFirebase from "./saveUserPlantToFirebase";

const mockGet = (firestore as any)._mockGet as jest.Mock;
const mockSet = (firestore as any)._mockSet as jest.Mock;

const writtenData = () => mockSet.mock.calls[0][0];

describe("saveUserPlantToFirebase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records who added a new plant and makes it theirs", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });
    const plant = { ...mockUserPlant, last_watered_date: 100, next_watering_date: 200 };

    const result = await saveUserPlantToFirebase(plant, mockUser, mockHousehold);

    expect(result).toBe(true);
    expect(writtenData()).toMatchObject({
      id: "1",
      plantId: "1",
      houseLocation: "Kitchen",
      addedBy: "user1",
      userId: "user1",
      carerIds: ["user1"],
      shared: false,
      last_watered_date: 100,
      next_watering_date: 200,
      slug: "custom plant",
    });
  });

  it("doesn't take over a housemate's plant when saving it", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ addedBy: "user2" }),
    });
    const plant = { ...mockUserPlant, userId: "user2", last_watered_date: 100 };

    await saveUserPlantToFirebase(plant, mockUser, mockHousehold);

    const data = writtenData();
    expect(data.carerIds).toEqual(["user2"]);
    expect(data).not.toHaveProperty("addedBy");
    expect(data).not.toHaveProperty("userId");
    // Watering goes through logWatering, so an edit can't undo one.
    expect(data).not.toHaveProperty("last_watered_date");
  });

  it("makes every member a carer of a shared plant", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });

    await saveUserPlantToFirebase(
      { ...mockUserPlant, shared: true },
      mockUser,
      mockHousehold,
    );

    expect(writtenData().carerIds).toEqual(["user1", "user2"]);
  });

  it("keeps a plant shared when an edit doesn't say otherwise", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ addedBy: "user2", shared: true }),
    });
    const { shared: _shared, ...edit } = { ...mockUserPlant, shared: undefined };

    await saveUserPlantToFirebase(edit, mockUser, mockHousehold);

    expect(writtenData()).toMatchObject({ shared: true, carerIds: ["user1", "user2"] });
  });

  it("never writes species data or server-only fields", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });
    const merged: IUserPlantMerged = {
      ...mockUserPlant,
      name: "Monstera deliciosa",
      images: ["https://example.com/monstera.jpg"],
      notify_at: 123,
      notify_stage: "due",
    };

    await saveUserPlantToFirebase(merged, mockUser, mockHousehold);

    const data = writtenData();
    expect(data).not.toHaveProperty("name");
    expect(data).not.toHaveProperty("images");
    expect(data).not.toHaveProperty("notify_at");
    expect(data).not.toHaveProperty("notify_stage");
  });

  it("returns false if the save fails", async () => {
    console.error = jest.fn();
    mockGet.mockResolvedValueOnce({ exists: false });
    mockSet.mockRejectedValueOnce(new Error("Failed to save"));

    const result = await saveUserPlantToFirebase(mockUserPlant, mockUser, mockHousehold);

    expect(result).toBe(false);
  });
});
