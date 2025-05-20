// jest.config.js
module.exports = {
  preset: "jest-expo",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|@react-native-firebase|@react-navigation|react-redux|redux-devtools-expo-dev-plugin|@redux-devtools/utils|expo(nent)?|@expo(nent)?/.*|react-native|@react-native|@unimodules/.*|unimodules|sentry-expo|native-base)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^@context/(.*)$": "<rootDir>/src/context/$1",
    "^@navigation/(.*)$": "<rootDir>/src/navigation/$1",
    "^@screens/(.*)$": "<rootDir>/src/screens/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@types/(.*)$": "<rootDir>/src/types/$1",
    "^@assets/(.*)$": "<rootDir>/assets/$1",
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@common/(.*)$": "<rootDir>/src/common/$1",
    "^@constants/(.*)$": "<rootDir>/src/constants/$1",
    "^@theme/(.*)$": "<rootDir>/src/theme/$1",
    "^@helpers/(.*)$": "<rootDir>/src/helpers/$1",
    "^@test-utils/(.*)$": "<rootDir>/src/test-utils/$1",
  },
  coveragePathIgnorePatterns: ["jest/*", "src/test-utils/*", "src/context/auth/AuthTypes.tsx"],
  setupFilesAfterEnv: ["<rootDir>/jest/setup.js"],
};
