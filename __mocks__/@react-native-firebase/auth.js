// __mocks__/@react-native-firebase/auth.js

import mockUser from "@test-utils/MockFirebaseUser";

const mockAuthModule = {
  currentUser: { ...mockUser,
    updateProfile: jest.fn(() => Promise.resolve()),
   },
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: mockUser,
  })),
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

export default jest.fn(() => mockAuthModule);
