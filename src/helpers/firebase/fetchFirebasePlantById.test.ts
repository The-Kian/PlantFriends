import { getDoc } from "@react-native-firebase/firestore";

import fetchFirebasePlantById from "./fetchFirebasePlantById";

describe("fetchFirebasePlantById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the species when it exists", async () => {
    jest.mocked(getDoc).mockResolvedValueOnce({
      id: "123",
      exists: () => true,
      data: () => ({ name: "Fruit-salad-plant" }),
    } as never);

    expect(await fetchFirebasePlantById("123")).toEqual({
      id: "123",
      name: "Fruit-salad-plant",
    });
  });

  // The real SDK's modular snapshot has exists() as a method. Read as a
  // property it's always truthy, so a missing species came back as an empty
  // object and the plant showed as "Unnamed Plant".
  it("returns null when exists() says the species is missing", async () => {
    jest.mocked(getDoc).mockResolvedValueOnce({
      id: "123",
      exists: () => false,
      data: () => undefined,
    } as never);

    expect(await fetchFirebasePlantById("123")).toBeNull();
  });

  it("returns null without a plant ID", async () => {
    expect(await fetchFirebasePlantById("")).toBeNull();
    expect(getDoc).not.toHaveBeenCalled();
  });
});
