import { AuthProvider } from "@context/auth/AuthProvider";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootLayout from "@components/navigation/RootLayout";
import { SafeAreaView } from "react-native";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <SafeAreaView />
        <RootLayout />
      </NavigationContainer>
    </AuthProvider>
  );
}
