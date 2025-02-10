import { Alert, Text } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AuthProvider, AuthContext } from "./AuthProvider";
import React, { useContext } from "react";

import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import mockUser from "@test-utils/MockFirebaseUser";
import AuthTestComponent from "./test/AuthTestComponent";

// Custom test component to consume the context

describe("AuthProvider", () => {
  it("handles onAuthStateChanged updates correctly", async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );

    // Initial state
    expect(screen.getByTestId("initializing").props.children).toBe("true");
    expect(screen.getByTestId("user").props.children).toBe("null");

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("initializing").props.children).toBe("false");
      expect(screen.getByTestId("user").props.children).toBe(mockUser.email);
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
    await waitFor(() => {
      expect(screen.getByTestId("user").props.children).toBe(mockUser.email);
    });
    fireEvent.press(screen.getByTestId("logout"));
    await waitFor(() => {
      expect(auth().signOut).toHaveBeenCalled();
    });
  });

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
  });
});
