import React from "react";

import { View } from "react-native";

import { screen } from "@testing-library/react-native";

import ParallaxScrollView from "@/components/ui/Views/ParallaxScrollView";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

import HomeScreen from "./index";

jest.mock("@/components/ui/Views/ParallaxScrollView");
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

(ParallaxScrollView as jest.Mock).mockImplementation(
  ({ children, headerBackgroundColor, headerImage }) => (
    <>
      <View testID="parallax-header-image">{headerImage}</View>
      <View testID="parallax-content">{children}</View>
    </>
  ),
);

describe("HomeScreen", () => {
  const renderHome = () => renderWithProviders(<HomeScreen />);

  it("displays the correct title text", () => {
    renderHome();

    expect(screen.getByText("Plant Friends!")).toBeTruthy();
  });
});
