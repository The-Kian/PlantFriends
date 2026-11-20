jest.mock("./admin", () => ({ db: jest.fn() }));
jest.mock(
  "firebase-functions/v1",
  () => ({
    runWith: () => ({ pubsub: { schedule: () => ({ onRun: (handler) => handler }) } }),
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  }),
  { virtual: true }, // CI doesn't install functions/ dependencies
);

const { EXPO_PUSH_URL, sendToUsers } = require("./push");
const {
  LEASE_MS,
  needsPlan,
  nextStep,
  planReminder,
  recipientsFor,
  reminderPlan,
  sendDueReminders,
} = require("./reminders");

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const at = (iso) => Date.parse(iso);
const iso = (ms) => (ms == null ? ms : new Date(ms).toISOString());

/**
 * An in-memory Firestore with the parts reminders use: documents by path,
 * a collection-group query on one field, transactions, and update times so
 * `lastUpdateTime` preconditions work. `onQuery` runs after the query, to
 * simulate a write landing while a run is in progress.
 */
function createFakeDb() {
  const store = new Map(); // path -> { data, updateTime }
  let clock = 0;
  const fake = { store, writes: [], onQuery: null };

  const write = (path, data) => {
    store.set(path, { data: structuredClone(data), updateTime: ++clock });
    fake.writes.push(path);
  };

  function snapshot(path) {
    const entry = store.get(path);
    return {
      id: path.split("/").pop(),
      ref: docRef(path),
      exists: entry !== undefined,
      updateTime: entry && entry.updateTime,
      data: () => (entry ? structuredClone(entry.data) : undefined),
      get: (field) => (entry ? entry.data[field] : undefined),
    };
  }

  function update(path, changes, precondition) {
    const entry = store.get(path);
    if (!entry) throw Object.assign(new Error("not found"), { code: 5 });
    if (precondition && precondition.lastUpdateTime !== entry.updateTime) {
      throw Object.assign(new Error("precondition failed"), { code: 9 });
    }
    write(path, { ...entry.data, ...changes });
  }

  function docRef(path) {
    const parts = path.split("/");
    return {
      path,
      id: parts[parts.length - 1],
      get parent() {
        return collectionRef(parts.slice(0, -1).join("/"));
      },
      get: async () => snapshot(path),
      update: async (changes, precondition) => update(path, changes, precondition),
    };
  }

  function collectionRef(path) {
    const parts = path.split("/");
    return {
      path,
      id: parts[parts.length - 1],
      get parent() {
        return parts.length > 1 ? docRef(parts.slice(0, -1).join("/")) : null;
      },
      doc: (id) => docRef(`${path}/${id}`),
      get: async () => ({
        docs: [...store.keys()]
          .filter((key) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes("/"))
          .map(snapshot),
      }),
    };
  }

  fake.db = {
    doc: docRef,
    collection: collectionRef,
    getAll: async (...refs) => refs.map((ref) => snapshot(ref.path)),
    collectionGroup: (name) => ({
      where: (field, op, value) => {
        expect(op).toBe("<=");
        return {
          limit: (n) => ({
            get: async () => {
              const docs = [...store.entries()]
                .filter(([key, { data }]) => {
                  const parts = key.split("/");
                  return parts[parts.length - 2] === name && typeof data[field] === "number" && data[field] <= value;
                })
                .slice(0, n)
                .map(([key]) => snapshot(key));
              if (fake.onQuery) fake.onQuery();
              return { docs };
            },
          }),
        };
      },
    }),
    runTransaction: async (callback) => {
      const ops = [];
      const result = await callback({
        get: async (ref) => snapshot(ref.path),
        update: (ref, changes) => ops.push(() => update(ref.path, changes)),
      });
      ops.forEach((op) => op());
      return result;
    },
  };
  fake.set = write;
  fake.get = (path) => store.get(path) && store.get(path).data;
  return fake;
}

function fakeFetch() {
  const calls = [];
  const fetchImpl = async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, body });
    return { ok: true, json: async () => ({ data: body.map(() => ({ status: "ok" })) }) };
  };
  return { calls, fetchImpl };
}

