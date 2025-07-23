import React from "react";
import { render } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./AuthStack";

describe("AuthStack", () => {
    it("renders the Login screen as the initial route", () => {
        const { getByText } = render(
            <NavigationContainer>
                <AuthStack />
            </NavigationContainer>
        );

        expect(getByText("Log In")).toBeTruthy();
    });

    it("contains the SignUp screen", () => {
        const { getByText } = render(
            <NavigationContainer>
                <AuthStack />
            </NavigationContainer>
        );

        expect(getByText("Create a new user")).toBeTruthy();
    });
});