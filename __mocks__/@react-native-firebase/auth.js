// __mocks__/@react-native-firebase/auth.js

const mockAuthModule = {
  currentUser: { uid: '123', email: 'test@example.com' },
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((callback) => {
    // Simulate an async update with no user
    setTimeout(() => callback(null), 50); // Short delay to allow test to wait
    return jest.fn(); // Mock unsubscribe function
  }),
};

export default jest.fn(() => mockAuthModule);
