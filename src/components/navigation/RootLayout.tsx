import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { useContext } from "react";

import LoadingOverlay from "@/components/ui/Views/LoadingOverlay";
import { AuthContext } from "@/context/auth/AuthProvider";
import LoginScreen from "@/screens/auth/login";
import SignupScreen from "@/screens/auth/signup";
import PlantDetailsScreen from "@/screens/PlantDetails";
import PlantSearchScreen from "@/screens/PlantSearch";
import ProfileSettingsScreen from "@/screens/settings/profile";

import TabNavigator from "./TabNavigator";

type RootLayoutProps = {
  initialRouteName?: string;
};

// Created once. Made inside the component it was a new navigator type on
// every render, which can remount the whole stack.
const Stack = createStackNavigator();

export default function RootLayout({ initialRouteName }: RootLayoutProps) {
  const { user, initializing } = useContext(AuthContext);

  // Until Firebase says whether someone is signed in, showing the login
  // screen would flash it at every cold start.
  if (initializing) {
    return <LoadingOverlay message="Loading..." />;
  }

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
            name="PlantDetails"
            component={PlantDetailsScreen}
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
