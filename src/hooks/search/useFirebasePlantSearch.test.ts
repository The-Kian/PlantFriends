import { act, renderHook, waitFor } from "@testing-library/react-native";

import { IPlant } from "@/constants/IPlant";
import fetchFirebasePlants from "@/helpers/firebase/fetchFirebasePlants";

import { useFirebasePlantSearch } from "./useFirebasePlantSearch";

jest.mock("@/helpers/firebase/fetchFirebasePlants");

const mockedFetchFirebasePlants = fetchFirebasePlants as jest.Mock<
  Promise<IPlant[]>
>;

describe("useFirebasePlantSearch", () => {
  it("should return loading, error, and plants states", async () => {
    const mockPlants: IPlant[] = [{ id: "1", name: "Test Plant" }];
    mockedFetchFirebasePlants.mockResolvedValue(mockPlants);

    const { result } = renderHook(() => useFirebasePlantSearch("test"));

    await act(async () => {
      await result.current.searchPlants();
    });

    await waitFor(() => {
      expect(result.current.plants).toEqual(mockPlants);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle errors", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockedFetchFirebasePlants.mockRejectedValue(new Error("Failed to fetch"));

    const { result } = renderHook(() => useFirebasePlantSearch("test"));

    await act(async () => {
      await result.current.searchPlants();
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to fetch plants");
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.plants).toEqual([]);
  });
});
