/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  getDocs,
} from "@react-native-firebase/firestore";

import getUserPlantData from "./getUserPlantData";

describe("getUserPlantData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("returns mock data if doc exists", async () => {
    // Mock getDocs to return a non-empty snapshot
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: false,
      docs: [
        { data: () => ({ plantId: "testPlant", name: "Test Plant" }) },
      ],
    });
    const result = await getUserPlantData("testUser", "testPlant");
    expect(result).toEqual({ plantId: "testPlant", name: "Test Plant" });
  });

  it("returns undefined if doc does not exist", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: true,
      docs: [],
    });

    const result = await getUserPlantData("testUser", "emptyCollectionPlant");
    expect(result).toBeUndefined();

    // Check that query and getDocs were called with correct arguments
    const db = getFirestore();
    const expectedCollection = collection(doc(collection(db, "Users"), "testUser"), "UserPlants");
    const expectedWhere = where("plantId", "==", "emptyCollectionPlant");
    // Find the call to query with expectedWhere for this test
    const queryCalls = (query as jest.Mock).mock.calls;
    // Compare key properties for structural equality
    expect(queryCalls[0][0].path).toBe(expectedCollection.path);
    expect(queryCalls[0][1]).toMatchObject({ field: "plantId", op: "==", val: "emptyCollectionPlant" });
    // Find the call to getDocs with expectedCollection
    const getDocsCalls = (getDocs as jest.Mock).mock.calls;
    // Assert that getDocs was called
    expect(getDocs).toHaveBeenCalled();
  });
});
