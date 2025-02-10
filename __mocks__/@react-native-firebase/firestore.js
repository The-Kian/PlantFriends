// __mocks__/@react-native-firebase/firestore.js

const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue({
    empty: false,
    docs: [{ data: () => ({ /* default data */ }) }],
  }),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
  where: jest.fn().mockReturnThis(),
};

export default () => mockFirestore;
