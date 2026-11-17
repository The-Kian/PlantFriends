// jest/setup.js

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */


// include this line for mocking react-native-gesture-handler
import "react-native-gesture-handler/jestSetup";

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@/components/ui/Text/ThemedText", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children }) => <Text>{children}</Text>,
  };
});

jest.mock("@/components/ui/Views/ThemedView", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return {
    ThemedView: ({ children, style, ...props }) => (
      <View style={style} {...props}>
        {children}
      </View>
    ),
  };
});

jest.mock("react-native-uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  scheduleNotificationAsync: jest.fn(async () => "notification-id"),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  getPresentedNotificationsAsync: jest.fn(async () => []),
  dismissNotificationAsync: jest.fn(async () => {}),
  getExpoPushTokenAsync: jest.fn(async () => ({
    type: "expo",
    data: "ExponentPushToken[test-device]",
  })),
  getLastNotificationResponseAsync: jest.fn(async () => null),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  SchedulableTriggerInputTypes: {
    DATE: "date",
    TIME_INTERVAL: "timeInterval",
  },
}));

// const CONSOLE_FAIL_TYPES = ['error', 'warn']

// // Throw errors when a `console.error` or `console.warn` happens
// // by overriding the functions
// CONSOLE_FAIL_TYPES.forEach((type) => {
//   console[type] = (message) => {
//     throw new Error(
//       `Failing due to console.${type} while running test!\n\n${message}`,
//     )
//   }
// })

jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);

// Whether Sign in with Apple is available is answered asynchronously, and the
// button's state update would land after most tests have finished, outside
// act(). Leave the question unanswered by default; tests that need the button
// resolve it themselves.
beforeEach(() => {
  const Apple = require("expo-apple-authentication");
  Apple.isAvailableAsync.mockImplementation(() => new Promise(() => {}));
});

// React Navigation's stack card still uses InteractionManager, which React
// Native now warns about on every test run. Nothing in this app calls it.
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("InteractionManager has been deprecated")
  ) {
    return;
  }
  originalWarn(...args);
};
