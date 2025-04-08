
import { NavigationContainer } from "@react-navigation/native";

import { SafeAreaView } from "react-native";
import { Provider } from 'react-redux';


import RootLayout from "@components/navigation/RootLayout";
import { AuthProvider } from "@context/auth/AuthProvider";
import { store } from "@store/store";
import './gesture-handler';
import TestComponent from "@store/testRedux";




export default function App() {
  return (
    <Provider store={store}>
    <AuthProvider>
      <NavigationContainer>
        <SafeAreaView />
        <RootLayout />
      </NavigationContainer>
    </AuthProvider>
    </Provider>
  );
}
