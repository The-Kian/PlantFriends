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

import PlantDetailsScreen from "./index";

jest.mock("@/services/PushRegistration", () => ({
  registerForPush: jest.fn(async () => null),
  unregisterForPush: jest.fn(async () => {}),
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
    userPlant: typeof plant = plant,
  ) => {
    const store = setupStore({ userPlants: [userPlant] });
    jest.spyOn(store, "dispatch");
    return renderWithProviders(
      <AuthContext.Provider value={{ ...mockAuthContextValue, user }}>
        <PlantDetailsScreen />
      </AuthContext.Provider>,
      { store },
    );
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(useRoute).mockReturnValue({
      key: "details", name: "PlantDetails", params: { plantId: plant.id },
    });
    jest.mocked(useMergedPlant).mockReturnValue({
      mergedPlant: { ...mockPlant, watering_frequency: 7 },
      loading: false,
    });
    jest.mocked(WateringSplash).mockImplementation(({ visible }) =>
      visible ? <View testID="watering-splash" /> : null,
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

  it("shows the watering at once, without waiting for the write", async () => {
    const watering = {
      last_watered_date: now,
      next_watering_date: calculateNextWateringDate(now, 3),
      last_watered_by: mockUser.uid,
      last_watered_by_name: "Kian",
    };
    let resolveWrite!: (watered: typeof plant) => void;
    jest.mocked(logWatering).mockReturnValue(new Promise((resolve) => {
      resolveWrite = resolve;
    }));
    const { store } = renderDetails({ ...mockUser, displayName: "Kian" });

    fireEvent.press(screen.getByText("Log First Watering"));

    expect(logWatering).toHaveBeenCalledWith(
      mockHousehold.id,
      plant,
      { uid: mockUser.uid, displayName: "Kian" },
      3,
      expect.objectContaining({ now }),
    );
    // Offline, the write may take a while: the screen doesn't.
    expect(store.getState().userPlants).toEqual([{ ...plant, ...watering }]);
    expect(screen.getByTestId("watering-splash")).toBeTruthy();

    await act(async () => {
      resolveWrite({ ...plant, ...watering } as typeof plant);
    });
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(ErrorService.handleError).not.toHaveBeenCalled();
  });

  it("says it will sync when the write is still waiting, and stops saying so once it has", async () => {
    let hooks!: { onWaiting: () => void; onSynced: () => void };
    jest.mocked(logWatering).mockImplementation(async (...args) => {
      hooks = args[4] as typeof hooks;
      return new Promise(() => {}); // never settles during the test
    });
    renderDetails();

    fireEvent.press(screen.getByText("Log First Watering"));
    expect(screen.queryByText(/sync when you're online/)).toBeNull();

    act(() => hooks.onWaiting());
    expect(screen.getByText(/sync when you're online/)).toBeTruthy();

    act(() => hooks.onSynced());
    expect(screen.queryByText(/sync when you're online/)).toBeNull();
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

  it("does not show success and alerts only once after a rejected write", async () => {
    const error = new Error("Watering write rejected");
    jest.mocked(logWatering).mockRejectedValue(error);
    const { store } = renderDetails();

    fireEvent.press(screen.getByText("Log First Watering"));

    expect(logWatering).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(ErrorService.handleError).toHaveBeenCalledTimes(1);
    });
    // Shown at once, then put back when the server refuses it.
    expect(store.getState().userPlants).toEqual([plant]);
    expect(screen.queryByTestId("watering-splash")).toBeNull();
    expect(ErrorService.handleError).toHaveBeenCalledWith(
      error, "Log Watering",
      { userMessage: "Failed to log watering. Please try again." },
    );
    expect(Alert.alert).toHaveBeenCalledTimes(1);
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