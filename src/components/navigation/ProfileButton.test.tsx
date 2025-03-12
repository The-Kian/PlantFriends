import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileSettingsScreen from "@screens/settings/profile";
import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";

import ProfileButton from "./ProfileButton";

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

  it("renders the correct icon", async () => {
    render(
      <NavigationContainer>
        <ProfileButton />
      </NavigationContainer>
    );

    const icon = await screen.findByTestId("profile-icon");
    expect(icon.props.name).toBe("person-circle-outline");
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
