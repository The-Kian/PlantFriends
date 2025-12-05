import { NavigationContainer } from "@react-navigation/native";
import "@testing-library/jest-native/extend-expect";
import React from "react";

import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";

import { AuthContext } from "@/context/auth/AuthProvider";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";

import SignupScreen from "./signup";

describe("SignupScreen", () => {
  const renderSignUpScreen = () => {
    return render(
      <NavigationContainer>
        <AuthContext.Provider value={mockAuthContextValue}>
          <SignupScreen />
        </AuthContext.Provider>
      </NavigationContainer>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render AuthContent initially", () => {
    renderSignUpScreen();

    expect(screen.getByText("Login instead")).toBeOnTheScreen();
    expect(screen.queryByTestId("loading-overlay")).toBeNull();
  });

  it("should show loading overlay when authentication starts", async () => {
    mockAuthContextValue.register.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderSignUpScreen();

    fireEvent.changeText(screen.getByPlaceholderText("Enter Email Address"), "test@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("Enter Confirm Email Address"), "test@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("Enter Display Name"), "PlantFriend");
    
    const dobInput = screen.queryByPlaceholderText("Enter Date of Birth");
    if (dobInput) {
      fireEvent.changeText(dobInput, "01/01/2000"); 
    }

    fireEvent.changeText(screen.getByPlaceholderText("Enter Password"), "password123");
    fireEvent.changeText(screen.getByPlaceholderText("Enter Confirm Password"), "password123");

    const signUpButton = screen.getByText("Sign Up");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(screen.getByText("Signing up...")).toBeOnTheScreen();
    });
  });

  it("returns to AuthContent after authentication completes", async () => {
    mockAuthContextValue.register.mockResolvedValue(undefined);
    mockAuthContextValue.update.mockResolvedValue(undefined);

    renderSignUpScreen();

    fireEvent.changeText(screen.getByPlaceholderText("Enter Email Address"), "test@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("Enter Confirm Email Address"), "test@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("Enter Display Name"), "PlantFriend");
    
    const dobInput = screen.queryByPlaceholderText("Enter Date of Birth");
    if (dobInput) {
      fireEvent.changeText(dobInput, "01/01/2000"); 
    }

    fireEvent.changeText(screen.getByPlaceholderText("Enter Password"), "password123");
    fireEvent.changeText(screen.getByPlaceholderText("Enter Confirm Password"), "password123");

    const signUpButton = screen.getByText("Sign Up");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(screen.queryByText("Signing up...")).not.toBeOnTheScreen();
    });
    expect(screen.getByTestId("AuthContent-View")).toBeOnTheScreen();
  });
});