const LONDON = "Europe/London";
const CLEARED = {
  notify_at: null,
  notify_stage: null,
  notify_for: null,
  notify_sending: null,
  notify_lease: null,
};

describe("reminderPlan", () => {
  const now = at("2026-11-15T10:00:00Z");

  it("plans a daytime due time as it is", () => {
    const due = at("2026-11-18T14:00:00Z");
    expect(reminderPlan({ next_watering_date: due }, now, LONDON)).toEqual({
      notify_at: due,
      notify_stage: "due",
      notify_for: due,
      notify_sending: null,
      notify_lease: null,
    });
  });

  it("moves an overnight due time to 08:00", () => {
    const plan = reminderPlan({ next_watering_date: at("2026-11-18T02:30:00Z") }, now, LONDON);
    expect(iso(plan.notify_at)).toBe("2026-11-18T08:00:00.000Z");
  });

  it("reminds about an overdue plant now, or at 08:00 if it's night", () => {
    const overdue = { next_watering_date: at("2026-11-01T12:00:00Z") };
    expect(reminderPlan(overdue, now, LONDON).notify_at).toBe(now);
    expect(iso(reminderPlan(overdue, at("2026-11-15T23:00:00Z"), LONDON).notify_at)).toBe(
      "2026-11-16T08:00:00.000Z",
    );
  });

  it.each([
    ["reminders are off", { next_watering_date: at("2026-11-18T14:00:00Z"), reminders_enabled: false }],
    ["there's no due date", {}],
    ["the due date is null", { next_watering_date: null }],
  ])("clears the reminder when %s", (_, plant) => {
    expect(reminderPlan(plant, now, LONDON)).toEqual(CLEARED);
  });
});

describe("needsPlan", () => {
  const plant = { next_watering_date: 5, reminders_enabled: true };

  it("plans a new plant, and not a deleted one", () => {
    expect(needsPlan(null, plant)).toBe(true);
    expect(needsPlan(plant, null)).toBe(false);
  });

  it("plans when the due date or the switch changes", () => {
    expect(needsPlan(plant, { ...plant, next_watering_date: 6 })).toBe(true);
    expect(needsPlan(plant, { ...plant, reminders_enabled: false })).toBe(true);
  });

  it("ignores other edits, including its own notify_at write", () => {
    expect(needsPlan(plant, { ...plant, custom_name: "Monty" })).toBe(false);
    expect(needsPlan(plant, { ...plant, notify_at: 5, notify_stage: "due" })).toBe(false);
  });
});

