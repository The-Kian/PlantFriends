/* eslint-disable  @typescript-eslint/no-explicit-any */
import {
  getFirestore,
  collection,
  doc,
  getDocs,
} from "@react-native-firebase/firestore";

import { mockPlant, mockPlant2 } from "@/test-utils/MockPlant";

import fetchUserPlants from "./fetchUserPlants";

describe("fetchUserPlants", () => {
  it("should fetch user plants from Firestore", async () => {
    const userId = "testUser";

    // Setup mock to return specific data
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => mockPlant }, { data: () => mockPlant2 }],
    });

    const result = await fetchUserPlants(userId);

    // Check that doc and getDocs were called with correct arguments
    const db = getFirestore();
    const expectedCollection = collection(doc(collection(db, "Users"), userId), "UserPlants");
    // Assert that getDocs was called with a collection whose _path matches expected
    const getDocsCalls = (getDocs as jest.Mock).mock.calls;
    const calledWithUserPlants = getDocsCalls.some(call => {
      const arg = call[0];
      // Modular API: collection() returns an object with _path
      return arg && arg._path && arg._path.endsWith(`${userId}/UserPlants`);
    });
    expect(calledWithUserPlants).toBe(true);

    // Check that we got the expected plants back
    expect(result).toEqual([mockPlant, mockPlant2]);
  });

  it("should return an empty array if no plants are found", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: true,
      docs: [],
    });

    const result = await fetchUserPlants("emptyCollectionUser");
    expect(result).toEqual([]);
  });
});
