jest.mock("firebase-admin", () => ({ firestore: jest.fn() }), { virtual: true });
jest.mock(
  "firebase-functions",
  () => {
    const schedule = () => ({ onRun: (handler) => handler });
    return {
      firestore: { document: () => ({ onWrite: (handler) => handler }) },
      pubsub: { schedule },
      logger: { info: jest.fn(), error: jest.fn() },
    };
  },
  { virtual: true }, // CI doesn't install functions/ dependencies
);

const { runReminders } = require("./reminders");
const { DAY_MS } = require("./plantMessages");

const NOW = Date.parse("2026-10-05T10:00:00Z"); // 11:00 in London
const TZ = "Europe/London";

// A fake db with the few reads runReminders makes. `plants` are
// { path, data } for the collection-group query's results.
function fakeDb(plants, { failUpdate } = {}) {
  const updates = [];
  const queries = [];
  return {
    updates,
    queries,
    doc: (path) => ({
      get: async () => ({
        exists: path !== "Plants/none",
        get: (field) =>
          ({
            "Households/h1": { timeZone: TZ },
            "Plants/monstera": { name: "Monstera" },
          })[path]?.[field],
      }),
    }),
    collectionGroup: (name) => ({
      where: (field, op, value) => {
        queries.push({ name, field, op, value });
        return {
          get: async () => ({
            docs: plants
              .filter((p) => p.data.notify_at <= value)
              .map((p) => ({
                data: () => p.data,
                updateTime: `t:${p.path}`,
                ref: {
                  path: p.path,
                  update: async (changes, precondition) => {
                    if (failUpdate) throw Object.assign(new Error("changed"), { code: 9 });
                    updates.push({ path: p.path, changes, precondition });
                  },
                },
              })),
          }),
        };
      },
    }),
  };
}

const due = {
  plantId: "monstera",
  addedBy: "kian",
  carerIds: ["kian"],
  shared: false,
  next_watering_date: NOW - 60 * 60 * 1000,
  notify_at: NOW - 60 * 60 * 1000,
  notify_stage: "due",
};

const run = (db, send = jest.fn(async () => 1)) =>
  runReminders({ db, now: NOW, send }).then((summary) => ({ summary, send }));

describe("runReminders", () => {
  it("asks only for plants whose time has come", async () => {
    const db = fakeDb([
      { path: "Households/h1/Plants/p1", data: due },
      { path: "Households/h1/Plants/later", data: { ...due, notify_at: NOW + DAY_MS } },
    ]);
    const { summary, send } = await run(db);

    expect(db.queries).toEqual([{ name: "Plants", field: "notify_at", op: "<=", value: NOW }]);
    expect(summary).toMatchObject({ due: 1, sent: 1 });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("sends the due reminder to every carer, then plans the nudge a day later", async () => {
    const shared = { ...due, shared: true, carerIds: ["kian", "sam"] };
    const db = fakeDb([{ path: "Households/h1/Plants/p1", data: shared }]);
    const { send } = await run(db);

    const [, uids, message, pref] = send.mock.calls[0];
    expect(uids).toEqual(["kian", "sam"]);
    expect(pref).toBe("reminders");
    expect(message).toEqual({
      title: "The Monstera needs watering 💧",
      body: "Whoever gets there first, tap Watered.",
      data: { plantId: "p1", householdId: "h1", type: "due" },
    });
    // 24 hours after the due time (that's 10:00 in London, so no quiet hours).
    expect(db.updates).toEqual([
      {
        path: "Households/h1/Plants/p1",
        changes: { notify_stage: "nudge", notify_at: shared.next_watering_date + DAY_MS },
        precondition: { lastUpdateTime: "t:Households/h1/Plants/p1" },
      },
    ]);
  });

  it("says 'Time to water' for a personal plant", async () => {
    const db = fakeDb([{ path: "Households/h1/Plants/p1", data: due }]);
    const { send } = await run(db);
    expect(send.mock.calls[0][2].title).toBe("Time to water the Monstera 💧");
  });

  it("sends one nudge, then stops", async () => {
    const nudge = { ...due, notify_stage: "nudge" };
    const db = fakeDb([{ path: "Households/h1/Plants/p1", data: nudge }]);
    const { send } = await run(db);

    expect(send.mock.calls[0][2].title).toBe("The Monstera is still thirsty 💧");
    expect(db.updates[0].changes).toEqual({ notify_stage: null, notify_at: null });
  });

  it("moves a nudge out of quiet hours", async () => {
    // Due at 21:30 UTC yesterday: a day later is 22:30 in London, which is quiet.
    const evening = { ...due, next_watering_date: Date.parse("2026-10-04T21:30:00Z"), notify_at: NOW - 1 };
    const db = fakeDb([{ path: "Households/h1/Plants/p1", data: evening }]);
    await run(db);
    // So it waits for 08:00 BST on the 6th, which is 07:00 UTC.
    expect(db.updates[0].changes.notify_at).toBe(Date.parse("2026-10-06T07:00:00Z"));
  });

  it("sends nothing and clears the plan when reminders were switched off", async () => {
    const db = fakeDb([{ path: "Households/h1/Plants/p1", data: { ...due, reminders_enabled: false } }]);
    const { summary, send } = await run(db);

    expect(send).not.toHaveBeenCalled();
    expect(summary.cleared).toBe(1);
    expect(db.updates[0].changes).toEqual({ notify_stage: null, notify_at: null });
  });

  it("leaves the plan alone if someone changed the plant meanwhile", async () => {
    const db = fakeDb([{ path: "Households/h1/Plants/p1", data: due }], { failUpdate: true });
    const { summary } = await run(db);
    expect(summary).toMatchObject({ skipped: 1, failed: 0 });
  });

  it("ignores documents that aren't household plants", async () => {
    const db = fakeDb([{ path: "Plants/catalog", data: due }]);
    const { summary, send } = await run(db);
    expect(summary.due).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it("carries on when one plant fails to send", async () => {
    const db = fakeDb([
      { path: "Households/h1/Plants/bad", data: due },
      { path: "Households/h1/Plants/good", data: due },
    ]);
    const send = jest.fn().mockRejectedValueOnce(new Error("Expo down")).mockResolvedValue(1);
    const { summary } = await run(db, send);
    expect(summary).toMatchObject({ failed: 1, sent: 1 });
  });
});
