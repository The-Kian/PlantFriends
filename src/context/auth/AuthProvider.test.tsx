/* eslint-disable  @typescript-eslint/no-explicit-any */

import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import functions from "@react-native-firebase/functions";
import * as Notifications from "expo-notifications";
import React from "react";

import { Alert, Text } from "react-native";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { AuthContext, AuthProvider } from "./AuthProvider";
import AuthTestComponent from "./test/AuthTestComponent";

describe("AuthProvider", () => {
  it("handles onAuthStateChanged updates correctly", async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>,
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
      </AuthProvider>,
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
      </AuthProvider>,
    );
    fireEvent.press(screen.getByTestId("register"));
    await waitFor(() => {
      expect(auth().createUserWithEmailAndPassword).toHaveBeenCalled();
    });
  });

  it("renames through updateProfile and the updateDisplayName function", async () => {
    const callable = jest.fn(async () => ({ data: {} }));
    (functions as any)._mockHttpsCallable.mockReturnValueOnce(callable);
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>,
    );
    fireEvent.press(screen.getByTestId("update"));
    await waitFor(() => {
      expect(auth().currentUser?.updateProfile).toHaveBeenCalledWith({
        displayName: "New Name",
      });
      expect(callable).toHaveBeenCalledWith({ displayName: "New Name" });
    });
  });

  it("calls firebase signOut when logout function is called", async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>,
    );
    // Wait for the user state to be updated before logout
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("user.email");
    });
    fireEvent.press(screen.getByTestId("logout"));
    await waitFor(() => {
      expect(auth().signOut).toHaveBeenCalled();
    });
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });
});

// Error-handling tests
describe("AuthProvider error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  it("shows ErrorService's message for email already in use on registration", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (auth().createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/email-already-in-use",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>,
    );
    fireEvent.press(screen.getByTestId("register"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't sign up",
        "This email is already registered. Please log in or use a different email.",
        expect.any(Array),
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
      </AuthProvider>,
    );
    fireEvent.press(screen.getByTestId("register"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't sign up",
        "Please enter a valid email address.",
        expect.any(Array),
      );
    });
  });

  it("shows the friendly sign-in message for a wrong password or unknown email", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (auth().signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/invalid-credential",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>,
    );
    fireEvent.press(screen.getByTestId("login"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't log in",
        expect.stringContaining("don't match an account"),
        expect.any(Array),
      );
    });
  });

  it("shows console error for signIn", async () => {
    (auth().createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/sad",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>,
    );
    fireEvent.press(screen.getByTestId("register"));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
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
      </AuthProvider>,
    );
    fireEvent.press(screen.getByTestId("update"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't update your name",
        expect.any(String),
        expect.any(Array),
      );
    });
  });

  it("shows alert when the rename function fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (functions as any)._mockHttpsCallable.mockReturnValueOnce(
      jest.fn().mockRejectedValue({ code: "functions/unavailable" }),
    );

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>,
    );
    fireEvent.press(screen.getByTestId("update"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't update your name",
        expect.any(String),
        expect.any(Array),
      );
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
      </AuthProvider>,
    );
    fireEvent.press(screen.getByTestId("logout"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't log out",
        expect.any(String),
        expect.any(Array),
      );
    });
  });

  it("shows console error for login failure", async () => {
    (auth().signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/unknown-error",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>,
    );
    fireEvent.press(screen.getByTestId("login"));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "[Login] auth/unknown-error:",
        expect.objectContaining({ code: "auth/unknown-error" }),
      );
    });
  });
});

describe("AuthProvider sign-up", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  /** Fires sign-in events by hand, instead of the mock's automatic one. */
  const holdAuthEvents = () => {
    let listener: (user: unknown) => void = () => {};
    (auth().onAuthStateChanged as jest.Mock).mockImplementationOnce((cb) => {
      listener = cb;
      return jest.fn();
    });
    return (user: unknown) => listener(user);
  };

  const RegisterWithName = () => {
    const { register, user } = React.useContext(AuthContext);
    return (
      <>
        <Text testID="who">{user ? user.displayName ?? "no name" : "nobody"}</Text>
        <Text
          testID="register-sam"
          onPress={() =>
            register({ email: "sam@x.test", password: "secret1", displayName: " Sam " })
          }
        >
          Register
        </Text>
      </>
    );
  };

  it("puts the name on the account and profile before anyone sees the new user", async () => {
    const fire = holdAuthEvents();
    const updateProfile = jest.fn(async () => {
      // Mid-setup, the new user must not have been published yet.
      expect(screen.getByTestId("who")).toHaveTextContent("nobody");
    });
    const newUser = { uid: "u9", displayName: null, email: "sam@x.test", updateProfile };
    (auth().createUserWithEmailAndPassword as jest.Mock).mockImplementationOnce(async () => {
      fire(newUser); // Firebase signs the new account in straight away.
      return { user: newUser };
    });

    render(
      <AuthProvider>
        <RegisterWithName />
      </AuthProvider>,
    );
    fireEvent.press(screen.getByTestId("register-sam"));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({ displayName: "Sam" });
    });
    expect((firestore as any)._mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: "Sam", email: "sam@x.test" }),
    );
    // Once set up, the user is shown (here the mock's currentUser).
    await waitFor(() => {
      expect(screen.getByTestId("who")).not.toHaveTextContent("nobody");
    });
  });

  it("falls back to the email's first part when no name is given", async () => {
    const newUser = { uid: "u9", displayName: null, email: "sam@x.test", updateProfile: jest.fn() };
    (auth().createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({ user: newUser });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>,
    );
    fireEvent.press(screen.getByTestId("register"));

    await waitFor(() => {
      expect((firestore as any)._mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: "test" }),
      );
    });
    expect(newUser.updateProfile).not.toHaveBeenCalled();
  });
});
