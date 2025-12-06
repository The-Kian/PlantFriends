/* eslint-disable @typescript-eslint/no-explicit-any */
import firestore from "@react-native-firebase/firestore";

import getUserPlantData from "./getUserPlantData";

describe("getUserPlantData", () => {
  it("returns mock data if doc exists", async () => {
    // Default mock from __mocks__ => exists: true, data: () => ({ /* ... */ })
    const result = await getUserPlantData("testUser", "testPlant");
    expect(result).toBeTruthy();
  });

  it("returns undefined if doc does not exist", async () => {
    (firestore as any)._mockGet.mockResolvedValueOnce({
      empty: true,
      docs: [],
    });

    const result = await getUserPlantData("testUser", "emptyCollectionPlant");
    expect(result).toBeUndefined();

    // Create a reference to the firestore mock
    const mockFirestoreInstance = firestore();

    // Verify the chain of calls
    expect(mockFirestoreInstance.collection).toHaveBeenCalledWith("Users");
    expect(mockFirestoreInstance.collection("Users").doc).toHaveBeenCalledWith(
      "testUser",
    );
    expect(
      mockFirestoreInstance.collection("Users").doc("testUser").collection,
    ).toHaveBeenCalledWith("UserPlants");
  });
});
