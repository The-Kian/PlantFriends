import { NavigationContainer } from "@react-navigation/native";
import React from "react";

import { render, screen } from "@testing-library/react-native";

import AuthStack from "./AuthStack";

describe("AuthStack", () => {
    it("renders the Login screen as the initial route", () => {
        render(
            <NavigationContainer>
                <AuthStack />
            </NavigationContainer>
        );

        expect(screen.getByText("Log In")).toBeTruthy();
    });

    it("contains the SignUp screen", () => {
        render(
            <NavigationContainer>
                <AuthStack />
            </NavigationContainer>
        );

        expect(screen.getByText("Create a new user")).toBeTruthy();
    });
});