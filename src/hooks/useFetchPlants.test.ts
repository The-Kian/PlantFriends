import { renderHook, waitFor } from "@testing-library/react-native";

import { fetchOpenFarmPlants } from "@helpers/plantAPI/fetchPlantAPI";
import { mockPlant } from "@test-utils/MockPlant";

import { useFetchPlants } from "./useFetchPlants";

jest.mock("@helpers/plantAPI/fetchPlantAPI", () => ({
  fetchOpenFarmPlants: jest.fn(),
}));

describe("useFetchPlants", () => {
  it("should set loading to true when searchQuery is not empty", async () => {
    const searchQuery = "test";
    const { result } = renderHook(() => useFetchPlants(searchQuery));
    await waitFor(() => {
    expect(result.current.loading).toBe(true);
    });
  });

  it("should set loading to false and error to null when searchQuery is empty", async () => {
    const searchQuery = "";
    const { result } = renderHook(() => useFetchPlants(searchQuery));
    await waitFor(() => {
    expect(result.current.loading).toBe(false);
    });
  });

  it("sets plants fetched from openfarm API", async () => {
    (fetchOpenFarmPlants as jest.Mock).mockResolvedValue([mockPlant]);
    const searchQuery = "test";
    const { result } = renderHook(() => useFetchPlants(searchQuery));
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.plants).toEqual(expect.arrayContaining([expect.objectContaining(mockPlant)]));
  });
});
