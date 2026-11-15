jest.mock("firebase-admin", () => ({
  firestore: {
    Timestamp: { fromMillis: (ms) => ({ ms, toMillis: () => ms }) },
    FieldValue: { delete: () => ({ __delete: true }), serverTimestamp: () => "now" },
  },
}), { virtual: true }); // CI doesn't install functions/ dependencies

jest.mock("firebase-functions", () => {
  class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }
  return { https: { HttpsError } };
}, { virtual: true });

const { createFakeFirestore } = require("./fakeFirestore");
const {
  createInviteHandler,
  joinHouseholdHandler,
  leaveHouseholdHandler,
  removeMemberHandler,
} = require("./households");
const { ALPHABET } = require("./inviteCode");

const NOW = Date.parse("2026-11-15T10:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const ts = (ms) => ({ toMillis: () => ms });

let fake;
let db;
beforeEach(() => {
  fake = createFakeFirestore();
  db = fake.db;
});

const members = (...ids) => ({
  memberIds: ids,
  members: Object.fromEntries(ids.map((id) => [id, { displayName: id }])),
});

const rejectsWith = async (promise, code, message) => {
  const error = await promise.then(
    () => null,
    (e) => e,
  );
  expect(error).not.toBeNull();
  expect(error.code).toBe(code);
  if (message) expect(error.message).toBe(message);
};

describe("createInviteHandler", () => {
  const run = () => createInviteHandler({ db, uid: "kian", now: NOW });

  it("refuses someone who isn't in the household", async () => {
    fake.store.set("Users/kian", { householdId: "flat" });
    fake.store.set("Households/flat", { name: "The Flat", ...members("sam") });
    await rejectsWith(run(), "permission-denied");
    expect(fake.created).toEqual([]);
  });

  it("refuses when the household doesn't exist", async () => {
    await rejectsWith(run(), "permission-denied");
  });

  it("refuses when the household is full", async () => {
    const ids = Array.from({ length: 10 }, (_, i) => `u${i}`);
    fake.store.set("Users/u0", { householdId: "flat" });
    fake.store.set("Households/flat", { name: "The Flat", ...members(...ids) });
    await rejectsWith(
      createInviteHandler({ db, uid: "u0", now: NOW }),
      "resource-exhausted",
      "This household is full.",
    );
  });

  it("makes a code that works for 7 days, in the caller's own household if no householdId is set", async () => {
    fake.store.set("Households/kian", { name: "Kian's home", ...members("kian") });

    const result = await run();

    expect(result.code).toMatch(new RegExp(`^[${ALPHABET}]{8}$`));
    expect(result.expiresAt).toBe(NOW + 7 * DAY_MS);
    expect(result.householdName).toBe("Kian's home");
    const invite = fake.store.get(`Invites/${result.code}`);
    expect(invite.householdId).toBe("kian");
    expect(invite.createdBy).toBe("kian");
    expect(invite.expiresAt.toMillis()).toBe(NOW + 7 * DAY_MS);
  });

  it("makes a new code every time", async () => {
    fake.store.set("Households/kian", { name: "Kian's home", ...members("kian") });
    const a = await run();
    const b = await run();
    expect(a.code).not.toBe(b.code);
    expect(fake.created).toHaveLength(2);
  });

  // Makes the first `taken` attempts fail as if the code already existed.
  function takeCodes(taken) {
    const realDoc = db.doc;
    const calls = { count: 0 };
    db.doc = (path) => {
      const ref = realDoc(path);
      if (!path.startsWith("Invites/")) return ref;
      return {
        ...ref,
        create: async (data) => {
          calls.count += 1;
          if (calls.count <= taken) throw Object.assign(new Error("exists"), { code: 6 });
          return ref.create(data);
        },
      };
    };
    return calls;
  }

  it("tries another code when one is taken", async () => {
    fake.store.set("Households/kian", { name: "Kian's home", ...members("kian") });
    const calls = takeCodes(2);
    const result = await run();
    expect(calls.count).toBe(3);
    expect(fake.store.has(`Invites/${result.code}`)).toBe(true);
  });

  it("gives up after 3 tries", async () => {
    fake.store.set("Households/kian", { name: "Kian's home", ...members("kian") });
    const calls = takeCodes(99);
    await rejectsWith(run(), "internal");
    expect(calls.count).toBe(3);
  });
});

describe("joinHouseholdHandler", () => {
  const CODE = "K7PXM3QH";
  const token = { name: "Sam Token", email: "sam@example.com" };
  const join = (data, uid = "sam") =>
    joinHouseholdHandler({ db, uid, authToken: token, data, now: NOW });

  beforeEach(() => {
    fake.store.set(`Invites/${CODE}`, {
      householdId: "flat",
      createdBy: "kian",
      expiresAt: ts(NOW + DAY_MS),
    });
    fake.store.set("Households/flat", { name: "The Flat", ...members("kian") });
    fake.store.set("Households/flat/Plants/pothos", {
      addedBy: "kian",
      carerIds: ["kian"],
      shared: true,
    });
    fake.store.set("Households/flat/Plants/cactus", {
      addedBy: "kian",
      carerIds: ["kian"],
      shared: false,
    });
    // Sam has a household of their own with two plants.
    fake.store.set("Users/sam", { householdId: "sam", displayName: "Sam" });
    fake.store.set("Households/sam", { name: "Sam's home", ...members("sam") });
    fake.store.set("Households/sam/Plants/fern", {
      plantId: "f1",
      addedBy: "sam",
      userId: "sam",
      carerIds: ["sam"],
      shared: true,
      custom_name: "Fernie",
    });
    fake.store.set("Households/sam/Plants/aloe", { addedBy: "sam", carerIds: ["sam"] });
  });

  const snapshotOfStore = () => JSON.stringify([...fake.store.entries()]);

  it("rejects a malformed code", async () => {
    await rejectsWith(join({ code: "nope" }), "invalid-argument", "Codes are 8 letters and numbers.");
    await rejectsWith(join(undefined), "invalid-argument");
  });

  it("gives a wrong code and an expired code the same error", async () => {
    const message = "That code isn't valid or has expired.";
    await rejectsWith(join({ code: "AAAAAAAA" }), "not-found", message);

    fake.store.set(`Invites/${CODE}`, {
      householdId: "flat",
      expiresAt: ts(NOW),
    });
    await rejectsWith(join({ code: CODE }), "not-found", message);
  });

  it("treats an invite for a deleted household as not found", async () => {
    fake.store.delete("Households/flat");
    await rejectsWith(join({ code: CODE }), "not-found");
  });

  it("says so when you're already in the household", async () => {
    fake.store.set("Households/flat", { name: "The Flat", ...members("kian", "sam") });
    await rejectsWith(join({ code: CODE }), "already-exists", "You're already in this household.");
  });

  it("refuses someone whose household has other members", async () => {
    fake.store.set("Households/sam", { name: "Sam's home", ...members("sam", "alex") });
    const before = snapshotOfStore();
    await rejectsWith(join({ code: CODE }), "failed-precondition", "Leave your current household first.");
    expect(snapshotOfStore()).toBe(before);
  });

  it("refuses when the household is full", async () => {
    const ids = Array.from({ length: 10 }, (_, i) => `u${i}`);
    fake.store.set("Households/flat", { name: "The Flat", ...members(...ids) });
    await rejectsWith(join({ code: CODE }), "resource-exhausted", "This household is full.");
  });

  it("previews without writing anything", async () => {
    const before = snapshotOfStore();

    const result = await join({ code: "k7px-m3qh", preview: true });

    expect(result).toEqual({ householdName: "The Flat", memberCount: 1, plantsMoving: 2 });
    expect(snapshotOfStore()).toBe(before);
    expect(fake.created).toEqual([]);
  });

  it("still runs the checks when previewing", async () => {
    await rejectsWith(join({ code: "AAAAAAAA", preview: true }), "not-found");
  });

  it("adds the joiner, moves their plants and removes their old household", async () => {
    const result = await join({ code: "K7PX-M3QH" });

    expect(result).toEqual({ householdId: "flat", householdName: "The Flat" });

    expect(fake.store.get("Households/flat")).toEqual({
      name: "The Flat",
      memberIds: ["kian", "sam"],
      members: { kian: { displayName: "kian" }, sam: { displayName: "Sam" } },
    });
    // Carers only change on shared plants.
    expect(fake.store.get("Households/flat/Plants/pothos").carerIds).toEqual(["kian", "sam"]);
    expect(fake.store.get("Households/flat/Plants/cactus").carerIds).toEqual(["kian"]);

    // Their plants arrive as personal plants with the same ID and data.
    expect(fake.store.get("Households/flat/Plants/fern")).toEqual({
      plantId: "f1",
      custom_name: "Fernie",
      addedBy: "sam",
      userId: "sam",
      carerIds: ["sam"],
      shared: false,
    });
    expect(fake.store.get("Households/flat/Plants/aloe")).toEqual({
      addedBy: "sam",
      userId: "sam",
      carerIds: ["sam"],
      shared: false,
    });

    // Their old household is gone, and they point at the new one.
    expect(fake.store.has("Households/sam")).toBe(false);
    expect(fake.store.has("Households/sam/Plants/fern")).toBe(false);
    expect(fake.store.has("Households/sam/Plants/aloe")).toBe(false);
    expect(fake.store.get("Users/sam")).toEqual({ householdId: "flat", displayName: "Sam" });

    // The invite can be used again.
    expect(fake.store.has(`Invites/${CODE}`)).toBe(true);
  });

  it("works for someone with no profile or household yet, using their sign-in name", async () => {
    fake.store.delete("Users/sam");
    fake.store.delete("Households/sam");
    fake.store.delete("Households/sam/Plants/fern");
    fake.store.delete("Households/sam/Plants/aloe");

    await join({ code: CODE });

    expect(fake.store.get("Households/flat").members.sam).toEqual({ displayName: "Sam Token" });
    expect(fake.store.get("Users/sam")).toEqual({ householdId: "flat" });
  });

  it("can be used by a second person", async () => {
    await join({ code: CODE });
    fake.store.set("Users/alex", {});
    await join({ code: CODE }, "alex");
    expect(fake.store.get("Households/flat").memberIds).toEqual(["kian", "sam", "alex"]);
  });
});

describe("leaving and removing", () => {
  beforeEach(() => {
    // Kian made the flat, then Sam and Alex joined.
    fake.store.set("Users/kian", { householdId: "flat" });
    fake.store.set("Users/sam", { householdId: "flat" });
    fake.store.set("Users/alex", { householdId: "flat" });
    fake.store.set("Households/flat", {
      name: "The Flat",
      createdBy: "kian",
      ...members("kian", "sam", "alex"),
    });
    fake.store.set("Households/flat/Plants/pothos", {
      addedBy: "kian", carerIds: ["kian", "sam", "alex"], shared: true,
    });
    fake.store.set("Households/flat/Plants/fern", {
      addedBy: "sam", carerIds: ["sam"], shared: false,
    });
    fake.store.set("Households/flat/Plants/cactus", {
      addedBy: "kian", carerIds: ["kian"], shared: false,
    });
  });

  const leave = (uid) => leaveHouseholdHandler({ db, uid });
  const remove = (uid, target) => removeMemberHandler({ db, uid, data: { uid: target } });

  it("lets a member leave, handing their own plants to the others", async () => {
    expect(await leave("sam")).toEqual({ left: true });

    expect(fake.store.get("Households/flat").memberIds).toEqual(["kian", "alex"]);
    expect(fake.store.get("Households/flat").members.sam).toBeUndefined();
    expect(fake.store.get("Households/flat").createdBy).toBe("kian");
    expect(fake.store.get("Households/flat/Plants/pothos").carerIds).toEqual(["kian", "alex"]);
    expect(fake.store.get("Households/flat/Plants/fern")).toEqual({
      addedBy: "sam", carerIds: ["kian", "alex"], shared: true,
    });
    expect(fake.store.get("Households/flat/Plants/cactus").carerIds).toEqual(["kian"]);
    // They get a household of their own, with a new ID.
    const own = fake.store.get("Users/sam").householdId;
    expect(own).not.toBe("flat");
    expect(fake.store.get(`Households/${own}`)).toEqual({
      name: "sam's home",
      memberIds: ["sam"],
      members: { sam: { displayName: "sam" } },
      createdBy: "sam",
      createdAt: "now",
      timeZone: "UTC",
    });
  });

  it("gives the household's creator a new household when their uid is the old one's ID", async () => {
    // The household's ID is the creator's uid, and it stays with the others.
    fake.store.set("Users/kian", { householdId: "kian" });
    fake.store.set("Users/sam", { householdId: "kian" });
    fake.store.set("Households/kian", { name: "Kian's home", createdBy: "kian", ...members("kian", "sam") });

    await leave("kian");

    expect(fake.store.get("Households/kian").memberIds).toEqual(["sam"]);
    const own = fake.store.get("Users/kian").householdId;
    expect(own).not.toBe("kian");
    expect(fake.store.get(`Households/${own}`).memberIds).toEqual(["kian"]);
  });

  it("passes the household to the longest-standing member when its creator leaves", async () => {
    await leave("kian");
    expect(fake.store.get("Households/flat").createdBy).toBe("sam");
    expect(fake.store.get("Households/flat").memberIds).toEqual(["sam", "alex"]);
  });

  it("won't let the last member leave", async () => {
    fake.store.set("Households/flat", { name: "The Flat", createdBy: "kian", ...members("kian") });
    await rejectsWith(leave("kian"), "failed-precondition", "You're the only member of this household.");
    expect(fake.store.get("Users/kian")).toEqual({ householdId: "flat" });
  });

  it("refuses someone who isn't in the household", async () => {
    fake.store.set("Users/zoe", { householdId: "flat" });
    await rejectsWith(leave("zoe"), "permission-denied");
  });

  it("lets the creator remove someone", async () => {
    expect(await remove("kian", "sam")).toEqual({ removed: true });
    expect(fake.store.get("Households/flat").memberIds).toEqual(["kian", "alex"]);
    expect(fake.store.get("Households/flat/Plants/fern").carerIds).toEqual(["kian", "alex"]);
    expect(fake.store.get("Users/sam").householdId).not.toBe("flat");
    expect(fake.store.get("Users/kian")).toEqual({ householdId: "flat" });
  });

  it("treats removing yourself as leaving", async () => {
    await remove("kian", "kian");
    expect(fake.store.get("Households/flat").createdBy).toBe("sam");
    expect(fake.store.get("Users/kian").householdId).not.toBe("flat");
  });

  it("refuses someone who isn't the creator", async () => {
    const before = JSON.stringify([...fake.store.entries()]);
    await rejectsWith(
      remove("sam", "alex"),
      "permission-denied",
      "Only the person who made this household can remove people.",
    );
    expect(JSON.stringify([...fake.store.entries()])).toBe(before);
  });

  it("says so when the person isn't in the household", async () => {
    await rejectsWith(remove("kian", "zoe"), "not-found");
    await rejectsWith(removeMemberHandler({ db, uid: "kian", data: {} }), "invalid-argument");
  });
});
