import firestore from "@react-native-firebase/firestore";

import { mockPlant, mockPlant2 } from "@/test-utils/MockPlant";

import fetchFirebasePlants from "./fetchFirebasePlants";

jest.mock("@react-native-firebase/firestore");

describe("fetchFirebasePlants", () => {
  const mockGet = jest.fn();
  const mockWhere = jest.fn().mockReturnThis();
  const mockCollection = jest.fn(() => ({
    where: mockWhere,
    get: mockGet,
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    (firestore as unknown as jest.Mock).mockReturnValue({
      collection: mockCollection,
    });
  });

  it("should fetch plants matching the given name", async () => {
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        { id: "1", data: () => mockPlant },
        { id: "2", data: () => mockPlant2 },
      ],
    });

    const result = await fetchFirebasePlants("Test Plant");

    expect(firestore).toHaveBeenCalled();
    expect(mockCollection).toHaveBeenCalledWith("Plants");
    expect(mockWhere).toHaveBeenCalledWith("slug", ">=", "test plant");
    expect(mockWhere).toHaveBeenCalledWith("slug", "<=", "test plant\uf8ff");
    expect(mockGet).toHaveBeenCalled();
    expect(result).toEqual([mockPlant, mockPlant2]);
  });

  it("should return an empty array if no plants match the given name", async () => {
    mockGet.mockResolvedValueOnce({
      empty: true,
      docs: [],
    });

    const result = await fetchFirebasePlants("Nonexistent Plant");

    expect(firestore).toHaveBeenCalled();
    expect(mockCollection).toHaveBeenCalledWith("Plants");
    expect(mockWhere).toHaveBeenCalledWith("slug", ">=", "nonexistent plant");
    expect(mockWhere).toHaveBeenCalledWith(
      "slug",
      "<=",
      "nonexistent plant\uf8ff",
    );
    expect(mockGet).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("should throw an error if the Firestore query fails", async () => {
    const error = new Error("Firestore error");
    mockGet.mockRejectedValueOnce(error);

    await expect(fetchFirebasePlants("Test Plant")).rejects.toThrow(
      "Firestore error",
    );

    expect(firestore).toHaveBeenCalled();
    expect(mockCollection).toHaveBeenCalledWith("Plants");
    expect(mockWhere).toHaveBeenCalledWith("slug", ">=", "test plant");
    expect(mockWhere).toHaveBeenCalledWith("slug", "<=", "test plant\uf8ff");
    expect(mockGet).toHaveBeenCalled();
  });
});
