import { NavigationContainer } from "@react-navigation/native";
import React from "react";

import { screen } from "@testing-library/react-native";

import { AuthContext } from "@/context/auth/AuthProvider";
import { AuthContextType } from "@/context/auth/AuthTypes";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

import RootLayout from "./RootLayout";

describe("RootLayout", () => {
  const renderRootLayout = (contextValue: AuthContextType) =>
    renderWithProviders(
      <AuthContext.Provider value={contextValue}>
        <NavigationContainer>
          <RootLayout />
        </NavigationContainer>
      </AuthContext.Provider>,
    );

  it("shows login & signup screens when user is not logged in", async () => {
    const contextValueWithoutUser = { ...mockAuthContextValue, user: null };
    renderRootLayout(contextValueWithoutUser);
    expect(await screen.findByText("Create a new user")).toBeTruthy();
  });

  it("shows Tab, Profile, PlantSearch & SubmitPlant screens when user is logged in", async () => {
    renderRootLayout(mockAuthContextValue);
    expect(screen.getByTestId("profile-button")).toBeTruthy();
    expect(await screen.findByText("Manage Your Plants")).toBeTruthy();
  });
});
