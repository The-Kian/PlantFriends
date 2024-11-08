// __mocks__/@react-native-firebase/auth.js

export default () => ({
    currentUser: { uid: '123', email: 'test@example.com' },
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
    onAuthStateChanged: jest.fn(callback => {
      callback({ uid: '123', email: 'test@example.com' });
      return () => {};
    }),
  });
  