import mockUser from "./MockFirebaseUser";

const mockAuthContextValue = {
  initializing: false,
  user: mockUser,
  setUser: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  resetPassword: jest.fn(),
  update: jest.fn(),
  deleteAccount: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithApple: jest.fn(),
};
export default mockAuthContextValue;
