// __mocks__/@react-native-firebase/firestore.js

const mockGet = jest.fn().mockResolvedValue({
  exists: true,
  data: () => ({
    /* default data */
  }),
  empty: false,
  docs: [
    {
      data: () => ({
        /* default data */
      }),
    },
  ],
});

const mockSet = jest.fn().mockResolvedValue(undefined);
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockDelete = jest.fn().mockResolvedValue(undefined);
const mockWhere = jest.fn().mockReturnThis();

const mockDoc = jest.fn(() => ({
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
  collection: mockCollection,
}));

const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  where: mockWhere,
  get: mockGet,
}));

const mockFirestore = {
  collection: mockCollection,
};

// Export both the firestore function and individual mocks to enable customization
const firestoreMock = jest.fn(() => mockFirestore);
firestoreMock._mockCollection = mockCollection;
firestoreMock._mockDoc = mockDoc;
firestoreMock._mockGet = mockGet;
firestoreMock._mockSet = mockSet;
firestoreMock._mockUpdate = mockUpdate;
firestoreMock._mockWhere = mockWhere;

export default firestoreMock;
