/* eslint-disable @typescript-eslint/no-explicit-any */
import firestore from "@react-native-firebase/firestore";

import mockUser from "@/test-utils/MockFirebaseUser";
import { mockUserPlant } from "@/test-utils/MockPlant";

import saveUserPlantToFirebase from "./saveUserPlantToFirebase";

describe("saveUserPlantToFirebase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save the custom user plant to firebase", async () => {
    const user = mockUser;

    (firestore as any)._mockGet.mockResolvedValueOnce({ exists: false });

    const result = await saveUserPlantToFirebase(mockUserPlant, user);

    const mockFirestoreInstance = firestore();

    expect(mockFirestoreInstance.collection("Users").doc).toHaveBeenCalledWith(
      user.uid,
    );
    expect(
      mockFirestoreInstance
        .collection("Users")
        .doc(user.uid)
        .collection("UserPlants").doc,
    ).toHaveBeenCalledWith(mockUserPlant.id);
    expect(
      mockFirestoreInstance
        .collection("Users")
        .doc(user.uid)
        .collection("UserPlants")
        .doc(mockUserPlant.id).set,
    ).toHaveBeenCalledWith(mockUserPlant);
    expect(result).toBe(true);
  });

  it("Should throw an error if the save fails", async () => {
    console.error = jest.fn();
    const user = mockUser;

    (firestore as any)._mockGet.mockResolvedValueOnce({ exists: false });
    (firestore as any)._mockSet.mockRejectedValueOnce(
      new Error("Failed to save"),
    );

    const result = await saveUserPlantToFirebase(mockUserPlant, user);

    expect(result).toBe(false);
  });
});
