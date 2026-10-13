import { getDocs, query } from "@react-native-firebase/firestore";

import getUserPlantData from "./getUserPlantData";

describe("getUserPlantData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the plant if one exists", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => ({ plantId: "testPlant", name: "Test Plant" }) }],
    });
    const result = await getUserPlantData("household1", "user1", "testPlant");
    expect(result).toEqual({ plantId: "testPlant", name: "Test Plant" });
  });

  it("only looks at plants this user added to the household", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await getUserPlantData("household1", "user1", "monstera");
    expect(result).toBeUndefined();

    const [collectionRef, ...constraints] = (query as jest.Mock).mock.calls[0];
    expect(collectionRef._path).toMatch(/household1\/Plants$/);
    expect(constraints).toEqual([
      expect.objectContaining({ field: "plantId", op: "==", val: "monstera" }),
      expect.objectContaining({ field: "addedBy", op: "==", val: "user1" }),
    ]);
  });
});
