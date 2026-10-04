/* eslint-disable @typescript-eslint/no-explicit-any */

import auth from "@react-native-firebase/auth";
import { setDoc } from "@react-native-firebase/firestore";
import functions from "@react-native-firebase/functions";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Notifications from "expo-notifications";

import { Alert, Platform } from "react-native";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { AuthProvider } from "./AuthProvider";
import AuthTestComponent from "./test/AuthTestComponent";

const renderProvider = () =>
  render(
    <AuthProvider>
      <AuthTestComponent />
    </AuthProvider>,
  );

describe("AuthProvider social sign-in", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    console.error = jest.fn();
  });

  it("signs in with Google and creates a profile for new users", async () => {
    renderProvider();
    fireEvent.press(screen.getByTestId("signInWithGoogle"));

    await waitFor(() => {
      expect(auth().signInWithCredential).toHaveBeenCalledWith(
        expect.objectContaining({ providerId: "google.com" }),
      );
    });
    expect(auth.GoogleAuthProvider.credential).toHaveBeenCalledWith(
      "google-id-token",
    );
    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ displayName: expect.any(String) }),
        { merge: true },
      );
    });
  });

  it("does not overwrite the profile of a returning user", async () => {
    (auth().signInWithCredential as jest.Mock).mockResolvedValueOnce({
      user: { uid: "user1" },
      additionalUserInfo: { isNewUser: false },
    });
    renderProvider();
    fireEvent.press(screen.getByTestId("signInWithGoogle"));

    await waitFor(() => {
      expect(auth().signInWithCredential).toHaveBeenCalled();
    });
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("does nothing when the Google sign-in is cancelled", async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValueOnce({
      type: "cancelled",
      data: null,
    });
    renderProvider();
    fireEvent.press(screen.getByTestId("signInWithGoogle"));

    await waitFor(() => {
      expect(GoogleSignin.signIn).toHaveBeenCalled();
    });
    expect(auth().signInWithCredential).not.toHaveBeenCalled();
  });

  it("signs in with Apple using the nonce and saves the name", async () => {
    renderProvider();
    fireEvent.press(screen.getByTestId("signInWithApple"));

    await waitFor(() => {
      expect(auth().signInWithCredential).toHaveBeenCalled();
    });
    expect(AppleAuthentication.signInAsync).toHaveBeenCalledWith(
      expect.objectContaining({ nonce: "hashed-nonce" }),
    );
    expect(auth.AppleAuthProvider.credential).toHaveBeenCalledWith(
      "apple-identity-token",
      "raw-nonce",
    );
    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ displayName: "Test User" }),
        { merge: true },
      );
    });
  });

  it("does nothing when the Apple sign-in is cancelled", async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValueOnce({
      code: "ERR_REQUEST_CANCELED",
    });
    renderProvider();
    fireEvent.press(screen.getByTestId("signInWithApple"));

    await waitFor(() => {
      expect(AppleAuthentication.signInAsync).toHaveBeenCalled();
    });
    expect(auth().signInWithCredential).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("explains when the email is already used by another sign-in method", async () => {
    (auth().signInWithCredential as jest.Mock).mockRejectedValueOnce({
      code: "auth/account-exists-with-different-credential",
    });
    renderProvider();
    fireEvent.press(screen.getByTestId("signInWithGoogle"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Account already exists",
        expect.any(String),
      );
    });
  });
});

describe("AuthProvider deleteAccount", () => {
  const originalPlatform = Platform.OS;
  const currentUser = auth().currentUser as any;
  const originalProviderData = currentUser.providerData;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    console.error = jest.fn();
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
    currentUser.providerData = originalProviderData;
  });

  it("calls the deleteAccount function, cancels reminders and signs out", async () => {
    const callable = jest.fn(async () => ({ data: { deleted: true } }));
    (functions as any)._mockHttpsCallable.mockReturnValueOnce(callable);

    renderProvider();
    fireEvent.press(screen.getByTestId("deleteAccount"));

    await waitFor(() => {
      expect(auth().signOut).toHaveBeenCalled();
    });
    expect((functions as any)._mockHttpsCallable).toHaveBeenCalledWith(
      "deleteAccount",
    );
    expect(callable).toHaveBeenCalled();
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(auth().revokeToken).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Account deleted",
      expect.any(String),
    );
  });

  it("revokes the Apple token before deleting an Apple account on iOS", async () => {
    Platform.OS = "ios";
    currentUser.providerData = [{ providerId: "apple.com" }];

    renderProvider();
    fireEvent.press(screen.getByTestId("deleteAccount"));

    await waitFor(() => {
      expect(auth().revokeToken).toHaveBeenCalledWith("apple-auth-code");
    });
    await waitFor(() => {
      expect((functions as any)._mockHttpsCallable).toHaveBeenCalledWith(
        "deleteAccount",
      );
    });
  });

  it("stops if the user cancels the Apple confirmation", async () => {
    Platform.OS = "ios";
    currentUser.providerData = [{ providerId: "apple.com" }];
    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValueOnce({
      code: "ERR_REQUEST_CANCELED",
    });

    renderProvider();
    fireEvent.press(screen.getByTestId("deleteAccount"));

    await waitFor(() => {
      expect(AppleAuthentication.signInAsync).toHaveBeenCalled();
    });
    expect((functions as any)._mockHttpsCallable).not.toHaveBeenCalled();
    expect(auth().signOut).not.toHaveBeenCalled();
  });

  it("keeps the user signed in if the function fails", async () => {
    (functions as any)._mockHttpsCallable.mockReturnValueOnce(
      jest.fn(async () => {
        throw { code: "functions/internal", message: "boom" };
      }),
    );

    renderProvider();
    fireEvent.press(screen.getByTestId("deleteAccount"));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
    expect(auth().signOut).not.toHaveBeenCalled();
  });
});
