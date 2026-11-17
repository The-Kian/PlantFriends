// __mocks__/@react-native-firebase/auth.js
// Mirrors the modular API (getAuth, signInWithEmailAndPassword, ...).

import mockUser from "@/test-utils/MockFirebaseUser";

// The Auth instance returned by getAuth(). Only members the modular API
// doesn't cover (currentUser, revokeToken) live here.
export const mockAuthInstance = {
  currentUser: { ...mockUser },
  revokeToken: jest.fn(() => Promise.resolve()),
};

export const getAuth = jest.fn(() => mockAuthInstance);

export const signInWithEmailAndPassword = jest.fn(() => Promise.resolve());
export const createUserWithEmailAndPassword = jest.fn(() =>
  Promise.resolve({ user: { ...mockUser } }),
);
export const signInWithCredential = jest.fn(() =>
  Promise.resolve({
    user: { ...mockUser },
    additionalUserInfo: { isNewUser: true },
  }),
);
export const signOut = jest.fn(() => Promise.resolve());
export const sendPasswordResetEmail = jest.fn(() => Promise.resolve());
export const updateProfile = jest.fn(() => Promise.resolve());
export const signInAnonymously = jest.fn(() =>
  Promise.resolve({ user: { ...mockUser } }),
);
export const onAuthStateChanged = jest.fn((_auth, callback) => {
  // Delay the callback to simulate asynchronous behaviour, so the initial
  // state (before the callback is invoked) is preserved.
  setTimeout(() => {
    callback(mockUser);
  }, 100);

  // Return an unsubscribe function.
  return jest.fn();
});

export const GoogleAuthProvider = {
  credential: jest.fn((idToken) => ({
    providerId: "google.com",
    token: idToken,
  })),
};
export const AppleAuthProvider = {
  credential: jest.fn((idToken, nonce) => ({
    providerId: "apple.com",
    token: idToken,
    secret: nonce,
  })),
};
