import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { Provider } from "react-redux";

import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import RootLayout from "@/components/navigation/RootLayout";
import { AuthProvider } from "@/context/auth/AuthProvider";
import { useTheme } from "@/hooks/utils/useTheme";
import { setupStore } from "@/store/store";

import "./gesture-handler";

// Create the Redux store once at module scope so it's not recreated on every render
const store = setupStore();

function ThemedNavigation() {
  const theme = useTheme();
  const base = theme.dark ? DarkTheme : DefaultTheme;

  // Keep React Navigation's own surfaces (screen bg, tab bar, headers) on-palette.
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      <RootLayout />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <Provider store={store}>
          <AuthProvider>
            <ThemedNavigation />
          </AuthProvider>
        </Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
