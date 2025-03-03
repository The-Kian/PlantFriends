import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";
import SignupScreen from "./signup";
import { AuthContext } from "@context/auth/AuthProvider";
import { View, TouchableOpacity, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import mockAuthContextValue from "@test-utils/MockAuthContextValue";

describe("SignupScreen", () => {
  // Create mock functions we can inspect
  const registerMock = jest.fn();
  const updateMock = jest.fn();

  const renderSignUpScreen = () => {
    return render(
      <NavigationContainer>
        <AuthContext.Provider value={{...mockAuthContextValue, register: registerMock}}>
          <SignupScreen />
        </AuthContext.Provider>
      </NavigationContainer>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    registerMock.mockReset();
    updateMock.mockReset();
  });

  // Test initial rendering state
  it("should render AuthContent initially", () => {
    renderSignUpScreen();

    expect(screen.getByText("Login instead")).toBeOnTheScreen();
    expect(screen.queryByTestId("loading-overlay")).toBeNull();
  });

  it("should show loading overlay when authentication starts", async () => {
    registerMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderSignUpScreen();

    const signUpButton = screen.getByText("Sign Up");

    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(screen.getByText("Signing up...")).toBeOnTheScreen();
    });
  });

  it("returns to AuthContent after authentication completes", async () => {
    registerMock.mockResolvedValue(undefined);
    updateMock.mockResolvedValue(undefined);

    renderSignUpScreen();
    
    const signUpButton = screen.getByText("Sign Up");
    fireEvent.press(signUpButton);

    await waitFor(() => {
        expect(screen.queryByText("Signing up...")).not.toBeOnTheScreen();
        expect(screen.getByTestId("AuthContent-View")).toBeOnTheScreen();
      });
  });
});
