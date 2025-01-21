import React from "react";
import { render, screen } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import RootLayout from "./RootLayout";
import { AuthContext } from "@context/auth/AuthProvider";
import mockAuthContextValue from "../../../jest/MockAuthContextValue";
import { AuthContextType } from "@context/auth/AuthTypes";

describe("RootLayout", () => {
    const renderRootLayout = (contextValue: AuthContextType) =>
        render(
            <AuthContext.Provider
                value={contextValue}
            >
                <NavigationContainer>
                    <RootLayout />
                </NavigationContainer>
            </AuthContext.Provider>
        );

    it("shows login & signup screens when user is not logged in", () => {
        const contextValueWithoutUser = {...mockAuthContextValue, user: null};
        renderRootLayout(contextValueWithoutUser);
        expect(screen.getByText("Create a new user")).toBeTruthy();
    });

    it("shows Tab, Profile, PlantSearch & SubmitPlant screens when user is logged in", () => {
        renderRootLayout(mockAuthContextValue);
        expect(screen.getByTestId("profile-button")).toBeTruthy();
        expect(screen.getByText("Plant Friends!")).toBeVisible();
    });
});