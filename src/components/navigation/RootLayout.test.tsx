import { NavigationContainer } from "@react-navigation/native";
import React from "react";

import { render, screen } from "@testing-library/react-native";

import { AuthContext } from "@context/auth/AuthProvider";
import { AuthContextType } from "@context/auth/AuthTypes";

import RootLayout from "./RootLayout";
import mockAuthContextValue from "../../test-utils/MockAuthContextValue";

describe("RootLayout", () => {
    const renderRootLayout = (contextValue: AuthContextType) =>
        render(
            <AuthContext.Provider value={contextValue}>
                <NavigationContainer>
                    <RootLayout />
                </NavigationContainer>
            </AuthContext.Provider>
        );

    it("shows login & signup screens when user is not logged in", async () => {
        const contextValueWithoutUser = { ...mockAuthContextValue, user: null };
        renderRootLayout(contextValueWithoutUser);
        expect(await screen.findByText("Create a new user")).toBeTruthy();
    });

    it("shows Tab, Profile, PlantSearch & SubmitPlant screens when user is logged in", async () => {
        renderRootLayout(mockAuthContextValue);
        expect(screen.getByTestId("profile-button")).toBeTruthy();
        expect(await screen.findByText("Plant Friends!")).toBeTruthy();
    });
});