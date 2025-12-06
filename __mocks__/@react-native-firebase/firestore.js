// __mocks__/@react-native-firebase/firestore.js

// This mock provides both:
// - modular named exports (getFirestore, collection, doc, query, where, getDocs, getDoc, setDoc, deleteDoc)
// - a legacy default export (function) with attached _mock* helpers so older tests that
//   reference `(firestore as any)._mockGet` continue to work.

// Internal mock implementations (exposed for both named and legacy usage)
const _mockGet = jest.fn().mockResolvedValue({
  exists: false,
  data: () => ({}),
  empty: false,
  docs: [
    {
      id: 'mock-1',
      data: () => ({ name: 'Aloe Vera', slug: 'aloe vera'.toLowerCase(), plantId: 'p1' }),
    },
  ],
});

const _mockSet = jest.fn().mockResolvedValue(undefined);
const _mockUpdate = jest.fn().mockResolvedValue(undefined);
const _mockDelete = jest.fn().mockResolvedValue(undefined);

const getFirestore = jest.fn(() => ({}));

// Build helpers for legacy-style collection/doc chaining used in older tests
const _collectionDocRegistry = new Map();

const mockDocFactory = (basePath) => {
  const localDoc = jest.fn((id) => {
    // Also call the module-level `doc` mock so tests that assert on
    // `(firestore as any)._mockDoc` observe the call.
    try {
      doc({ _path: basePath }, id);
    } catch (e) {
      // ignore
    }

    return {
      _path: `${basePath}/${id}`,
      id,
      get: _mockGet,
      set: _mockSet,
      update: _mockUpdate,
      delete: _mockDelete,
      collection: (name) => collection({ _path: `${basePath}/${id}` }, name),
    };
  });

  // Register this local doc spy so modular `doc(collectionRef, id)` can
  // invoke it and keep per-collection call counts in sync.
  _collectionDocRegistry.set(basePath, localDoc);

  return localDoc;
};

const collection = jest.fn((parentOrDb, name) => {
  // If tests provide a legacy firestore instance via mockReturnValue
  // (e.g. { collection: mockCollection }), delegate to that collection
  if (parentOrDb && typeof parentOrDb.collection === "function") {
    return parentOrDb.collection(name);
  }

  const parentPath = parentOrDb && parentOrDb._path ? parentOrDb._path : null;
  const base = parentPath ? `${parentPath}/${name}` : name;

  const mockDoc = mockDocFactory(base);
  const mockWhere = jest.fn(() => ({ where: mockWhere, get: _mockGet }));

  return {
    _path: base,
    _name: name,
    doc: mockDoc,
    where: mockWhere,
    get: _mockGet,
  };
});

const doc = jest.fn((collectionRefOrDb, id) => {
  // If this is a legacy collectionRef that already provides a `.doc` spy,
  // delegate so tests that assert on that spy still observe the call.
  if (collectionRefOrDb && typeof collectionRefOrDb.doc === 'function') {
    // Call the per-collection doc spy (if registered) so its call history is populated
    try {
      const reg = collectionRefOrDb._path && _collectionDocRegistry.get(collectionRefOrDb._path);
      if (reg) reg(id);
    } catch (e) {}

    return collectionRefOrDb.doc(id);
  }

  // If a collection doc spy was registered for this base path, call it so
  // tests that expect `collection(...).doc` to have been called still pass.
  if (collectionRefOrDb && collectionRefOrDb._path) {
    try {
      const reg = _collectionDocRegistry.get(collectionRefOrDb._path);
      if (reg) reg(id);
    } catch (e) {}
  }

  const base = collectionRefOrDb && collectionRefOrDb._path ? collectionRefOrDb._path : 'root';
  return { _path: `${base}/${id}`, id, get: _mockGet, set: _mockSet, update: _mockUpdate, delete: _mockDelete };
});

const where = jest.fn((field, op, val) => ({ type: 'where', field, op, val }));

const query = jest.fn((collectionRef, ...constraints) => {
  // If this is a legacy collectionRef (from tests) that supports .where/.get,
  // call its where() for each constraint and return the collectionRef so
  // getDocs can call .get() on it.
  if (collectionRef && typeof collectionRef.where === 'function') {
    for (const c of constraints) {
      if (c && c.field) {
        collectionRef.where(c.field, c.op, c.val);
      }
    }
    return collectionRef;
  }

  return { _collection: collectionRef, _constraints: constraints };
});

const getDocs = jest.fn(async (queryOrCollection) => {
  // If the passed object is a legacy collectionRef, call its .get()
  if (queryOrCollection && typeof queryOrCollection.get === 'function') {
    return queryOrCollection.get();
  }

  // If queryOrCollection is a query object returned by our query(), and
  // it contains an underlying collection with .get(), call that.
  if (
    queryOrCollection &&
    queryOrCollection._collection &&
    typeof queryOrCollection._collection.get === 'function'
  ) {
    return queryOrCollection._collection.get();
  }

  const resolved = await _mockGet();
  return { empty: resolved.empty, docs: resolved.docs };
});

const getDoc = jest.fn(async (docRef) => {
  if (docRef && typeof docRef.get === "function") {
    return docRef.get();
  }
  const resolved = await _mockGet();
  return { exists: resolved.exists ?? false, id: docRef && docRef.id ? docRef.id : 'mock-doc', data: () => ({}) };
});

const setDoc = jest.fn(async (docRef, data) => {
  // If docRef is a legacy doc object with .set, call it so legacy spies are used.
  if (docRef && typeof docRef.set === 'function') {
    return docRef.set(data);
  }
  return _mockSet(docRef, data);
});

const deleteDoc = jest.fn(async (docRef) => {
  if (docRef && typeof docRef.delete === 'function') {
    return docRef.delete();
  }
  return _mockDelete(docRef);
});

// Legacy default mock function (to support tests that import default and access _mock* props)
const firestoreMock = jest.fn(() => ({ collection }));
firestoreMock._mockCollection = collection;
firestoreMock._mockDoc = doc;
firestoreMock._mockGet = _mockGet;
firestoreMock._mockSet = _mockSet;
firestoreMock._mockUpdate = _mockUpdate;
firestoreMock._mockDelete = _mockDelete;

// Expose both CommonJS exports and default for compatibility
// Attach modular named helpers to the legacy default mock so both import styles work
firestoreMock.getFirestore = getFirestore;
firestoreMock.collection = collection;
firestoreMock.doc = doc;
firestoreMock.where = where;
firestoreMock.query = query;
firestoreMock.getDocs = getDocs;
firestoreMock.getDoc = getDoc;
firestoreMock.setDoc = setDoc;
firestoreMock.deleteDoc = deleteDoc;

module.exports = firestoreMock;
module.exports.default = firestoreMock;

// Make the named `getFirestore()` return the legacy default mock's value so tests
// that call `(firestore as jest.Mock).mockReturnValue({ collection: mockCollection })`
// will be honored by code that calls `getFirestore()`.
if (typeof getFirestore.mockImplementation === 'function') {
  getFirestore.mockImplementation(() => firestoreMock());
}
