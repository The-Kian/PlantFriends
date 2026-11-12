const { sendToUsers, EXPO_PUSH_URL } = require("./push");

// A tiny stand-in for the parts of Firestore sendToUsers uses.
function fakeDb({ users, devices }) {
  const deleted = [];
  const snap = (id, data) => ({
    id,
    exists: data !== undefined,
    get: (field) =>
      field.split(".").reduce((value, key) => (value == null ? value : value[key]), data),
  });
  return {
    deleted,
    doc: (path) => ({ path }),
    getAll: async (...refs) =>
      refs.map((ref) => {
        const uid = ref.path.split("/")[1];
        return snap(uid, users[uid]);
      }),
    collection: (path) => ({
      get: async () => ({
        docs: (devices[path.split("/")[1]] || []).map((token) => ({
          ...snap(token, { expoPushToken: token }),
          ref: { delete: async () => deleted.push(token) },
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
});
