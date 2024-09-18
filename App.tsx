import { AuthProvider } from "@context/auth/AuthProvider";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootLayout from "@components/navigation/RootLayout";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootLayout />
      </NavigationContainer>
    </AuthProvider>
  );
}
