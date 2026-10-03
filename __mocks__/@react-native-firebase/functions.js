// __mocks__/@react-native-firebase/functions.js

const _mockHttpsCallable = jest.fn(() => jest.fn(async () => ({ data: { plants: [] } })));

const functions = jest.fn(() => ({
  httpsCallable: _mockHttpsCallable,
}));

// Expose helpers for tests to override the callable result.
functions._mockHttpsCallable = _mockHttpsCallable;

export default functions;
