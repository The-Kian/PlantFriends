/* eslint-disable @typescript-eslint/no-explicit-any */

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Notifications from "expo-notifications";

import { Alert, Linking, Text } from "react-native";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { AuthContext } from "@/context/auth/AuthProvider";
import { HouseholdContext } from "@/context/household/HouseholdProvider";
import setNotificationPref from "@/helpers/firebase/setNotificationPref";
import SignupScreen from "@/screens/auth/signup";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockHouseholdContext } from "@/test-utils/MockHousehold";

import ProfileSettingsScreen from "./index";

jest.mock("@/helpers/firebase/setNotificationPref", () =>
  jest.fn(async () => {}),
);

jest.mock("@/helpers/household/invites", () => ({
  createInvite: jest.fn(),
  previewInvite: jest.fn(),
  joinHousehold: jest.fn(),
  formatInviteCode: (code: string) => code,
  joinErrorMessage: () => "error",
}));

describe("ProfileSettingsScreen", () => {
  const Stack = createStackNavigator();

  // Create a component with props instead of using useNavigation hook
  const HomeScreen = ({ navigation }: any) => (
    <Text onPress={() => navigation.navigate("ProfileSettings")}>
      Go To Profile
    </Text>
  );
  const renderWithFullContext = (initialRouteName = "ProfileSettings") => {
    return render(
      <NavigationContainer>
        <AuthContext.Provider value={mockAuthContextValue}>
          <Stack.Navigator
            screenOptions={{ animation: "none" }}
            initialRouteName={initialRouteName}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="ProfileSettings"
              component={ProfileSettingsScreen}
            />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </Stack.Navigator>
        </AuthContext.Provider>
      </NavigationContainer>,
    );
  };

  it("turns housemate watering notifications off and shows the saved setting", () => {
    const renderProfile = (housemateActivity?: boolean) =>
      render(
        <NavigationContainer>
          <AuthContext.Provider value={{ ...mockAuthContextValue, user: mockUser }}>
            <HouseholdContext.Provider
              value={mockHouseholdContext({ notificationPrefs: { housemateActivity } })}
            >
              <ProfileSettingsScreen />
            </HouseholdContext.Provider>
          </AuthContext.Provider>
        </NavigationContainer>,
      );

    // On unless it has been switched off.
    const { unmount } = renderProfile();
    const toggle = screen.getByLabelText("When a housemate waters my plants");
    expect(toggle).toHaveProp("value", true);

    fireEvent(toggle, "valueChange", false);
    expect(setNotificationPref).toHaveBeenCalledWith(mockUser.uid, "housemateActivity", false);
    unmount();

    renderProfile(false);
    expect(screen.getByLabelText("When a housemate waters my plants")).toHaveProp("value", false);
  });

  const renderWithPrefs = (notificationPrefs = {}) =>
    render(
      <NavigationContainer>
        <AuthContext.Provider value={{ ...mockAuthContextValue, user: mockUser }}>
          <HouseholdContext.Provider value={mockHouseholdContext({ notificationPrefs })}>
            <ProfileSettingsScreen />
          </HouseholdContext.Provider>
        </AuthContext.Provider>
      </NavigationContainer>,
    );

  it("turns watering reminders off and shows the saved setting", () => {
    const { unmount } = renderWithPrefs();
    const toggle = screen.getByLabelText("Watering reminders");
    expect(toggle).toHaveProp("value", true);

    fireEvent(toggle, "valueChange", false);
    expect(setNotificationPref).toHaveBeenCalledWith(mockUser.uid, "reminders", false);
    unmount();

    renderWithPrefs({ reminders: false });
    expect(screen.getByLabelText("Watering reminders")).toHaveProp("value", false);
  });

  it("points to the phone's settings when notifications are denied", async () => {
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue({ status: "denied", canAskAgain: false } as never);
    const openSettings = jest
      .spyOn(Linking, "openSettings")
      .mockResolvedValue(undefined);

    renderWithPrefs();
    fireEvent.press(await screen.findByText("Open settings"));

    expect(openSettings).toHaveBeenCalled();
    // The switches can't do anything while it's off, so they look off too.
    expect(screen.getByLabelText("Watering reminders")).toHaveProp("disabled", true);
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue({ status: "granted" } as never);
  });

  it("doesn't say notifications are off when the phone was never asked", async () => {
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue({ status: "undetermined", canAskAgain: true } as never);
    renderWithPrefs();
    await waitFor(() => expect(Notifications.getPermissionsAsync).toHaveBeenCalled());
    expect(screen.queryByText("Open settings")).toBeNull();
    expect(screen.getByLabelText("Watering reminders")).not.toHaveProp("disabled", true);
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue({ status: "granted" } as never);
  });

  it("shows no settings hint when notifications are allowed", async () => {
    renderWithPrefs();
    await waitFor(() => expect(Notifications.getPermissionsAsync).toHaveBeenCalled());
    expect(screen.queryByText("Open settings")).toBeNull();
  });

  it("shows the household card", () => {
    render(
      <NavigationContainer>
        <AuthContext.Provider value={{ ...mockAuthContextValue, user: mockUser }}>
          <HouseholdContext.Provider value={mockHouseholdContext()}>
            <ProfileSettingsScreen />
          </HouseholdContext.Provider>
        </AuthContext.Provider>
      </NavigationContainer>,
    );

    expect(screen.getByText("Household")).toBeVisible();
    expect(screen.getByText("The Flat")).toBeVisible();
    expect(screen.getByText("Invite housemate")).toBeVisible();
  });

  it("renders correctly", () => {
    renderWithFullContext();
    expect(screen.getByText("Profile")).toBeVisible();
  });

  it("renders the Go back button and navigates", async () => {
    renderWithFullContext("Home");

    fireEvent.press(screen.getByText("Go To Profile"));

    const goBackButton = await screen.findByTestId("screen-header-back");
    fireEvent.press(goBackButton);

    await waitFor(() => {
      expect(screen.queryByText("Profile")).toBeNull();
    });
    expect(screen.getByText("Go To Profile")).toBeVisible();
  });

  it("asks before logging out", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    renderWithFullContext();

    fireEvent.press(await screen.findByText("Logout"));
    expect(alert).toHaveBeenCalledWith(
      "Log out?",
      expect.any(String),
      expect.any(Array),
    );
    expect(mockAuthContextValue.logout).not.toHaveBeenCalled();

    const buttons = alert.mock.calls.at(-1)?.[2] ?? [];
    buttons.find((b) => b.text === "Log out")?.onPress?.();
    expect(mockAuthContextValue.logout).toHaveBeenCalledTimes(1);
  });

  it("says when the new name is saved, and not when it isn't", async () => {
    mockAuthContextValue.update.mockResolvedValueOnce(true);
    renderWithFullContext();

    fireEvent.changeText(screen.getByLabelText("Display Name input field"), "Sammy");
    fireEvent.press(screen.getByText("Save name"));

    expect(await screen.findByText(/Saved\. Your housemates will see/)).toBeVisible();
    expect(mockAuthContextValue.update).toHaveBeenCalledWith({ displayName: "Sammy" });

    // Editing again clears it.
    fireEvent.changeText(screen.getByLabelText("Display Name input field"), "Sam");
    expect(screen.queryByText(/Saved\./)).toBeNull();

    mockAuthContextValue.update.mockResolvedValueOnce(false);
    fireEvent.press(screen.getByText("Save name"));
    await waitFor(() => expect(mockAuthContextValue.update).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/Saved\./)).toBeNull();
  });
});
