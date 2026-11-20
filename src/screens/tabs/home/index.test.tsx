import React from "react";

import { screen } from "@testing-library/react-native";

import { IUserPlant } from "@/constants/IPlant";
import { mockUserPlant } from "@/test-utils/MockPlant";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

import HomeScreen from "./index";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn() }),
  };
});

// The cards would fetch their species after the test has finished.
jest.mock("@/hooks/plants/useMergedPlant", () => ({
  __esModule: true,
  default: () => ({ mergedPlant: null, loading: false }),
}));

describe("HomeScreen", () => {
  const renderHome = () => renderWithProviders(<HomeScreen />);

  it("displays the correct title text", () => {
    renderHome();

    expect(screen.getByText("Plant Friends!")).toBeTruthy();
  });

  it("shows the household name", () => {
    renderHome();

    expect(screen.getByText("The Flat")).toBeTruthy();
  });

  it("asks for a first plant when there are none", () => {
    renderHome();

    expect(screen.getByText("No plants yet")).toBeTruthy();
    expect(screen.getByTestId("profile-button")).toBeTruthy();
  });

  const DAY = 24 * 60 * 60 * 1000;
  const plantWith = (id: string, fields: Partial<IUserPlant>): IUserPlant => ({
    ...mockUserPlant,
    id,
    custom_name: `Plant ${id}`,
    custom_watering_schedule: 3,
    ...fields,
  });

  it("is all caught up when a plant was just watered", () => {
    renderWithProviders(<HomeScreen />, {
      preloadedState: {
        userPlants: [plantWith("a", { last_watered_date: Date.now() })],
      },
    });

    expect(screen.getByText("All caught up")).toBeTruthy();
  });

  it("lists overdue and never-watered plants", () => {
    renderWithProviders(<HomeScreen />, {
      preloadedState: {
        userPlants: [
          plantWith("a", { last_watered_date: Date.now() - 5 * DAY }),
          plantWith("b", { last_watered_date: null }),
          plantWith("c", { last_watered_date: Date.now() }),
        ],
      },
    });

    expect(screen.getByText("Needs watering")).toBeTruthy();
    expect(screen.getByText("Plant a")).toBeTruthy();
    expect(screen.getByText("Plant b")).toBeTruthy();
    expect(screen.queryByText("Plant c")).toBeNull();
  });
});
