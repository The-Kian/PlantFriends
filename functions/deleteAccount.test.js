// deleteAccount against a small in-memory stand-in for the Admin SDK.
// Documents are stored by path, e.g. "Households/h1/Plants/p1".

const store = new Map();
const deletedUsers = [];

const ARRAY_REMOVE = Symbol("arrayRemove");
const DELETE = Symbol("delete");

function docRef(path) {
  return {
    path,
    id: path.split("/").pop(),
    get: async () => snapshot(path),
    collection: (name) => collectionRef(`${path}/${name}`),
  };
}

function snapshot(path) {
  const data = store.get(path);
  return { ref: docRef(path), exists: data !== undefined, data: () => data };
}

function childDocs(path) {
  return [...store.keys()]
    .filter(
      (key) =>
        key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes("/")
    )
    .map(snapshot);
}

let autoId = 0;

function collectionRef(path) {
  return {
    doc: (id) => docRef(`${path}/${id ?? `auto${autoId++}`}`),
    get: async () => ({ docs: childDocs(path) }),
    where: (field, op, value) => ({
      get: async () => ({
        docs: childDocs(path).filter((s) =>
          (s.data()[field] || []).includes(value)
        ),
      }),
    }),
  };
}

function applyUpdate(path, changes) {
  const data = structuredClone(store.get(path));
  Object.entries(changes).forEach(([key, value]) => {
    const [field, sub] = key.split(".");
    if (value === DELETE) {
      delete data[field][sub];
    } else if (value && value[ARRAY_REMOVE] !== undefined) {
      data[field] = data[field].filter((x) => x !== value[ARRAY_REMOVE]);
    } else {
      data[field] = value;
    }
  });
  store.set(path, data);
}

function bulkWriter() {
  const ops = [];
  return {
    create: (ref, data) => ops.push(() => store.set(ref.path, data)),
    delete: (ref) => ops.push(() => store.delete(ref.path)),
    update: (ref, data) => ops.push(() => applyUpdate(ref.path, data)),
    close: async () => ops.forEach((op) => op()),
  };
}

const db = {
  collection: collectionRef,
  bulkWriter,
  recursiveDelete: async (ref) => {
    [...store.keys()]
      .filter((key) => key === ref.path || key.startsWith(`${ref.path}/`))
      .forEach((key) => store.delete(key));
  },
};

const firestore = () => db;
firestore.FieldValue = {
  serverTimestamp: () => "now",
  arrayRemove: (value) => ({ [ARRAY_REMOVE]: value }),
  delete: () => DELETE,
};

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  firestore,
  auth: () => ({ deleteUser: async (uid) => deletedUsers.push(uid) }),
}));

jest.mock("firebase-functions", () => {
  class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }
  const https = { onCall: (handler) => handler, HttpsError };
  return {
    https,
    runWith: () => ({ https }),
    logger: { error: jest.fn() },
  };
});

const { deleteAccount } = require("./index");

const anonymousPlants = () =>
  [...store.keys()].filter((key) => key.startsWith("AnonymousPlants/"));

beforeEach(() => {
  store.clear();
  deletedUsers.length = 0;
});

describe("deleteAccount", () => {
  it("deletes a solo household and anonymises its plants once", async () => {
    store.set("Users/u1", { householdId: "u1", plantsMigratedAt: 1 });
    store.set("Users/u1/UserPlants/p1", { plantId: "fern" });
    store.set("Households/u1", { memberIds: ["u1"], members: { u1: {} } });
    store.set("Households/u1/Plants/p1", { plantId: "fern", addedBy: "u1" });

    await deleteAccount({}, { auth: { uid: "u1" } });

    expect(anonymousPlants()).toHaveLength(1);
    expect([...store.keys()].filter((k) => !k.startsWith("Anonymous"))).toEqual(
      []
    );
    expect(deletedUsers).toEqual(["u1"]);
  });

  it("anonymises old plants for a user who never migrated", async () => {
    store.set("Users/u1", {});
    store.set("Users/u1/UserPlants/p1", { plantId: "fern" });
    store.set("Users/u1/UserPlants/p2", { plantId: "cactus" });

    await deleteAccount({}, { auth: { uid: "u1" } });

    expect(anonymousPlants()).toHaveLength(2);
    expect(store.has("Users/u1")).toBe(false);
  });

  it("leaves a shared household and housemates' plants in place", async () => {
    store.set("Users/u2", { householdId: "u1", plantsMigratedAt: 1 });
    store.set("Households/u1", {
      memberIds: ["u1", "u2"],
      members: { u1: { displayName: "Kian" }, u2: { displayName: "Sam" } },
    });
    store.set("Households/u1/Plants/mine", {
      plantId: "fern",
      addedBy: "u2",
      carerIds: ["u2"],
    });
    store.set("Households/u1/Plants/shared", {
      plantId: "cactus",
      addedBy: "u1",
      carerIds: ["u1", "u2"],
    });

    await deleteAccount({}, { auth: { uid: "u2" } });

    expect(anonymousPlants()).toHaveLength(1);
    expect(store.has("Households/u1/Plants/mine")).toBe(false);
    expect(store.get("Households/u1/Plants/shared").carerIds).toEqual(["u1"]);
    expect(store.get("Households/u1")).toEqual({
      memberIds: ["u1"],
      members: { u1: { displayName: "Kian" } },
    });
    expect(store.has("Users/u2")).toBe(false);
  });
});
