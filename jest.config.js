module.exports = {
  preset: "jest-expo",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    // Added: '|immer' and '|@react-native-firebase'
    // Modified for pnpm: use node_modules/.pnpm pattern
    "node_modules/(?!.pnpm|((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@reduxjs/toolkit|react-redux|immer|@react-native-firebase)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@assets/(.*)$": "<rootDir>/assets/$1",
    "^@mocks/(.*)$": "<rootDir>/__mocks__/$1",
    "^@env$": "<rootDir>/__mocks__/@env.js",
    "^react-native-reanimated$": "<rootDir>/__mocks__/react-native-reanimated.js",
    "^react-native-worklets$": "<rootDir>/__mocks__/react-native-worklets.js",
    "^@expo/vector-icons$": "<rootDir>/__mocks__/@expo-vector-icons.js",
  },
  setupFilesAfterEnv: ["<rootDir>/jest/setup.js"],
};
