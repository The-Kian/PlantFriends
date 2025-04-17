import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";

import ProfileSettingsScreen from "@screens/settings/profile";

import ProfileButton from "./ProfileButton";
import { useColorScheme } from "react-native";
import { Colors } from "@theme/Colors";

describe("ProfileButton", () => {
  it("renders correctly", async () => {
    render(
      <NavigationContainer>
        <ProfileButton />
      </NavigationContainer>
    );

    const button = await screen.findByTestId("profile-button");
    expect(button).toBeVisible();
  });

  it("renders the correct icon in light mode", async () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    render(
      <NavigationContainer>
        <ProfileButton />
      </NavigationContainer>
    );

    const icon = await screen.findByTestId("profile-icon");
    expect(icon.props.name).toBe("person-circle-outline");
    expect(icon.props.color).toBe(Colors.light.text);
  });

  it("renders the correct icon in dark mode", async () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');
    render(
      <NavigationContainer>
        <ProfileButton />
      </NavigationContainer>
    );

    const icon = await screen.findByTestId("profile-icon");
    expect(icon.props.name).toBe("person-circle-outline");
    expect(icon.props.color).toBe(Colors.dark.text);
  });

  it("navigates to Profile screen when Profile button is pressed", async () => {
    const Stack = createStackNavigator();

    render(
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ animation: 'none' }}>
          <Stack.Screen name="Home" component={ProfileButton} />
          <Stack.Screen
            name="Profile"
            component={ProfileSettingsScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );

    fireEvent.press(screen.getByTestId("profile-button"));
    jest.useFakeTimers();
    act(() => {
      jest.runAllTimers();
    });
    
    const profileText = await screen.findByText("Profile");
    expect(profileText).toBeTruthy();
    
  });
});
