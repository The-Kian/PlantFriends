// __mocks__/expo-apple-authentication.js

const React = require("react");
const { Pressable } = require("react-native");

module.exports = {
  isAvailableAsync: jest.fn(async () => true),
  signInAsync: jest.fn(async () => ({
    identityToken: "apple-identity-token",
    authorizationCode: "apple-auth-code",
    fullName: { givenName: "Test", familyName: "User" },
  })),
  AppleAuthenticationButton: ({ onPress, testID }) =>
    React.createElement(Pressable, { onPress, testID }),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  AppleAuthenticationButtonType: { SIGN_IN: 0, CONTINUE: 1 },
  AppleAuthenticationButtonStyle: { WHITE: 0, WHITE_OUTLINE: 1, BLACK: 2 },
};
