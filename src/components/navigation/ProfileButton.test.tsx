import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileSettingsScreen from "@screens/settings/profile";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import ProfileButton from "./ProfileButton";


describe("ProfileButton", () => {
  it("renders correctly", () => {
    render(
      <NavigationContainer>
        <ProfileButton />
      </NavigationContainer>
    );

    const button = screen.getByTestId("profile-button");
    expect(button).toBeVisible();
  });

  it("renders the correct icon", () => {
    render(
      <NavigationContainer>
        <ProfileButton />
      </NavigationContainer>
    );

    const icon = screen.getByTestId("profile-icon");
    expect(icon.props.name).toBe("person-circle-outline");
  });
  
  it("navigates to Profile screen when Profile button is pressed", async () => {
    const Stack = createStackNavigator();

    render(
      <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={ProfileButton} />
        <Stack.Screen name="Profile" component={ProfileSettingsScreen} options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
    );
 fireEvent.press(screen. findByTestId("profile-button"));

    await waitFor(() => {
      expect(screen.getByText("Profile")).toBeOnTheScreen();
    });
  });
});
