/* eslint-disable @typescript-eslint/no-explicit-any */

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Notifications from "expo-notifications";

import { Alert, Linking, Text } from "react-native";

import {
  act,
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

// Lets the notification permission check finish inside act().
const settle = () =>
  act(async () => {
    await Promise.resolve();
  });

describe("ProfileSettingsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

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

  it("turns housemate watering notifications off and shows the saved setting", async () => {
    const renderProfile = async (housemateActivity?: boolean) => {
      const view = render(
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
      await settle();
      return view;
    };

    // On unless it has been switched off.
    const { unmount } = await renderProfile();
    const toggle = screen.getByLabelText("When a housemate waters my plants");
    expect(toggle).toHaveProp("value", true);

    fireEvent(toggle, "valueChange", false);
    expect(setNotificationPref).toHaveBeenCalledWith(mockUser.uid, "housemateActivity", false);
    unmount();

    await renderProfile(false);
    expect(screen.getByLabelText("When a housemate waters my plants")).toHaveProp("value", false);
  });

  const renderWithPrefs = async (notificationPrefs = {}) => {
    const view = render(
      <NavigationContainer>
        <AuthContext.Provider value={{ ...mockAuthContextValue, user: mockUser }}>
          <HouseholdContext.Provider value={mockHouseholdContext({ notificationPrefs })}>
            <ProfileSettingsScreen />
          </HouseholdContext.Provider>
        </AuthContext.Provider>
      </NavigationContainer>,
    );
    await settle();
    return view;
  };

  it("turns watering reminders off and shows the saved setting", async () => {
    const { unmount } = await renderWithPrefs();
    const toggle = screen.getByLabelText("Watering reminders");
    expect(toggle).toHaveProp("value", true);

    fireEvent(toggle, "valueChange", false);
    expect(setNotificationPref).toHaveBeenCalledWith(mockUser.uid, "reminders", false);
    unmount();

    await renderWithPrefs({ reminders: false });
    expect(screen.getByLabelText("Watering reminders")).toHaveProp("value", false);
  });

  it("points to the phone's settings when notifications are denied", async () => {
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue({ status: "denied" } as never);
    const openSettings = jest
      .spyOn(Linking, "openSettings")
      .mockResolvedValue(undefined);

    await renderWithPrefs();
    fireEvent.press(await screen.findByText("Open settings"));

    expect(openSettings).toHaveBeenCalled();
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue({ status: "granted" } as never);
  });

  it("greys out the switches when notifications are denied", async () => {
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue({ status: "denied" } as never);
    await renderWithPrefs();

    expect(screen.getByText(/turned off for PlantFriends/)).toBeVisible();
    expect(screen.getByLabelText("Watering reminders")).toBeDisabled();
    expect(
      screen.getByLabelText("When a housemate waters my plants"),
    ).toBeDisabled();
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue({ status: "granted" } as never);
  });

  it("doesn't call it denied when the phone has never been asked", async () => {
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue({ status: "undetermined" } as never);
    await renderWithPrefs();

    expect(screen.queryByText(/turned off for PlantFriends/)).toBeNull();
    expect(screen.getByLabelText("Watering reminders")).not.toBeDisabled();
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue({ status: "granted" } as never);
  });

  it("shows no settings hint when notifications are allowed", async () => {
    await renderWithPrefs();
    await waitFor(() => expect(Notifications.getPermissionsAsync).toHaveBeenCalled());
    expect(screen.queryByText("Open settings")).toBeNull();
  });

  it("shows the household card", async () => {
    render(
      <NavigationContainer>
        <AuthContext.Provider value={{ ...mockAuthContextValue, user: mockUser }}>
          <HouseholdContext.Provider value={mockHouseholdContext()}>
            <ProfileSettingsScreen />
          </HouseholdContext.Provider>
        </AuthContext.Provider>
      </NavigationContainer>,
    );

    await settle();
    expect(screen.getByText("Household")).toBeVisible();
    expect(screen.getByText("The Flat")).toBeVisible();
    expect(screen.getByText("Invite housemate")).toBeVisible();
  });

  it("renders correctly", async () => {
    renderWithFullContext();
    await settle();
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
    renderWithFullContext();

    const logoutButton = await screen.findByText("Logout");
    fireEvent.press(logoutButton);

    expect(mockAuthContextValue.logout).not.toHaveBeenCalled();
    const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];
    buttons.find((b) => b.text === "Log out")?.onPress?.();

    expect(mockAuthContextValue.logout).toHaveBeenCalledTimes(1);
  });

  it("doesn't log out when cancelled", async () => {
    renderWithFullContext();

    fireEvent.press(await screen.findByText("Logout"));
    const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];
    buttons.find((b) => b.text === "Cancel")?.onPress?.();

    expect(mockAuthContextValue.logout).not.toHaveBeenCalled();
  });

  it("says Saved after the name is saved, and clears it when edited", async () => {
    const update = jest.fn(async () => true);
    render(
      <NavigationContainer>
        <AuthContext.Provider
          value={{ ...mockAuthContextValue, user: mockUser, update }}
        >
          <ProfileSettingsScreen />
        </AuthContext.Provider>
      </NavigationContainer>,
    );
    await settle();

    expect(screen.queryByText("Saved")).toBeNull();
    fireEvent.changeText(screen.getByLabelText("Display Name input field"), "Sam");
    fireEvent.press(screen.getByText("Save name"));

    expect(await screen.findByText("Saved")).toBeVisible();
    expect(update).toHaveBeenCalledWith({ displayName: "Sam" });

    fireEvent.changeText(screen.getByLabelText("Display Name input field"), "Sammy");
    expect(screen.queryByText("Saved")).toBeNull();
  });
});