describe("planReminder", () => {
  const now = at("2026-11-15T10:00:00Z");
  const due = at("2026-11-18T14:00:00Z");
  let fake;
  beforeEach(() => {
    fake = createFakeDb();
    fake.set("Households/h1", { timeZone: LONDON });
  });
  const ref = () => fake.db.doc("Households/h1/Plants/p1");

  it("writes the plan, and its own write doesn't plan again", async () => {
    const before = { next_watering_date: 1 };
    const after = { next_watering_date: due };
    fake.set("Households/h1/Plants/p1", after);

    const plan = await planReminder({ db: fake.db, ref: ref(), householdId: "h1", before, after, now });
    expect(plan).toMatchObject({ notify_at: due, notify_stage: "due", notify_for: due });
    expect(fake.get("Households/h1/Plants/p1")).toMatchObject({ notify_at: due, notify_stage: "due" });

    // The trigger for that write: before and after differ only in notify_*.
    const written = fake.get("Households/h1/Plants/p1");
    fake.writes.length = 0;
    const again = await planReminder({ db: fake.db, ref: ref(), householdId: "h1", before: after, after: written, now });
    expect(again).toBeNull();
    expect(fake.writes).toEqual([]);
  });

  it("plans from the plant as it is now, not as the trigger saw it", async () => {
    const newer = at("2026-11-20T12:00:00Z");
    fake.set("Households/h1/Plants/p1", { next_watering_date: newer });

    await planReminder({
      db: fake.db, ref: ref(), householdId: "h1",
      before: { next_watering_date: 1 }, after: { next_watering_date: due }, now,
    });
    expect(fake.get("Households/h1/Plants/p1").notify_at).toBe(newer);
  });

  it("doesn't write when the plan is already right", async () => {
    fake.set("Households/h1/Plants/p1", {
      next_watering_date: due, notify_at: due, notify_stage: "due", notify_for: due,
    });
    fake.writes.length = 0;
    const plan = await planReminder({
      db: fake.db, ref: ref(), householdId: "h1",
      before: null, after: fake.get("Households/h1/Plants/p1"), now,
    });
    expect(plan).toBeNull();
    expect(fake.writes).toEqual([]);
  });

  it("ignores a repeated trigger once the plant was reminded for that date", async () => {
    // The due push went out (stage "nudge"); a late copy of the original
    // trigger must not put the plant back to "due".
    fake.set("Households/h1/Plants/p1", {
      next_watering_date: due, notify_at: due + DAY_MS, notify_stage: "nudge", notify_for: due,
    });
    fake.writes.length = 0;
    const plan = await planReminder({
      db: fake.db, ref: ref(), householdId: "h1",
      before: { next_watering_date: 1 }, after: { next_watering_date: due }, now,
    });
    expect(plan).toBeNull();
    expect(fake.writes).toEqual([]);

    // Same after the whole cycle finished (nudge sent, fields cleared).
    fake.set("Households/h1/Plants/p1", {
      next_watering_date: due, notify_at: null, notify_stage: null, notify_for: due,
    });
    expect(
      await planReminder({
        db: fake.db, ref: ref(), householdId: "h1",
        before: { next_watering_date: 1 }, after: { next_watering_date: due }, now,
      }),
    ).toBeNull();
  });

  it("plans again when the due date really moves, or reminders come back on", async () => {
    const watered = at("2026-11-25T12:00:00Z");
    fake.set("Households/h1/Plants/p1", {
      next_watering_date: watered, notify_at: null, notify_stage: null, notify_for: due,
    });
    await planReminder({
      db: fake.db, ref: ref(), householdId: "h1",
      before: { next_watering_date: due }, after: { next_watering_date: watered }, now,
    });
    expect(fake.get("Households/h1/Plants/p1")).toMatchObject({
      notify_at: watered, notify_stage: "due", notify_for: watered,
    });
  });

  it("clears the reminder when reminders are switched off", async () => {
    fake.set("Households/h1/Plants/p1", {
      next_watering_date: due, reminders_enabled: false, notify_at: due, notify_stage: "due",
    });
    await planReminder({
      db: fake.db, ref: ref(), householdId: "h1",
      before: { next_watering_date: due }, after: fake.get("Households/h1/Plants/p1"), now,
    });
    expect(fake.get("Households/h1/Plants/p1")).toMatchObject({ notify_at: null, notify_stage: null });
  });

  it("does nothing for a plant deleted since", async () => {
    const plan = await planReminder({
      db: fake.db, ref: ref(), householdId: "h1", before: null, after: { next_watering_date: due }, now,
    });
    expect(plan).toBeNull();
  });
});

describe("nextStep", () => {
  it("moves a nudge that would land after 21:00 to 08:00 (clocks going forward)", () => {
    // 20:30 GMT on 28 March; a day later is 21:30 BST.
    const step = nextStep({ notify_stage: "due", notify_at: at("2026-03-28T20:30:00Z") }, at("2026-03-28T20:30:00Z"), LONDON);
    expect(step.send).toBe("due");
    expect(step.update.notify_stage).toBe("nudge");
    expect(iso(step.update.notify_at)).toBe("2026-03-30T07:00:00.000Z");
  });

  it("nudges a day from now when the run is very late", () => {
    const now = at("2026-11-15T10:00:00Z");
    const step = nextStep({ notify_stage: "due", notify_at: now - 3 * DAY_MS }, now, LONDON);
    expect(step.update.notify_at).toBe(now + DAY_MS);
  });

  it("clears an unknown stage without sending", () => {
    expect(nextStep({ notify_at: 1 }, 2, LONDON)).toEqual({
      update: CLEARED,
      send: null,
    });
  });
});

describe("recipientsFor", () => {
  it("is the carers, or whoever added the plant", () => {
    expect(recipientsFor({ carerIds: ["a", "b"], addedBy: "a" })).toEqual(["a", "b"]);
    expect(recipientsFor({ carerIds: [], addedBy: "a" })).toEqual(["a"]);
    expect(recipientsFor({})).toEqual([]);
  });
});

