/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
} from "@react-native-firebase/firestore";

import mockUser from "@/test-utils/MockFirebaseUser";
import { mockPlant } from "@/test-utils/MockPlant";

import saveBasePlantToFirebase from "./saveBasePlantToFirebase";

describe("saveBasePlantToFirebase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save the base plant data if it doesn't exist", async () => {
    const plantData = mockPlant;
    const user = mockUser;

    // Mock getDoc to simulate plant does not exist
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: false });
    // Mock setDoc to resolve
    (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await saveBasePlantToFirebase(plantData, user);

    // Check that doc and setDoc were called with correct arguments
    expect(doc).toHaveBeenCalledWith(expect.anything(), plantData.id);
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        ...plantData,
        contributed_by: mockUser.displayName ?? mockUser.email ?? mockUser.uid,
        isVerified: false,
      })
    );
    expect(result).toBe(true);
  });

  it("should not save the base plant data if it already exists", async () => {
    const plantData = mockPlant;
    const user = mockUser;

    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: true });

    const result = await saveBasePlantToFirebase(plantData, user);

    expect(doc).toHaveBeenCalledWith(expect.anything(), plantData.id);
    expect(setDoc).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("Should throw an error if the save fails", async () => {
    console.error = jest.fn();
    const plantData = mockPlant;
    const user = mockUser;

    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: false });
    (setDoc as jest.Mock).mockRejectedValueOnce(new Error("Failed to save"));

    const result = await saveBasePlantToFirebase(plantData, user);
    expect(result).toBe(false);
  });
});
