import { useRoute } from "@react-navigation/native";
import React from "react";

import { Alert, View } from "react-native";

import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";

import { WateringSplash } from "@/components/watering/WateringSplash";
import { AuthContext } from "@/context/auth/AuthProvider";
import logWatering from "@/helpers/firebase/logWatering";
import { calculateNextWateringDate } from "@/helpers/plants/wateringCalculations";
import useMergedPlant from "@/hooks/plants/useMergedPlant";
import ErrorService from "@/services/ErrorService";
import { setupStore } from "@/store/store";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockHousehold } from "@/test-utils/MockHousehold";
import { mockPlant, mockUserPlant } from "@/test-utils/MockPlant";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

import PlantDetailsScreen, { PLANT_ARRIVAL_MS } from "./index";

jest.mock("@/helpers/notifications/registerWithExplanation", () => ({
  registerWithExplanation: jest.fn(async () => null),
}));
jest.mock("@react-navigation/native", () => ({
  useRoute: jest.fn(),
  useNavigation: () => ({ goBack: jest.fn() }),
}));
jest.mock("@/helpers/firebase/logWatering");
jest.mock("@/hooks/plants/useMergedPlant");
// Plain functions (not jest.fn) so resetAllMocks below leaves the insets intact.
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock("@/components/watering/WateringSplash", () => ({
  WateringSplash: jest.fn(),
}));

describe("PlantDetailsScreen watering", () => {
  const now = new Date("2026-10-03T12:00:00Z").getTime();
  const plant = { ...mockUserPlant, custom_watering_schedule: 3 };
  const renderDetails = (
    user: typeof mockUser | null = mockUser,
    userPlant: typeof plant = plant
  ) => {
    const store = setupStore({ userPlants: [userPlant] });
    jest.spyOn(store, "dispatch");
    return renderWithProviders(
      <AuthContext.Provider value={{ ...mockAuthContextValue, user }}>
        <PlantDetailsScreen />
      </AuthContext.Provider>,
      { store }
    );
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(useRoute).mockReturnValue({
      key: "details",
      name: "PlantDetails",
      params: { plantId: plant.id },
    });
    jest.mocked(useMergedPlant).mockReturnValue({
      mergedPlant: { ...mockPlant, watering_frequency: 7 },
      loading: false,
    });
    jest
      .mocked(WateringSplash)
      .mockImplementation(({ visible }) =>
        visible ? <View testID="watering-splash" /> : null
      );
    jest.spyOn(Date, "now").mockReturnValue(now);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    // Keep the real service to verify that each failure produces exactly one alert.
    jest.spyOn(ErrorService, "handleError");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("updates Redux and shows the splash at once, without waiting for the server", async () => {
    const updatedPlant = {
      ...plant,
      last_watered_date: now,
      next_watering_date: calculateNextWateringDate(now, 3),
      last_watered_by: mockUser.uid,
      last_watered_by_name: "Kian",
    };
    jest.mocked(logWatering).mockReturnValue(updatedPlant);
    const { store } = renderDetails({ ...mockUser, displayName: "Kian" });
    const dispatch = jest.spyOn(store, "dispatch");

    fireEvent.press(screen.getByText("Log First Watering"));

    expect(logWatering).toHaveBeenCalledWith(
      mockHousehold.id,
      plant,
      { uid: mockUser.uid, displayName: "Kian" },
      3,
      expect.objectContaining({ onWaiting: expect.any(Function) })
    );
    await waitFor(() => {
      expect(screen.getByTestId("watering-splash")).toBeTruthy();
    });
    expect(store.getState().userPlants).toEqual([updatedPlant]);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("watering-splash")).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(ErrorService.handleError).not.toHaveBeenCalled();
  });

  it("shows which housemate did the last watering", () => {
    renderDetails(mockUser, {
      ...plant,
      last_watered_date: now - 86_400_000,
      last_watered_by: "user2",
      last_watered_by_name: "Sam",
    });

    expect(screen.getByText(/, by Sam$/)).toBeTruthy();
  });

  it("does not show success and alerts only once when logging fails", async () => {
    const error = new Error("Watering write rejected");
    jest.mocked(logWatering).mockImplementation(() => {
      throw error;
    });
    const { store } = renderDetails();
    const dispatch = jest.spyOn(store, "dispatch");

    fireEvent.press(screen.getByText("Log First Watering"));

    expect(logWatering).toHaveBeenCalledTimes(1);
    expect(store.getState().userPlants).toEqual([plant]);
    expect(dispatch).not.toHaveBeenCalled();
    expect(screen.queryByTestId("watering-splash")).toBeNull();
    await waitFor(() => {
      expect(ErrorService.handleError).toHaveBeenCalledTimes(1);
    });
    expect(ErrorService.handleError).toHaveBeenCalledWith(
      error,
      "Log Watering",
      { userMessage: "Failed to log watering. Please try again." }
    );
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it("says the watering will sync while the server hasn't confirmed it", async () => {
    let hooks: { onWaiting?: () => void; onSynced?: () => void } = {};
    jest.mocked(logWatering).mockImplementation((_h, p, _w, _f, given) => {
      hooks = given ?? {};
      return p;
    });
    renderDetails();

    fireEvent.press(screen.getByText("Log First Watering"));
    const note = "Saved on this phone. It will sync when you're online.";
    expect(screen.queryByText(note)).toBeNull();

    act(() => hooks.onWaiting?.());
    expect(screen.getByText(note)).toBeTruthy();

    act(() => hooks.onSynced?.());
    expect(screen.queryByText(note)).toBeNull();
  });

  it("waits for a just-added plant before saying it isn't there", () => {
    jest.useFakeTimers();
    try {
      jest.mocked(useRoute).mockReturnValue({
        key: "details",
        name: "PlantDetails",
        params: { plantId: "not-arrived-yet" },
      });
      renderDetails();
      expect(screen.queryByText("Plant not found")).toBeNull();

      act(() => jest.advanceTimersByTime(PLANT_ARRIVAL_MS));
      expect(screen.getByText("Plant not found")).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it("does not write or show success when unauthenticated", async () => {
    const { store } = renderDetails(null);
    const dispatch = jest.spyOn(store, "dispatch");

    fireEvent.press(screen.getByText("Log First Watering"));

    expect(logWatering).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(screen.queryByTestId("watering-splash")).toBeNull();
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(ErrorService.handleError).not.toHaveBeenCalled();
  });
});