describe("sendDueReminders", () => {
  const due = at("2026-11-18T14:00:00Z");
  let fake;
  let fetch;
  const send = (db, uids, message, pref) => sendToUsers(db, uids, message, pref, fetch.fetchImpl);
  const run = (now) => sendDueReminders({ db: fake.db, now, send });
  const plantPath = "Households/h1/Plants/p1";

  beforeEach(() => {
    fake = createFakeDb();
    fetch = fakeFetch();
    fake.set("Households/h1", { timeZone: LONDON });
    fake.set("Plants/monstera", { name: "Monstera" }); // the catalog
    for (const uid of ["kian", "sam"]) {
      fake.set(`Users/${uid}`, {});
      fake.set(`Users/${uid}/Devices/ExponentPushToken[${uid}]`, { expoPushToken: `ExponentPushToken[${uid}]` });
    }
    fake.set(plantPath, {
      plantId: "monstera",
      addedBy: "kian",
      carerIds: ["kian", "sam"],
      shared: true,
      next_watering_date: due,
      notify_at: due,
      notify_stage: "due",
    });
  });

  const sentTo = (call) => call.body.map((m) => m.to);

  it("sends one push to each carer, one nudge a day later, then nothing", async () => {
    expect(await run(due - HOUR_MS)).toMatchObject({ found: 0 });
    expect(fetch.calls).toHaveLength(0);

    const first = await run(due + 5 * 60 * 1000);
    expect(first).toMatchObject({ found: 1, due: 1, devices: 2, failed: 0 });
    expect(fetch.calls).toHaveLength(1);
    expect(fetch.calls[0].url).toBe(EXPO_PUSH_URL);
    expect(sentTo(fetch.calls[0])).toEqual(["ExponentPushToken[kian]", "ExponentPushToken[sam]"]);
    expect(fetch.calls[0].body[0]).toMatchObject({
      title: "The Monstera needs watering 💧",
      body: "Whoever gets there first, tap Watered.",
      data: { plantId: "p1", householdId: "h1", type: "due" },
    });
    expect(fake.get(plantPath)).toMatchObject({ notify_stage: "nudge", notify_at: due + DAY_MS });

    // Nothing more until the nudge is due.
    expect(await run(due + 2 * HOUR_MS)).toMatchObject({ found: 0 });

    const second = await run(due + DAY_MS);
    expect(second).toMatchObject({ found: 1, nudge: 1, devices: 2 });
    expect(fetch.calls[1].body[0]).toMatchObject({
      title: "The Monstera is still thirsty 🥀",
      data: { type: "nudge" },
    });
    expect(fake.get(plantPath)).toMatchObject({ notify_at: null, notify_stage: null });

    expect(await run(due + 5 * DAY_MS)).toMatchObject({ found: 0 });
    expect(fetch.calls).toHaveLength(2);
  });

  it("words a personal plant's reminder for its owner, using its nickname", async () => {
    fake.set(plantPath, {
      ...fake.get(plantPath), shared: false, carerIds: ["sam"], custom_name: "Monty",
    });
    await run(due);
    expect(sentTo(fetch.calls[0])).toEqual(["ExponentPushToken[sam]"]);
    expect(fetch.calls[0].body[0].title).toBe("Time to water the Monty 💧");
  });

  it("skips someone who switched reminders off", async () => {
    fake.set("Users/sam", { notificationPrefs: { reminders: false } });
    await run(due);
    expect(sentTo(fetch.calls[0])).toEqual(["ExponentPushToken[kian]"]);
  });

  it("clears a plant with reminders off without sending", async () => {
    fake.set(plantPath, { ...fake.get(plantPath), reminders_enabled: false });
    expect(await run(due)).toMatchObject({ found: 1, cleared: 1 });
    expect(fetch.calls).toHaveLength(0);
    expect(fake.get(plantPath)).toMatchObject({ notify_at: null, notify_stage: null });
  });

  it("sends nothing and keeps the new plan if someone waters it mid-run", async () => {
    const nextDue = due + 7 * DAY_MS;
    fake.onQuery = () =>
      fake.set(plantPath, {
        ...fake.get(plantPath), last_watered_by: "sam", next_watering_date: nextDue, notify_at: nextDue,
      });

    expect(await run(due)).toMatchObject({ found: 1, skipped: 1, due: 0 });
    expect(fetch.calls).toHaveLength(0);
    expect(fake.get(plantPath)).toMatchObject({ notify_at: nextDue, notify_stage: "due" });
  });

  it("sends nothing for a catalog plant, and clears its notify_at so it can't come back", async () => {
    fake.set("Plants/odd", { name: "Odd", notify_at: 1 });
    expect(await run(due)).toMatchObject({ found: 2, skipped: 1, due: 1 });
    expect(fake.get("Plants/odd").notify_at).toBeNull();
    expect(await run(due + HOUR_MS)).toMatchObject({ found: 0 });
  });

  it("carries on when one plant's push fails", async () => {
    fake.set("Households/h1/Plants/p2", { ...fake.get(plantPath), plantId: null });
    let calls = 0;
    const flaky = async (...args) => {
      calls++;
      if (calls === 1) throw new Error("Expo push failed with status 500");
      return send(...args);
    };

    const summary = await sendDueReminders({ db: fake.db, now: due, send: flaky });
    expect(summary).toMatchObject({ found: 2, failed: 1, due: 1 });
  });

  describe("when a push fails", () => {
    const failing = async () => {
      throw new Error("Expo push failed with status 500");
    };

    it("keeps the due stage, so the next run sends the first reminder", async () => {
      const first = await sendDueReminders({ db: fake.db, now: due, send: failing });
      expect(first).toMatchObject({ found: 1, failed: 1, due: 0 });
      expect(fake.get(plantPath)).toMatchObject({
        notify_stage: "due",
        notify_at: due,
        notify_sending: null,
        notify_lease: null,
      });

      const retry = await run(due + 15 * 60 * 1000);
      expect(retry).toMatchObject({ found: 1, due: 1, failed: 0 });
      expect(fetch.calls).toHaveLength(1);
      expect(fake.get(plantPath)).toMatchObject({ notify_stage: "nudge" });
    });

    it("retries a nudge that failed, not the due push", async () => {
      fake.set(plantPath, { ...fake.get(plantPath), notify_stage: "nudge", notify_at: due });
      await sendDueReminders({ db: fake.db, now: due, send: failing });
      expect(fake.get(plantPath).notify_stage).toBe("nudge");
      await run(due + 15 * 60 * 1000);
      expect(fetch.calls[0].body[0].data.type).toBe("nudge");
    });
  });

  describe("a claim left behind by a run that died", () => {
    const dead = (lease) => ({
      ...fake.get(plantPath),
      notify_stage: "sending",
      notify_sending: "due",
      notify_lease: lease,
    });

    it("is left alone while its lease is fresh", async () => {
      fake.set(plantPath, dead(due));
      const summary = await run(due + 5 * 60 * 1000);
      expect(summary).toMatchObject({ found: 1, skipped: 1, due: 0 });
      expect(fetch.calls).toHaveLength(0);
    });

    it("is picked up as the stage it was sending once the lease has run out", async () => {
      fake.set(plantPath, dead(due));
      const summary = await run(due + LEASE_MS + 1000);
      expect(summary).toMatchObject({ due: 1, failed: 0 });
      expect(fetch.calls[0].body[0].data.type).toBe("due");
      expect(fake.get(plantPath)).toMatchObject({ notify_stage: "nudge", notify_lease: null });
    });
  });

  it("keeps a plan made while the push was going out", async () => {
    const nextDue = due + 7 * DAY_MS;
    const sendAndWater = async (...args) => {
      // Someone waters the plant while Expo is being called.
      fake.set(plantPath, {
        ...fake.get(plantPath),
        next_watering_date: nextDue,
        notify_at: nextDue,
        notify_stage: "due",
        notify_for: nextDue,
        notify_sending: null,
        notify_lease: null,
      });
      return send(...args);
    };
    await sendDueReminders({ db: fake.db, now: due, send: sendAndWater });
    expect(fake.get(plantPath)).toMatchObject({ notify_at: nextDue, notify_stage: "due" });
  });
});
