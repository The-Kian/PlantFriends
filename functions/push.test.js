jest.mock(
  "firebase-functions/v1",
  () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }),
  { virtual: true }, // CI doesn't install functions/ dependencies
);

const { logger } = require("firebase-functions/v1");
const {
  sendToUsers,
  checkPushReceipts,
  EXPO_PUSH_URL,
  EXPO_RECEIPTS_URL,
} = require("./push");

// A tiny stand-in for the parts of Firestore sendToUsers uses.
function fakeDb({ users, devices, tickets = {} }) {
  const deleted = [];
  const saved = { ...tickets };
  const snap = (id, data) => ({
    id,
    exists: data !== undefined,
    get: (field) =>
      field.split(".").reduce((value, key) => (value == null ? value : value[key]), data),
  });
  return {
    deleted,
    saved,
    doc: (path) => ({
      path,
      set: async (data) => {
        saved[path.split("/")[1]] = data;
      },
      delete: async () => deleted.push(path),
    }),
    getAll: async (...refs) =>
      refs.map((ref) => {
        const uid = ref.path.split("/")[1];
        return snap(uid, users[uid]);
      }),
    collection: (path) => ({
      // PushTickets: the only query checkPushReceipts makes.
      where: (field, op, value) => ({
        limit: () => ({
          get: async () => ({
            docs: Object.entries(saved)
              .filter(([, data]) => data[field] <= value)
              .map(([id, data]) => ({
                ...snap(id, data),
                ref: { delete: async () => delete saved[id] },
              })),
          }),
        }),
      }),
      get: async () => ({
        docs: (devices[path.split("/")[1]] || []).map((token) => ({
          ...snap(token, { expoPushToken: token }),
          ref: {
            path: `${path}/${token}`,
            delete: async () => deleted.push(token),
          },
        })),
      }),
    }),
  };
}

function fakeFetch(tickets) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return { ok: true, json: async () => ({ data: tickets }) };
  };
  return { calls, fetchImpl };
}

const message = { title: "Kian watered your Monstera 💧", body: "No need to water it." };

beforeEach(() => jest.clearAllMocks());

describe("sendToUsers", () => {
  it("sends to each device of each recipient", async () => {
    const db = fakeDb({
      users: { sam: {}, alex: {} },
      devices: { sam: ["ExponentPushToken[sam-phone]"], alex: ["ExponentPushToken[alex-phone]"] },
    });
    const { calls, fetchImpl } = fakeFetch([{ status: "ok" }, { status: "ok" }]);

    const sent = await sendToUsers(db, ["sam", "alex"], message, "housemateActivity", fetchImpl);

    expect(sent).toBe(2);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(EXPO_PUSH_URL);
    expect(calls[0].body.map((m) => m.to)).toEqual([
      "ExponentPushToken[sam-phone]",
      "ExponentPushToken[alex-phone]",
    ]);
    expect(calls[0].body[0]).toMatchObject(message);
  });

  it("skips people who switched that kind of notification off", async () => {
    const db = fakeDb({
      users: { sam: { notificationPrefs: { housemateActivity: false } } },
      devices: { sam: ["ExponentPushToken[sam-phone]"] },
    });
    const { calls, fetchImpl } = fakeFetch([]);

    expect(await sendToUsers(db, ["sam"], message, "housemateActivity", fetchImpl)).toBe(0);
    expect(calls).toHaveLength(0);
  });

  it("removes devices Expo says are no longer registered", async () => {
    const db = fakeDb({
      users: { sam: {} },
      devices: { sam: ["ExponentPushToken[old]", "ExponentPushToken[new]"] },
    });
    const { fetchImpl } = fakeFetch([
      { status: "error", details: { error: "DeviceNotRegistered" } },
      { status: "ok" },
    ]);

    await sendToUsers(db, ["sam"], message, "reminders", fetchImpl);

    expect(db.deleted).toEqual(["ExponentPushToken[old]"]);
  });

  it("does nothing for nobody", async () => {
    const { calls, fetchImpl } = fakeFetch([]);
    expect(await sendToUsers(fakeDb({ users: {}, devices: {} }), [], message, "reminders", fetchImpl)).toBe(0);
    expect(calls).toHaveLength(0);
  });

  it("remembers accepted pushes so their receipts can be checked", async () => {
    const db = fakeDb({ users: { sam: {} }, devices: { sam: ["ExponentPushToken[sam]"] } });
    const { fetchImpl } = fakeFetch([{ status: "ok", id: "ticket-1" }]);

    await sendToUsers(db, ["sam"], message, "reminders", fetchImpl, 1000);

    expect(db.saved).toEqual({
      "ticket-1": { device: "Users/sam/Devices/ExponentPushToken[sam]", createdAt: 1000 },
    });
  });

  it("logs what Expo refused, by error code and without tokens", async () => {
    const db = fakeDb({
      users: { sam: {} },
      devices: { sam: ["ExponentPushToken[a]", "ExponentPushToken[b]"] },
    });
    const { fetchImpl } = fakeFetch([
      { status: "error", details: { error: "MessageRateExceeded" } },
      { status: "ok", id: "ticket-2" },
    ]);

    await sendToUsers(db, ["sam"], message, "reminders", fetchImpl);

    expect(logger.warn).toHaveBeenCalledWith("Expo refused pushes", {
      fn: "push",
      pref: "reminders",
      devices: 2,
      errors: { MessageRateExceeded: 1 },
    });
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("ExponentPushToken");
  });

  it("logs a failed request before throwing", async () => {
    const db = fakeDb({ users: { sam: {} }, devices: { sam: ["ExponentPushToken[a]"] } });
    const fetchImpl = async () => ({ ok: false, status: 503 });

    await expect(sendToUsers(db, ["sam"], message, "reminders", fetchImpl)).rejects.toThrow("503");
    expect(logger.error).toHaveBeenCalledWith(
      "Expo push request failed",
      expect.objectContaining({ fn: "push", status: 503, devices: 1 }),
    );
  });
});

