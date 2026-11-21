/* eslint-disable  @typescript-eslint/no-explicit-any */

import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "@react-native-firebase/auth";
import { setDoc } from "@react-native-firebase/firestore";
import * as functionsModule from "@react-native-firebase/functions";
import * as Notifications from "expo-notifications";
import { useContext } from "react";

import { Alert, Text } from "react-native";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import * as PushRegistration from "@/services/PushRegistration";

import { AuthContext, AuthProvider } from "./AuthProvider";
import AuthTestComponent from "./test/AuthTestComponent";

jest.mock("@/services/PushRegistration", () => ({
  registerForPush: jest.fn(),
  unregisterForPush: jest.fn(async () => {}),
}));

const mockHttpsCallable = (
  functionsModule as unknown as { _mockHttpsCallable: jest.Mock }
)._mockHttpsCallable;

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
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
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
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
    });
  });

  it("calls the updateDisplayName function, then updates the profile, when update is called", async () => {
    const callable = jest.fn(async () => ({
      data: { displayName: "New Name", householdName: "New Name's home" },
    }));
    mockHttpsCallable.mockReturnValueOnce(callable);

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("update"));
    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith(getAuth().currentUser, {
        displayName: "New Name",
      });
    });
    expect(mockHttpsCallable).toHaveBeenCalledWith("updateDisplayName");
    expect(callable).toHaveBeenCalledWith({ displayName: "New Name" });
  });

  it("calls firebase signOut when logout function is called", async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    // Wait for the user state to be updated before logout
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("user.email");
    });
    fireEvent.press(screen.getByTestId("logout"));
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
    expect(
      Notifications.cancelAllScheduledNotificationsAsync
    ).toHaveBeenCalled();
  });
});

describe("AuthProvider sign-up", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  it("sets the name on the account, and in Users, before publishing the user", async () => {
    const order: string[] = [];
    let authListener: ((user: unknown) => void) | undefined;
    (onAuthStateChanged as jest.Mock).mockImplementationOnce(
      (_auth: unknown, cb: (user: unknown) => void) => {
        authListener = cb;
        return jest.fn();
      }
    );
    const newUser = { uid: "new-user", displayName: null };
    (createUserWithEmailAndPassword as jest.Mock).mockImplementationOnce(
      async () => {
        order.push("created");
        // Firebase signs the new user in right away.
        authListener?.(newUser);
        return { user: newUser };
      }
    );
    (updateProfile as jest.Mock).mockImplementationOnce(async () => {
      order.push("profile");
    });
    (setDoc as jest.Mock).mockImplementationOnce(async () => {
      order.push("users doc");
    });

    function Register() {
      const { register, user } = useContext(AuthContext);
      if (user) order.push("published");
      return (
        <Text
          testID="register-sam"
          onPress={() =>
            register({
              email: "sam@example.com",
              password: "secret1",
              displayName: "Sam",
            })
          }
        >
          Register
        </Text>
      );
    }

    render(
      <AuthProvider>
        <Register />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("register-sam"));

    await waitFor(() => {
      expect(order).toContain("published");
    });
    expect(order).toEqual(["created", "profile", "users doc", "published"]);
    expect(updateProfile).toHaveBeenCalledWith(newUser, {
      displayName: "Sam",
    });
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      { displayName: "Sam", email: "sam@example.com" },
      { merge: true }
    );
  });

  it("falls back to the start of the email when no name is given", async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("register"));
    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        { displayName: "test", email: "test@example.com" },
        { merge: true }
      );
    });
  });
});

// Error-handling tests
describe("AuthProvider error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  it("explains an email that is already in use on registration", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
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
        "Couldn't sign up",
        expect.stringContaining("already registered"),
        expect.anything()
      );
    });
  });

  it("explains an invalid email on registration", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/invalid-email",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("register"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't sign up",
        expect.stringContaining("valid email"),
        expect.anything()
      );
    });
  });

  it("goes through ErrorService when login fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/invalid-credential",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("login"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't log in",
        expect.stringContaining("don't match"),
        expect.anything()
      );
    });
  });

  it("shows console error for sign-up failure", async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/sad",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("register"));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  it("alerts when the rename fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockHttpsCallable.mockReturnValueOnce(
      jest.fn(async () => {
        throw { code: "functions/internal", message: "err0r" };
      })
    );

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("update"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't save your name",
        expect.any(String),
        expect.anything()
      );
    });
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("alerts when logging out fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (signOut as jest.Mock).mockRejectedValueOnce({
      message: "err0r",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("logout"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't log out",
        expect.any(String),
        expect.anything()
      );
    });
  });

  it("still logs out when unregistering the device fails", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    (PushRegistration.unregisterForPush as jest.Mock).mockRejectedValueOnce(
      new Error("offline")
    );

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("logout"));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });

  it("shows console error for login failure", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/unknown-error",
    });

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId("login"));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "[Login] auth/unknown-error:",
        expect.objectContaining({ code: "auth/unknown-error" })
      );
    });
  });
});
