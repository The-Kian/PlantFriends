
import AuthNavigator from "@/context/auth/AuthNavigator";
import TabLayout from "./(tabs)/_layout";
import HomeScreen from "./(tabs)/home";
import { AuthProvider } from "context/auth/AuthProvider";
import React from "react";
import RootLayout from "./_layout";

export default function Index() {

  return (
    <AuthProvider>
      <RootLayout  />
    </AuthProvider>
  );
}

