// __mocks__/@react-native-firebase/app-check.js

const provider = { configure: jest.fn() };
const instance = {
  newReactNativeFirebaseAppCheckProvider: jest.fn(() => provider),
  initializeAppCheck: jest.fn(async () => {}),
};

const appCheck = jest.fn(() => instance);

export default appCheck;
