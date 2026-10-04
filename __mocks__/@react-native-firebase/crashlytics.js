// __mocks__/@react-native-firebase/crashlytics.js

module.exports = {
  getCrashlytics: jest.fn(() => ({})),
  log: jest.fn(),
  recordError: jest.fn(),
  setUserId: jest.fn(async () => {}),
};
