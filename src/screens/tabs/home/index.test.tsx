import React from "react";

import { View } from "react-native";

import { render, screen } from "@testing-library/react-native";

import { HelloWave } from "@/components/ui/HelloWave";
import ParallaxScrollView from "@/components/ui/Views/ParallaxScrollView";

import HomeScreen from "./index";

jest.mock("@/components/ui/HelloWave");
jest.mock("@/components/ui/Views/ParallaxScrollView");

(HelloWave as jest.Mock).mockImplementation(() => (
  <View testID="hello-wave">HelloWave Mock</View>
));

(ParallaxScrollView as jest.Mock).mockImplementation(
  ({ children, headerBackgroundColor, headerImage }) => (
    <>
      <View testID="parallax-header-image">{headerImage}</View>
      <View testID="parallax-content">{children}</View>
    </>
  ),
);

describe("HomeScreen", () => {
  it("displays the correct title text", () => {
    render(<HomeScreen />);

    expect(screen.getByText("Plant Friends!")).toBeTruthy();
  });
});
