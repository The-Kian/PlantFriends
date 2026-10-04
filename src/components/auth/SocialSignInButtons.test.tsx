import * as AppleAuthentication from "expo-apple-authentication";

import { Platform } from "react-native";

import { fireEvent, render, screen } from "@testing-library/react-native";

import { AuthContext } from "@/context/auth/AuthProvider";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";

import SocialSignInButtons from "./SocialSignInButtons";

const renderButtons = () =>
  render(
    <AuthContext.Provider value={mockAuthContextValue}>
      <SocialSignInButtons />
    </AuthContext.Provider>,
  );

describe("SocialSignInButtons", () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
  });

  it("calls signInWithGoogle when the Google button is pressed", () => {
    renderButtons();
    fireEvent.press(screen.getByTestId("google-sign-in"));
    expect(mockAuthContextValue.signInWithGoogle).toHaveBeenCalled();
  });

  it("shows the Apple button on iOS when available", async () => {
    Platform.OS = "ios";
    renderButtons();
    fireEvent.press(await screen.findByTestId("apple-sign-in"));
    expect(mockAuthContextValue.signInWithApple).toHaveBeenCalled();
  });

  it("hides the Apple button on Android", () => {
    Platform.OS = "android";
    renderButtons();
    expect(screen.queryByTestId("apple-sign-in")).toBeNull();
    expect(AppleAuthentication.isAvailableAsync).not.toHaveBeenCalled();
  });
});
