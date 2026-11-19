import { NavigationContainer } from "@react-navigation/native";
import React from "react";

import { render, fireEvent, screen } from "@testing-library/react-native";

import { AuthProps } from "@/context/auth/AuthTypes";

import AuthForm from "./AuthForm";

describe("AuthForm Component", () => {
  const mockOnSubmit = jest.fn();

  const defaultProps: AuthProps = {
    authScreenType: "login",
    onSubmit: mockOnSubmit,
  };

  const renderComponent = (props = {}) => {
    return render(
      <NavigationContainer>
        <AuthForm {...defaultProps} {...props} />
      </NavigationContainer>
    );
  };

  it("renders correctly for login", () => {
    renderComponent();
    expect(screen.getByText("Email Address")).toBeVisible();
    expect(screen.getByText("Password")).toBeVisible();
    expect(screen.getByText("Log In")).toBeVisible();
  });

  it("renders correctly for signUp", () => {
    renderComponent({ authScreenType: "signUp" });
    expect(screen.getByText("Email Address")).toBeVisible();
    expect(screen.getByText("Confirm Email Address")).toBeVisible();
    expect(screen.getByText("Password")).toBeVisible();
    expect(screen.getByText("Confirm Password")).toBeVisible();
    expect(screen.queryByText("Date of Birth")).toBeNull();
    expect(screen.getByText("Sign Up")).toBeVisible();
  });

  it("doesn't capitalise or autocorrect emails and passwords", () => {
    renderComponent({ authScreenType: "signUp" });
    for (const label of [
      "Email Address",
      "Confirm Email Address",
      "Password",
      "Confirm Password",
    ]) {
      const input = screen.getByLabelText(`${label} input field`);
      expect(input).toHaveProp("autoCapitalize", "none");
      expect(input).toHaveProp("autoCorrect", false);
    }
  });

  it("renders correctly for update", () => {
    renderComponent({ authScreenType: "update" });
    expect(screen.getByText("Display Name")).toBeVisible();
    expect(screen.getByText("Update Details")).toBeVisible();
  });

  it("updates input values correctly", () => {
    renderComponent({ authScreenType: "signUp" });

    fireEvent.changeText(
      screen.getByLabelText("Email Address input field"),
      "new@example.com"
    );
    fireEvent.changeText(
      screen.getByLabelText("Confirm Email Address input field"),
      "new@example.com"
    );
    fireEvent.changeText(
      screen.getByLabelText("Password input field"),
      "newpassword"
    );
    fireEvent.changeText(
      screen.getByLabelText("Confirm Password input field"),
      "newpassword"
    );
    fireEvent.changeText(
      screen.getByLabelText("Display Name input field"),
      "New User"
    );

    fireEvent.press(screen.getByText("Sign Up"));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "newpassword",
      displayName: "New User",
      confirmEmail: "new@example.com",
      confirmPassword: "newpassword",
    });
  });

  it("starts empty even in dev builds", () => {
    renderComponent({ authScreenType: "signUp" });
    expect(screen.getByLabelText("Email Address input field")).toHaveProp(
      "value",
      ""
    );
    expect(screen.getByLabelText("Password input field")).toHaveProp(
      "value",
      ""
    );
  });

  it("can show and hide the password", () => {
    renderComponent();
    const input = screen.getByLabelText("Password input field");
    expect(input).toHaveProp("secureTextEntry", true);
    fireEvent.press(screen.getByLabelText("Show password"));
    expect(screen.getByLabelText("Password input field")).toHaveProp(
      "secureTextEntry",
      false
    );
    fireEvent.press(screen.getByLabelText("Hide password"));
    expect(screen.getByLabelText("Password input field")).toHaveProp(
      "secureTextEntry",
      true
    );
  });

  it("calls onSubmit with correct credentials for login", () => {
    renderComponent();
    fireEvent.changeText(
      screen.getByLabelText("Email Address input field"),
      "test@test.com"
    );
    fireEvent.changeText(
      screen.getByLabelText("Password input field"),
      "password"
    );
    fireEvent.press(screen.getByText("Log In"));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@test.com",
        password: "password",
      })
    );
  });
});
