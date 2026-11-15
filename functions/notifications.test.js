jest.mock("firebase-admin", () => ({ firestore: jest.fn() }), {
  virtual: true,
});
jest.mock(
  "firebase-functions/v1",
  () => {
    const firestore = { document: () => ({ onWrite: (handler) => handler }) };
    const pubsub = { schedule: () => ({ onRun: (handler) => handler }) };
    return {
      firestore,
      pubsub,
      runWith: () => ({ firestore, pubsub }),
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    };
  },
  { virtual: true } // CI doesn't install functions/ dependencies
);

const { notifyWatering } = require("./notifications");

const NOW = Date.parse("2026-10-05T10:00:00Z");

// The two documents notifyWatering reads: the household and the species.
function fakeDb(docs) {
  return {
    doc: (path) => ({
      get: async () => ({
        exists: path in docs,
        get: (field) => (docs[path] || {})[field],
      }),
    }),
  };
}

const db = fakeDb({
  "Households/h1": { timeZone: "Europe/London" },
  "Plants/monstera": { name: "Monstera" },
});

const before = {
  plantId: "monstera",
  addedBy: "sam",
  carerIds: ["sam"],
  last_watered_date: 1,
};
const watered = {
  ...before,
  last_watered_date: NOW,
  last_watered_by: "kian",
  last_watered_by_name: "Kian",
};

describe("notifyWatering", () => {
  it("tells the plant's owner, using the species name and their notification setting", async () => {
    const send = jest.fn(async () => 1);

    const sent = await notifyWatering({
      db,
      before,
      after: watered,
      householdId: "h1",
      plantId: "p1",
      now: NOW,
      send,
    });

    expect(sent).toBe(1);
    expect(send).toHaveBeenCalledWith(
      db,
      ["sam"],
      expect.objectContaining({
        title: "Kian watered your Monstera 💧",
        data: { plantId: "p1", householdId: "h1", type: "watered" },
      }),
      "housemateActivity"
    );
  });

  it("sends nothing for an edit, a new plant or a deleted one", async () => {
    const send = jest.fn();
    const args = { db, householdId: "h1", plantId: "p1", now: NOW, send };

    await notifyWatering({
      ...args,
      before: watered,
      after: { ...watered, custom_name: "Monty" },
    });
    await notifyWatering({ ...args, before: null, after: watered });
    await notifyWatering({ ...args, before: watered, after: null });

    expect(send).not.toHaveBeenCalled();
  });
});
