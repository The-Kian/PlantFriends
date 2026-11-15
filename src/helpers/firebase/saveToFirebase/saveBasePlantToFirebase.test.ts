/* eslint-disable @typescript-eslint/no-explicit-any */
import {
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

  // The real SDK's modular snapshot has exists() as a method. Read as a
  // property it's always truthy, so new species were never saved.
  it("saves a new species when exists() is a method returning false", async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });
    (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

    expect(await saveBasePlantToFirebase(mockPlant, mockUser)).toBe(true);
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it("skips an existing species when exists() is a method returning true", async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true });

    expect(await saveBasePlantToFirebase(mockPlant, mockUser)).toBe(true);
    expect(setDoc).not.toHaveBeenCalled();
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
