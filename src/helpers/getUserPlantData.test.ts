import getUserPlantData from "./getUserPlantData";
import firestore from "@react-native-firebase/firestore";

describe("getUserPlantData", () => {
  it("returns mock data if doc exists", async () => {
    // Default mock from __mocks__ => exists: true, data: () => ({ /* ... */ })
    const result = await getUserPlantData("testUser", "testPlant");
    expect(result).toBeTruthy();
    // Or do a deeper check on the shape
  });

  it("returns undefined if doc does not exist", async () => {

    (firestore().collection as jest.Mock).mockReturnValueOnce({
      doc: jest.fn(() => ({
        collection: jest.fn(() => ({
          where: jest.fn(() => ({
            get: jest.fn(() =>
              Promise.resolve({
                empty: true,
                docs: [],
              })
            ),
          })),
        })),
      })),
    });

    const result = await getUserPlantData("testUser", "emptyCollectionPlant");
    expect(result).toBeUndefined();

  });
});
