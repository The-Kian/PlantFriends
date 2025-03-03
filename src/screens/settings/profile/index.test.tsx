import { NavigationContainer } from "@react-navigation/native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Text } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileSettingsScreen from "./index";
import { RootStackParamList } from "@components/navigation/types";
import { AuthContext } from "@context/auth/AuthProvider";
import SignupScreen from "@screens/auth/signup";
import mockAuthContextValue from "@test-utils/MockAuthContextValue";

const Stack = createStackNavigator();

// Create a component with props instead of using useNavigation hook
const HomeScreen = ({ navigation }: any) => (
  <Text onPress={() => navigation.navigate("ProfileSettings")}>
    Go To Profile
  </Text>
);

describe("ProfileSettingsScreen", () => {
  const renderWithNavigation = () => {
    render(
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ animation: "none" }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="ProfileSettings"
            component={ProfileSettingsScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  const renderWithAuthContext = () => {
    render(
      <NavigationContainer>
        <AuthContext.Provider value={mockAuthContextValue}>
          <ProfileSettingsScreen />
        </AuthContext.Provider>
      </NavigationContainer>
    );
  };

  it("renders correctly", () => {
    renderWithAuthContext();
    expect(screen.getByText("Profile")).toBeVisible();
  });

  it("renders the Go back button and navigates", async () => {
    renderWithNavigation();

    fireEvent.press(screen.getByText("Go To Profile"));

    const goBackButton = await waitFor(() => screen.getByText("Go back"));
    fireEvent.press(goBackButton);

    await waitFor(() => {
      expect(screen.queryByText("Profile")).toBeNull();
      expect(screen.getByText("Go To Profile")).toBeVisible();
    });
  });

  it("renders the Logout button and logs out", async () => {
    renderWithAuthContext();

    const logoutButton = await waitFor(() => screen.getByText("Logout"));
    fireEvent.press(logoutButton);

    expect(mockAuthContextValue.logout).toHaveBeenCalledTimes(1);
  });


});