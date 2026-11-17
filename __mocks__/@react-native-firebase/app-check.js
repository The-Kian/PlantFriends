// __mocks__/@react-native-firebase/app-check.js

export const mockProviderConfigure = jest.fn();

export class ReactNativeFirebaseAppCheckProvider {
  configure(options) {
    mockProviderConfigure(options);
  }
}

export const initializeAppCheck = jest.fn(async () => ({}));
