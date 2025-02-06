import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import TabNavigator from "./TabNavigator";
import { NavigationContainer } from "@react-navigation/native";

jest.mock("@screens/tabs/home", () => () => null);
jest.mock("@screens/tabs/MyPlants", () => () => null);
jest.mock("./ProfileButton", () => () => null);

describe("TabNavigator", () => {
  it("renders tab screens with correct labels", async () => {
    render(
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    );
    await expect(screen.findByRole("button", { name: "Home" })).toBeTruthy();
    await expect(
      screen.findByRole("button", { name: "My Plants" })
    ).toBeTruthy();
  });
});
