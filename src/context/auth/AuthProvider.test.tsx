import auth from "@react-native-firebase/auth";
import React from "react";

import { Alert } from "react-native";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import mockUser from "@test-utils/MockFirebaseUser";

import { AuthProvider } from "./AuthProvider";
import AuthTestComponent from "./test/AuthTestComponent";

describe("AuthProvider", () => {
  it("handles onAuthStateChanged updates correctly", async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );

    // Check initial state using text content assertions
    expect(screen.getByTestId("initializing")).toHaveTextContent("true");
    expect(screen.getByTestId("user")).toHaveTextContent("null");

    // Wait for state update on initializing
    await waitFor(() => {
      expect(screen.getByTestId("initializing")).toHaveTextContent("false");
    });
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("user.email");
    });
  });

  it("calls firebase signInWithEmailAndPassword when login function is called", async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("login"));
    await waitFor(() => {
      expect(auth().signInWithEmailAndPassword).toHaveBeenCalled();
    });
  });

  it("calls firebase createUserWithEmailAndPassword when register function is called", async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("register"));
    await waitFor(() => {
      expect(auth().createUserWithEmailAndPassword).toHaveBeenCalled();
    });
  });

  it("calls firebase updateProfile when update function is called", async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("update"));
    await waitFor(() => {
      expect(auth().currentUser?.updateProfile).toHaveBeenCalled();
    });
  });

  it("calls firebase signOut when logout function is called", async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    // Wait for the user state to be updated before logout
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(mockUser.email);
    });
    fireEvent.press(screen.getByTestId("logout"));
    await waitFor(() => {
      expect(auth().signOut).toHaveBeenCalled();
    });
  });
});

// Error-handling tests
describe("AuthProvider error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows alert for email already in use on registration", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (auth().createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/email-already-in-use",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("register"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "That email address is already in use!"
      );
    });
  });

  it("shows alert for invalid email on registration", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (auth().createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/invalid-email",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("register"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("That email address is invalid!");
    });
  });

  it("shows alert for user not found on login", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (auth().signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/user-not-found",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("login"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("User not found");
    });
  });

  it("shows alert for update failed", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (auth().currentUser?.updateProfile as jest.Mock).mockRejectedValueOnce({
      message: "err0r",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("update"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error updating profile:", "err0r");
    });
  });

  it("shows alert for error logging out failed", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (auth().signOut as jest.Mock).mockRejectedValueOnce({
      message: "err0r",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("logout"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error logging out:", "err0r");
    });
  });
});
