// A small in-memory stand-in for the Admin SDK's Firestore, for the tests of
// invites and joining. Documents are stored by path, e.g. "Households/h1/Plants/p1".
// Transaction writes are held back and applied only if the callback finishes.

// Copies plain data. Timestamps (which hold functions) are kept as they are.
function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === "object" && typeof value.toMillis !== "function") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)]));
  }
  return value;
}

function createFakeFirestore() {
  const store = new Map();
  const created = []; // paths of documents made with create(), for assertions
  let autoId = 0;

  const alreadyExists = (path) =>
    Object.assign(new Error(`${path} already exists`), { code: 6 });

  function snapshot(path) {
    const data = store.get(path);
    return {
      id: path.split("/").pop(),
      ref: docRef(path),
      exists: data !== undefined,
      data: () => (data === undefined ? undefined : clone(data)),
      get: (field) => (data === undefined ? undefined : data[field]),
    };
  }

  function childDocs(path) {
    return [...store.keys()]
      .filter((key) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes("/"))
      .map(snapshot);
  }

  function docRef(path) {
    return {
      path,
      id: path.split("/").pop(),
      get: async () => snapshot(path),
      create: async (data) => applyCreate(path, data),
      collection: (name) => collectionRef(`${path}/${name}`),
    };
  }

  function collectionRef(path) {
    return {
      path,
      doc: (id) => docRef(`${path}/${id === undefined ? `auto${autoId++}` : id}`),
      get: async () => ({ docs: childDocs(path) }),
    };
  }

  function applyCreate(path, data) {
    if (store.has(path)) throw alreadyExists(path);
    store.set(path, clone(data));
    created.push(path);
  }

  function applySet(path, data, options) {
    const base = options && options.merge ? store.get(path) || {} : {};
    store.set(path, clone({ ...base, ...data }));
  }

  function applyUpdate(path, changes) {
    if (!store.has(path)) throw new Error(`${path} doesn't exist`);
    store.set(path, clone({ ...store.get(path), ...changes }));
  }

  const db = {
    doc: docRef,
    collection: collectionRef,
    runTransaction: async (callback) => {
      const ops = [];
      const transaction = {
        get: async (ref) => (ref.get ? ref.get() : undefined),
        create: (ref, data) => ops.push(() => applyCreate(ref.path, data)),
        set: (ref, data, options) => ops.push(() => applySet(ref.path, data, options)),
        update: (ref, changes) => ops.push(() => applyUpdate(ref.path, changes)),
        delete: (ref) => ops.push(() => store.delete(ref.path)),
      };
      const result = await callback(transaction);
      ops.forEach((op) => op());
      return result;
    },
  };

  return { db, store, created };
}

module.exports = { createFakeFirestore };
