// __mocks__/@react-native-firebase/auth.js

import mockUser from "@/test-utils/MockFirebaseUser";

const mockAuthModule = {
  currentUser: { ...mockUser, updateProfile: jest.fn(() => Promise.resolve()) },
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  createUserWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({
      user: mockUser,
    }),
  ),
  signInWithCredential: jest.fn(() =>
    Promise.resolve({
      user: { ...mockUser, updateProfile: jest.fn(() => Promise.resolve()) },
      additionalUserInfo: { isNewUser: true },
    }),
  ),
  revokeToken: jest.fn(() => Promise.resolve()),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((callback) => {
    // Delay callback to simulate asynchronous behavior.
    // This ensures the initial state (before the callback is invoked) is preserved.
    setTimeout(() => {
      // You can adjust this to pass a mock user if needed.
      callback(mockUser);
    }, 100); // Adjust the delay as needed

    // Return an unsubscribe function.
    return jest.fn();
  }),
};

const auth = jest.fn(() => mockAuthModule);
auth.GoogleAuthProvider = {
  credential: jest.fn((idToken) => ({ providerId: "google.com", token: idToken })),
};
auth.AppleAuthProvider = {
  credential: jest.fn((idToken, nonce) => ({
    providerId: "apple.com",
    token: idToken,
    secret: nonce,
  })),
};

export default auth;
