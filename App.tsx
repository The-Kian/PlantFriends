import './gesture-handler';

import React from "react";
import { SafeAreaView } from "react-native";

import RootLayout from "@components/navigation/RootLayout";
import { AuthProvider } from "@context/auth/AuthProvider";
import { NavigationContainer } from "@react-navigation/native";


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
