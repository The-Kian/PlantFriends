/* eslint-disable @typescript-eslint/no-explicit-any */

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { Text } from "react-native";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { AuthContext } from "@context/auth/AuthProvider";
import SignupScreen from "@screens/auth/signup";
import mockAuthContextValue from "@test-utils/MockAuthContextValue";



import ProfileSettingsScreen from "./index";


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
          <Stack.Navigator screenOptions={{ animation: "none" }} initialRouteName={initialRouteName}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </Stack.Navigator>
        </AuthContext.Provider>
      </NavigationContainer>
    );
  };

  it("renders correctly", () => {
    renderWithFullContext();
    expect(screen.getByText("Profile")).toBeVisible();
  });

  it("renders the Go back button and navigates", async () => {
    renderWithFullContext("Home");

    fireEvent.press(screen.getByText("Go To Profile"));

    const goBackButton = await screen.findByText("Go back");
    fireEvent.press(goBackButton);

    await waitFor(() => {
      expect(screen.queryByText("Profile")).toBeNull();
    });
    expect(screen.getByText("Go To Profile")).toBeVisible();
  });

  it("renders the Logout button and logs out", async () => {
    renderWithFullContext();

    const logoutButton = await screen.findByText("Logout");
    fireEvent.press(logoutButton);

    expect(mockAuthContextValue.logout).toHaveBeenCalledTimes(1);
  });


});