// __mocks__/@react-native-firebase/functions.js
// Mirrors the modular API (getFunctions, httpsCallable).

// Tests override this to control the callable a name resolves to. It's
// called with just the function name.
export const _mockHttpsCallable = jest.fn(() =>
  jest.fn(async () => ({ data: { plants: [] } })),
);

export const getFunctions = jest.fn(() => ({}));
export const httpsCallable = jest.fn((_functions, name) =>
  _mockHttpsCallable(name),
);
