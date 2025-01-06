import { createStackNavigator } from "@react-navigation/stack";
import { useContext } from "react";
import React from "react";

import { AuthContext } from "@context/auth/AuthProvider";

import LoginScreen from "@screens/auth/login";
import SignupScreen from "@screens/auth/signup";
import PlantSearchScreen from "@screens/PlantSearch";
import ProfileSettingsScreen from "@screens/settings/profile";
import SubmitPlantScreen from "@screens/SubmitPlant";

import TabNavigator from "./TabNavigator";


type RootLayoutProps = {
  initialRouteName?: string;
};


export default function RootLayout({ initialRouteName }: RootLayoutProps) {
  const { user } = useContext(AuthContext);

  const Stack = createStackNavigator();

  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
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

