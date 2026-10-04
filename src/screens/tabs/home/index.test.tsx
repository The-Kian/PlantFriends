import React from "react";

import { screen } from "@testing-library/react-native";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import HomeScreen from "./index";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn() }),
  };
});
jest.mock("@/hooks/plants/useUserPlants", () => ({
  __esModule: true,
  default: () => ({ getPlants: jest.fn(async () => []) }),
}));

describe("HomeScreen", () => {
  const renderHome = () => renderWithProviders(<HomeScreen />);

  it("displays the correct title text", () => {
    renderHome();

    expect(screen.getByText("Plant Friends!")).toBeTruthy();
  });

  it("shows the all-caught-up state when nothing needs water", () => {
    renderHome();

    expect(screen.getByText("All caught up")).toBeTruthy();
    expect(screen.getByTestId("profile-button")).toBeTruthy();
  });
});
