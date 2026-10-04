// jest/setup.js

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */

import "@testing-library/react-native/extend-expect";

// include this line for mocking react-native-gesture-handler
import "react-native-gesture-handler/jestSetup";

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
