jest.mock("./admin", () => ({
  Timestamp: { fromMillis: (ms) => ({ ms, toMillis: () => ms }) },
}));

jest.mock("firebase-functions/v1", () => {
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

  it("stops the household's older codes working", async () => {
    fake.store.set("Households/kian", { name: "Kian's home", ...members("kian") });
    const old = await run();
    const other = { householdId: "sam", createdBy: "sam", expiresAt: ts(NOW + DAY_MS) };
    fake.store.set("Invites/SAMSCODE", other);

    const fresh = await run();

    expect(fake.store.get(`Invites/${old.code}`).revokedAt).toBeDefined();
    expect(fake.store.get(`Invites/${fresh.code}`).revokedAt).toBeUndefined();
    expect(fake.store.get("Invites/SAMSCODE")).toEqual(other); // another household's
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

  it("treats a revoked code as not found", async () => {
    const invite = fake.store.get(`Invites/${CODE}`);
    fake.store.set(`Invites/${CODE}`, { ...invite, revokedAt: ts(NOW - 1) });
    await rejectsWith(join({ code: CODE }), "not-found", "That code isn't valid or has expired.");
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
  // Kian set up "The Flat" (so its ID is his uid); Sam and Alex joined.
  beforeEach(() => {
    fake.store.set("Households/kian", {
      name: "The Flat",
      createdBy: "kian",
      timeZone: "Europe/London",
      ...members("kian", "sam", "alex"),
    });
    ["kian", "sam", "alex"].forEach((uid) =>
      fake.store.set(`Users/${uid}`, { householdId: "kian", displayName: uid }),
    );
    fake.store.set("Households/kian/Plants/pothos", {
      addedBy: "kian",
      carerIds: ["kian", "sam", "alex"],
      shared: true,
    });
    fake.store.set("Households/kian/Plants/fern", {
      addedBy: "sam",
      carerIds: ["sam"],
      shared: false,
    });
  });

  const leave = (uid) => leaveHouseholdHandler({ db, uid, now: NOW });
  const remove = (uid, target) =>
    removeMemberHandler({ db, uid, data: { uid: target }, now: NOW });

  describe("invite codes", () => {
    const code = (createdBy, extra = {}) => ({
      householdId: "kian",
      createdBy,
      expiresAt: ts(NOW + DAY_MS),
      ...extra,
    });
    beforeEach(() => {
      fake.store.set("Invites/SAMSCODE", code("sam"));
      fake.store.set("Invites/KIANCODE", code("kian"));
    });

    it("a member who leaves takes their codes with them, not the others'", async () => {
      await leave("sam");
      expect(fake.store.get("Invites/SAMSCODE").revokedAt).toBeDefined();
      expect(fake.store.get("Invites/KIANCODE").revokedAt).toBeUndefined();
    });

    it("a removed member's codes stop working", async () => {
      await remove("kian", "sam");
      expect(fake.store.get("Invites/SAMSCODE").revokedAt).toBeDefined();
      expect(fake.store.get("Invites/KIANCODE").revokedAt).toBeUndefined();
    });

    it("leaves codes that are already expired or revoked as they were", async () => {
      const revokedAt = ts(NOW - 5);
      fake.store.set("Invites/OLDREVOK", code("sam", { revokedAt }));
      fake.store.set("Invites/OLDEXPIR", code("sam", { expiresAt: ts(NOW - 1) }));
      await leave("sam");
      expect(fake.store.get("Invites/OLDREVOK").revokedAt).toBe(revokedAt);
      expect(fake.store.get("Invites/OLDEXPIR").revokedAt).toBeUndefined();
    });
  });

  it("a member leaves for an empty household of their own", async () => {
    const result = await leave("sam");

    expect(result).toEqual({ householdId: "sam" });
    expect(fake.store.get("Households/kian").memberIds).toEqual(["kian", "alex"]);
    expect(fake.store.get("Households/kian").members.sam).toBeUndefined();
    expect(fake.store.get("Households/kian").createdBy).toBe("kian");
    expect(fake.store.get("Households/kian/Plants/pothos").carerIds).toEqual(["kian", "alex"]);
    // Plants only Sam looked after stay, shared with whoever is left.
    expect(fake.store.get("Households/kian/Plants/fern")).toMatchObject({
      addedBy: "sam",
      carerIds: ["kian", "alex"],
      shared: true,
    });
    expect(fake.store.get("Households/sam")).toEqual({
      name: "sam's home",
      memberIds: ["sam"],
      members: { sam: { displayName: "sam" } },
      createdBy: "sam",
      createdAt: expect.objectContaining({ ms: NOW }),
      timeZone: "Europe/London",
    });
    expect(fake.store.get("Users/sam").householdId).toBe("sam");
    expect([...fake.store.keys()].filter((k) => k.startsWith("Households/sam/"))).toEqual([]);
  });

  it("the creator leaves: the longest-standing member takes over and they get a new ID", async () => {
    const result = await leave("kian");

    expect(result.householdId).not.toBe("kian");
    expect(fake.store.get("Households/kian")).toMatchObject({
      memberIds: ["sam", "alex"],
      createdBy: "sam",
    });
    expect(fake.store.get(`Households/${result.householdId}`)).toMatchObject({
      memberIds: ["kian"],
      createdBy: "kian",
    });
    expect(fake.store.get("Users/kian").householdId).toBe(result.householdId);
  });

  it("uses the person's own time zone when their profile has one", async () => {
    fake.store.set("Users/sam", { householdId: "kian", timeZone: "Asia/Tokyo" });
    await leave("sam");
    expect(fake.store.get("Households/sam").timeZone).toBe("Asia/Tokyo");
  });

  it("the last member can't leave", async () => {
    fake.store.set("Users/solo", { householdId: "solo" });
    fake.store.set("Households/solo", { name: "Solo", createdBy: "solo", ...members("solo") });

    await rejectsWith(
      leave("solo"),
      "failed-precondition",
      "You're the only one in this household.",
    );
    expect(fake.store.get("Households/solo").memberIds).toEqual(["solo"]);
  });

  it("someone not in the household can't leave it", async () => {
    fake.store.set("Users/eve", { householdId: "kian" });
    await rejectsWith(leave("eve"), "permission-denied");
  });

  it("the creator removes a member, who gets a household of their own", async () => {
    await remove("kian", "alex");

    expect(fake.store.get("Households/kian").memberIds).toEqual(["kian", "sam"]);
    expect(fake.store.get("Households/kian/Plants/pothos").carerIds).toEqual(["kian", "sam"]);
    expect(fake.store.get("Households/alex").memberIds).toEqual(["alex"]);
    expect(fake.store.get("Users/alex").householdId).toBe("alex");
  });

  it("someone else can't remove a member", async () => {
    await rejectsWith(
      remove("sam", "alex"),
      "permission-denied",
      "Only the person who set up the household can remove people.",
    );
    expect(fake.store.get("Households/kian").memberIds).toEqual(["kian", "sam", "alex"]);
  });

  it("removing yourself is refused: that's leaving", async () => {
    await rejectsWith(remove("kian", "kian"), "invalid-argument", "Use Leave household to leave.");
    expect(fake.store.get("Households/kian").memberIds).toHaveLength(3);
  });

  it("removing someone who isn't a member says so", async () => {
    await rejectsWith(remove("kian", "eve"), "not-found");
  });

  it.each([undefined, "", 42, "x".repeat(129)])("rejects a bad uid (%p)", async (target) => {
    await rejectsWith(
      removeMemberHandler({ db, uid: "kian", data: { uid: target }, now: NOW }),
      "invalid-argument",
    );
  });

  it("a removed member whose profile points elsewhere keeps that household", async () => {
    fake.store.set("Users/alex", { householdId: "elsewhere" });
    const result = await remove("kian", "alex");

    expect(result).toEqual({ householdId: "elsewhere" });
    expect(fake.store.has("Households/alex")).toBe(false);
    expect(fake.store.get("Users/alex").householdId).toBe("elsewhere");
  });

  it("someone who left can join again with a code", async () => {
    await leave("sam");
    fake.store.set("Invites/K7PXM3QH", { householdId: "kian", expiresAt: ts(NOW + DAY_MS) });

    await joinHouseholdHandler({ db, uid: "sam", data: { code: "K7PXM3QH" }, now: NOW });

    expect(fake.store.get("Households/kian").memberIds).toEqual(["kian", "alex", "sam"]);
    expect(fake.store.has("Households/sam")).toBe(false);
  });
});
