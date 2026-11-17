/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  AppleAuthProvider,
  GoogleAuthProvider,
  getAuth,
  signInWithCredential,
  signOut,
} from "@react-native-firebase/auth";
import { setDoc } from "@react-native-firebase/firestore";
import * as functionsModule from "@react-native-firebase/functions";
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

const _mockHttpsCallable = (
  functionsModule as unknown as { _mockHttpsCallable: jest.Mock }
)._mockHttpsCallable;

const renderProvider = () =>
  render(
    <AuthProvider>
      <AuthTestComponent />
    </AuthProvider>
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
      expect(signInWithCredential).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ providerId: "google.com" })
      );
    });
    expect(GoogleAuthProvider.credential).toHaveBeenCalledWith(
      "google-id-token"
    );
    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ displayName: expect.any(String) }),
        { merge: true }
      );
    });
  });

  it("does not overwrite the profile of a returning user", async () => {
    (signInWithCredential as jest.Mock).mockResolvedValueOnce({
      user: { uid: "user1" },
      additionalUserInfo: { isNewUser: false },
    });
    renderProvider();
    fireEvent.press(screen.getByTestId("signInWithGoogle"));

    await waitFor(() => {
      expect(signInWithCredential).toHaveBeenCalled();
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
    expect(signInWithCredential).not.toHaveBeenCalled();
  });

  it("signs in with Apple using the nonce and saves the name", async () => {
    renderProvider();
    fireEvent.press(screen.getByTestId("signInWithApple"));

    await waitFor(() => {
      expect(signInWithCredential).toHaveBeenCalled();
    });
    expect(AppleAuthentication.signInAsync).toHaveBeenCalledWith(
      expect.objectContaining({ nonce: "hashed-nonce" })
    );
    expect(AppleAuthProvider.credential).toHaveBeenCalledWith(
      "apple-identity-token",
      "raw-nonce"
    );
    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ displayName: "Test User" }),
        { merge: true }
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
    expect(signInWithCredential).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("explains when the email is already used by another sign-in method", async () => {
    (signInWithCredential as jest.Mock).mockRejectedValueOnce({
      code: "auth/account-exists-with-different-credential",
    });
    renderProvider();
    fireEvent.press(screen.getByTestId("signInWithGoogle"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Couldn't sign in with Google",
        expect.stringContaining("already exists"),
        expect.anything()
      );
    });
  });
});

describe("AuthProvider deleteAccount", () => {
  const originalPlatform = Platform.OS;
  const currentUser = getAuth().currentUser as any;
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
    _mockHttpsCallable.mockReturnValueOnce(callable);

    renderProvider();
    fireEvent.press(screen.getByTestId("deleteAccount"));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
    expect(_mockHttpsCallable).toHaveBeenCalledWith("deleteAccount");
    expect(callable).toHaveBeenCalled();
    expect(
      Notifications.cancelAllScheduledNotificationsAsync
    ).toHaveBeenCalled();
    expect(getAuth().revokeToken).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Account deleted",
      expect.any(String)
    );
  });

  it("revokes the Apple token before deleting an Apple account on iOS", async () => {
    Platform.OS = "ios";
    currentUser.providerData = [{ providerId: "apple.com" }];

    renderProvider();
    fireEvent.press(screen.getByTestId("deleteAccount"));

    await waitFor(() => {
      expect(getAuth().revokeToken).toHaveBeenCalledWith("apple-auth-code");
    });
    await waitFor(() => {
      expect(_mockHttpsCallable).toHaveBeenCalledWith("deleteAccount");
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
    expect(_mockHttpsCallable).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("keeps the user signed in if the function fails", async () => {
    _mockHttpsCallable.mockReturnValueOnce(
      jest.fn(async () => {
        throw { code: "functions/internal", message: "boom" };
      })
    );

    renderProvider();
    fireEvent.press(screen.getByTestId("deleteAccount"));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
    expect(signOut).not.toHaveBeenCalled();
  });
});
