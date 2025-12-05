import { NavigationContainer } from "@react-navigation/native";
import React from "react";

import { render, screen } from "@testing-library/react-native";

import TabNavigator from "./TabNavigator";

jest.mock("@/screens/tabs/home", () => () => null);
jest.mock("@/screens/tabs/MyPlants", () => () => null);
jest.mock("./ProfileButton", () => () => null);

describe("TabNavigator", () => {
  it("renders tab screens with correct labels", async () => {
    render(
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>,
    );
    expect(await screen.findByRole("button", { name: "Home" })).toBeTruthy();
    expect(
      await screen.findByRole("button", { name: "My Plants" }),
    ).toBeTruthy();
  });
});
