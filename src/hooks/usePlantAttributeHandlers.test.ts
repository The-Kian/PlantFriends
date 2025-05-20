import * as reactRedux from "react-redux";

import { waitFor } from "@testing-library/react-native";


import { updatePlant } from "@store/userPlantsSlice";
import { mockPlant, mockUserPlant } from "@test-utils/MockPlant";
import { renderHookWithProviders } from "@test-utils/renderHookWithProviders";


import { usePlantAttributeHandlers } from "./usePlantAttributeHandlers";

describe("usePlantAttributeHandlers", () => {
  it("should initialize with default values", () => {
    const { result } = renderHookWithProviders(
      () => usePlantAttributeHandlers(mockPlant, mockUserPlant),
      {
        preloadedState: {
          userPlants: {
            userPlants: [],
            loading: false,
            error: null,
          },
        },
      }
    );
    expect(result.current.customizations).toEqual({});
    expect(result.current.userData).toEqual({
      ...mockUserPlant,
      plantId: mockPlant.id,
      id: mockUserPlant.id,
      custom_attributes: {},
    });
  });

  it("should update customizations when handlePlantAttributeChange is called", async () => {
    const { result } = renderHookWithProviders(() =>
      usePlantAttributeHandlers(mockPlant, mockUserPlant)
    );
    // First run
    await waitFor(() => {
      result.current.handlePlantAttributeChange("name", "newName");
    });
    expect(result.current.customizations).toEqual({ name: "newName" });

    // Check cumaltive updates
    await waitFor(() => {
      result.current.handlePlantAttributeChange("toxicity", "megaHigh");
    });

    expect(result.current.customizations).toEqual({
      name: "newName",
      toxicity: "megaHigh",
    });
  });

  it("should update userData when handleUserDataChange is called", async () => {
    const { result } = renderHookWithProviders(() =>
      usePlantAttributeHandlers(mockPlant, mockUserPlant)
    );
    // First run
    await waitFor(() => {
      result.current.handleUserDataChange("custom_name", "customName");
    });
    expect(result.current.userData).toMatchObject({
      custom_name: "customName",
    });

    // Check cumaltive updates
    const date = new Date();
    date.setDate(12);
    await waitFor(() => {
      result.current.handleUserDataChange("next_watering_date", date);
    });

    expect(result.current.userData).toMatchObject({
      custom_name: "customName",
      next_watering_date: date,
    });
  });

  it("should correctly handle the save action", async () => {
    const onSaveMock = jest.fn();
    const onCloseMock = jest.fn();
    const fakeDispatch = jest.fn((action) => action);
    jest.spyOn(reactRedux, "useDispatch").mockReturnValue(fakeDispatch);

    const { result } = renderHookWithProviders(
      () => usePlantAttributeHandlers(mockPlant, mockUserPlant),
      { preloadedState: [] }
    );

    await waitFor(() => {
      result.current.handlePlantAttributeChange("slug", "newSlug");
      result.current.handleUserDataChange("reminders_enabled", true);
    });

    result.current.handleSave(onSaveMock, onCloseMock, mockPlant);

    expect(onSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        custom_attributes: { slug: "newSlug" },
        reminders_enabled: true,
      }),
      mockPlant
    );

    expect(fakeDispatch).toHaveBeenCalledWith(
      updatePlant(
        expect.objectContaining({
          custom_attributes: { slug: "newSlug" },
          reminders_enabled: true,
        })
      )
    );
    expect(onCloseMock).toHaveBeenCalled();
  });
});
