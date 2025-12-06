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

    jest.resetModules();
    const setDocMock = jest.fn().mockResolvedValueOnce(undefined);
    const collectionMock = jest.fn(() => ({}));
    const docMock = jest.fn(() => ({}));
    jest.doMock("@react-native-firebase/firestore", () => ({
      getFirestore: jest.fn(() => ({})),
      collection: collectionMock,
      doc: docMock,
      setDoc: setDocMock,
    }));

    // Re-import after mocking
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const saveUserPlantToFirebase = require("./saveUserPlantToFirebase").default;

    const result = await saveUserPlantToFirebase(mockUserPlant, user);

    expect(setDocMock).toHaveBeenCalled();
    expect(collectionMock).toHaveBeenCalled();
    expect(docMock).toHaveBeenCalled();
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
