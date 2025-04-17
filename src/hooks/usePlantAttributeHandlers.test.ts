import { renderHook } from "@testing-library/react-native";
import { usePlantAttributeHandlers } from "./usePlantAttributeHandlers";
import { mockPlant, mockUserPlant } from "@test-utils/MockPlant";
import { renderHookWithProviders } from "@test-utils/renderHookWithProviders";

describe("usePlantAttributeHandlers", () => {
  it("should initialize with default values", () => {
    const { result } = renderHookWithProviders(() =>
      usePlantAttributeHandlers(mockPlant, mockUserPlant), {
        preloadedState: {
          userPlants: {
            userPlants: [],
            loading: false,
            error: null,
          },
        },
      }
    );
  });
});