describe("checkPushReceipts", () => {
  const MINUTE = 60 * 1000;
  const now = 100 * 60 * MINUTE;
  const device = "Users/sam/Devices/ExponentPushToken[sam]";

  function fakeReceipts(receipts) {
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      return { ok: true, json: async () => ({ data: receipts }) };
    };
    return { calls, fetchImpl };
  }

  it("asks only about pushes sent at least 15 minutes ago", async () => {
    const db = fakeDb({
      users: {},
      devices: {},
      tickets: {
        old: { device, createdAt: now - 20 * MINUTE },
        fresh: { device, createdAt: now - 5 * MINUTE },
      },
    });
    const { calls, fetchImpl } = fakeReceipts({ old: { status: "ok" } });

    const summary = await checkPushReceipts(db, now, fetchImpl);

    expect(calls).toEqual([{ url: EXPO_RECEIPTS_URL, body: { ids: ["old"] } }]);
    expect(summary).toEqual({ checked: 1, ok: 1, failed: 0, missing: 0 });
    expect(Object.keys(db.saved)).toEqual(["fresh"]);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("logs a delivery failure as an error", async () => {
    const db = fakeDb({
      users: {},
      devices: {},
      tickets: { t1: { device, createdAt: now - 20 * MINUTE } },
    });
    const { fetchImpl } = fakeReceipts({
      t1: { status: "error", details: { error: "InvalidCredentials" } },
    });

    const summary = await checkPushReceipts(db, now, fetchImpl);

    expect(summary).toMatchObject({ failed: 1, errors: { InvalidCredentials: 1 } });
    expect(logger.error).toHaveBeenCalledWith(
      "Push receipts had failures",
      expect.objectContaining({ fn: "push", failed: 1 }),
    );
    expect(db.deleted).toEqual([]);
    expect(db.saved).toEqual({});
  });

  it("removes a device that is no longer registered, without raising an error", async () => {
    const db = fakeDb({
      users: {},
      devices: {},
      tickets: { t1: { device, createdAt: now - 20 * MINUTE } },
    });
    const { fetchImpl } = fakeReceipts({
      t1: { status: "error", details: { error: "DeviceNotRegistered" } },
    });

    await checkPushReceipts(db, now, fetchImpl);

    expect(db.deleted).toEqual([device]);
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
  });

  it("waits for a receipt that isn't ready, and gives up after a day", async () => {
    const tickets = {
      waiting: { device, createdAt: now - 30 * MINUTE },
      lost: { device, createdAt: now - 25 * 60 * MINUTE },
    };
    const db = fakeDb({ users: {}, devices: {}, tickets });
    const { fetchImpl } = fakeReceipts({});

    const summary = await checkPushReceipts(db, now, fetchImpl);

    expect(summary).toMatchObject({ checked: 2, missing: 1 });
    expect(Object.keys(db.saved)).toEqual(["waiting"]);
  });

  it("makes no request when there is nothing to check", async () => {
    const db = fakeDb({ users: {}, devices: {} });
    const { calls, fetchImpl } = fakeReceipts({});
    expect(await checkPushReceipts(db, now, fetchImpl)).toMatchObject({ checked: 0 });
    expect(calls).toHaveLength(0);
  });
});
