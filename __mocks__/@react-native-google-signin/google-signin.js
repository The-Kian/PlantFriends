// __mocks__/@react-native-google-signin/google-signin.js

const React = require("react");
const { Pressable } = require("react-native");

const GoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn(async () => true),
  signIn: jest.fn(async () => ({
    type: "success",
    data: { idToken: "google-id-token", user: { email: "test@example.com" } },
  })),
  signOut: jest.fn(async () => null),
};

const GoogleSigninButton = ({ onPress, testID }) =>
  React.createElement(Pressable, { onPress, testID });
GoogleSigninButton.Size = { Icon: 2, Standard: 0, Wide: 1 };
GoogleSigninButton.Color = { Dark: 0, Light: 1 };

module.exports = {
  GoogleSignin,
  GoogleSigninButton,
  isSuccessResponse: (response) => response.type === "success",
  statusCodes: {
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
    IN_PROGRESS: "IN_PROGRESS",
    PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  },
};
