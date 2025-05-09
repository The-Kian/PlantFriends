// jest/setup.js

/* eslint-disable @typescript-eslint/no-var-requires */

import "@testing-library/jest-native/extend-expect";

// include this line for mocking react-native-gesture-handler
import "react-native-gesture-handler/jestSetup";

import { setUpTests } from "react-native-reanimated";
setUpTests();

jest.mock('@components/ui/Text/ThemedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children }) => <Text>{children}</Text>,
  };
});

jest.mock('@components/ui/Views/ThemedView', () => {
  const { View } = require('react-native');
  return {
    ThemedView: ({ children, style, ...props }) => (
      <View style={style} {...props}>
        {children}
      </View>
    ),
  };
});

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "",
}));

jest.mock("react-native-uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
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