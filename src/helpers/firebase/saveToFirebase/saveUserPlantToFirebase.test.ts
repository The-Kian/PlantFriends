/* eslint-disable @typescript-eslint/no-explicit-any */
import firestore from "@react-native-firebase/firestore";

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

  it("records who added a new plant", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });

    const result = await saveUserPlantToFirebase(mockUserPlant, mockUser, mockHousehold);

    expect(result).toBe(true);
    expect(writtenData()).toMatchObject({
      id: "1",
      plantId: "1",
      houseLocation: "Kitchen",
      addedBy: "user1",
      userId: "user1",
      carerIds: ["user1"],
      shared: false,
      slug: "custom plant",
    });
  });

  it("leaves who added it alone when updating", async () => {
    mockGet.mockResolvedValueOnce({ exists: true });

    await saveUserPlantToFirebase(
      { ...mockUserPlant, addedBy: "user1", custom_name: "Monty" },
      mockUser,
      mockHousehold,
    );

    const data = writtenData();
    expect(data).toMatchObject({ custom_name: "Monty", slug: "monty" });
    expect(data).not.toHaveProperty("addedBy");
    expect(data).not.toHaveProperty("carerIds");
  });

  it("returns false if the save fails", async () => {
    console.error = jest.fn();
    mockGet.mockResolvedValueOnce({ exists: false });
    mockSet.mockRejectedValueOnce(new Error("Failed to save"));

    const result = await saveUserPlantToFirebase(mockUserPlant, mockUser, mockHousehold);

    expect(result).toBe(false);
  });
});
