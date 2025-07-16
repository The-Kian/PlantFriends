import { renderHook, waitFor } from "@testing-library/react-native";

import { fetchPerenualPlants } from "@helpers/plantAPI/fetchPlantAPI";
import { mockPlant, mockPlant2 } from "@test-utils/MockPlant";
import fetchFirebasePlants from "@helpers/fetchFirebasePlants";
import { useCombinedPlantSearch } from "./useCombinedPlantSearch";

jest.mock("@helpers/plantAPI/fetchPlantAPI", () => ({
  fetchOpenFarmPlants: jest.fn(),
  fetchPerenualPlants: jest.fn(),
}));

jest.mock("@helpers/fetchFirebasePlants", () => jest.fn());

describe("useFetchAPIPlants", () => {
  it("should set loading to true when searchQuery is not empty", async () => {
    const searchQuery = "test";
    const { result } = renderHook(() => useCombinedPlantSearch(searchQuery));
    await waitFor(() => {
    expect(result.current.loading).toBe(true);
    });
  });

  it("should set loading to false and error to null when searchQuery is empty", async () => {
    const searchQuery = "";
    const { result } = renderHook(() => useCombinedPlantSearch(searchQuery));
    await waitFor(() => {
    expect(result.current.loading).toBe(false);
    });
  });

  it("sets plants fetched from Perenual API", async () => {
    (fetchPerenualPlants as jest.Mock).mockResolvedValue([mockPlant]);
    const searchQuery = "test";
    const { result } = renderHook(() => useCombinedPlantSearch(searchQuery));
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    console.log(`🚀 - KP -  ~ it ~ result.current.plants:`, result.current.plants)
    expect(result.current.plants).toEqual(expect.arrayContaining([expect.objectContaining(mockPlant)]));
  });

  it("sets error when fetchPerenualPlants fails", async () => {
    const searchQuery = "test";
    const errorMessage = "Error fetching plants";
    const error = new Error(errorMessage);
    (fetchPerenualPlants as jest.Mock).mockRejectedValue(error);
    const { result } = renderHook(() => useCombinedPlantSearch(searchQuery));
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe(error);
  })

  it("should only return unique plants based on id or name", async () => {
    const searchQuery = "test";

    (fetchPerenualPlants as jest.Mock).mockResolvedValue([mockPlant, mockPlant2]);
    (fetchFirebasePlants as jest.Mock).mockResolvedValue([mockPlant, mockPlant2,
      { ...mockPlant, id: "3", name: "Unique Plant" }]);
    const { result } = renderHook(() => useCombinedPlantSearch(searchQuery));
    
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.plants).toHaveLength(3); // Should only have unique plants
  })
});
