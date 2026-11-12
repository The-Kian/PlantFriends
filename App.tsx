import {
  createNavigationContainerRef,
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useCallback, useContext, useEffect, useRef } from "react";
import { Provider } from "react-redux";

import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import RootLayout from "@/components/navigation/RootLayout";
import { RootStackParamList } from "@/components/navigation/types";
import { AuthContext, AuthProvider } from "@/context/auth/AuthProvider";
import { HouseholdProvider } from "@/context/household/HouseholdProvider";
import { useTheme } from "@/hooks/utils/useTheme";
import { PlantNotificationData } from "@/services/NotificationService";
import { setupStore } from "@/store/store";

import "./gesture-handler";

// Create the Redux store once at module scope so it's not recreated on every render
const store = setupStore();

const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Opens the plant a tapped notification is about, including when the tap
// launched the app. Waits until navigation is ready and someone is signed in.
function useNotificationTaps(signedIn: boolean) {
  const pendingPlantId = useRef<string | null>(null);

  const openPending = useCallback(() => {
    const plantId = pendingPlantId.current;
    if (!plantId || !signedIn || !navigationRef.isReady()) return;
    pendingPlantId.current = null;
    navigationRef.navigate("PlantDetails", { plantId });
  }, [signedIn]);

  const openPendingRef = useRef(openPending);
  openPendingRef.current = openPending;

  // Retry once someone signs in.
  useEffect(() => {
    openPending();
  }, [openPending]);

  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse | null) => {
      const data = response?.notification.request.content.data as
        | PlantNotificationData
        | undefined;
      if (data?.plantId) {
        pendingPlantId.current = data.plantId;
        openPendingRef.current();
      }
    };

    Notifications.getLastNotificationResponseAsync()
      .then(handle)
      .catch(() => {});
    const subscription =
      Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, []);

  return openPending;
}

function ThemedNavigation() {
  const theme = useTheme();
  const base = theme.dark ? DarkTheme : DefaultTheme;
  const { user } = useContext(AuthContext);
  const openPendingNotification = useNotificationTaps(Boolean(user));

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
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={openPendingNotification}
    >
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
            <HouseholdProvider>
              <ThemedNavigation />
            </HouseholdProvider>
          </AuthProvider>
        </Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
