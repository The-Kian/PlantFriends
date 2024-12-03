import { useContext } from "react";
import { AuthContext } from "@context/auth/AuthProvider";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "@screens/auth/login";
import TabNavigator from "./TabNavigator";
import SignupScreen from "@screens/auth/signup";
import ProfileSettingsScreen from "@screens/settings/profile";
import PlantSearchScreen from "@screens/PlantSearch";
import SubmitPlantScreen from "@screens/SubmitPlant";

export default function RootLayout() {
  const { user } = useContext(AuthContext);

  const Stack = createStackNavigator();

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen
            name="Tab"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileSettingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PlantSearch"
            component={PlantSearchScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SubmitPlant"
            component={SubmitPlantScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
