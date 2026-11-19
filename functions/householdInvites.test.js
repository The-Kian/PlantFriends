// Invite lifecycle and updateDisplayName, against the in-memory Firestore.
jest.mock("./admin", () => ({
  Timestamp: { fromMillis: (ms) => ({ ms, toMillis: () => ms }) },
}));

jest.mock(
  "firebase-functions/v1",
  () => {
    class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    }
    return {
      https: { HttpsError },
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    };
  },
  { virtual: true }
);

const { createFakeFirestore } = require("./fakeFirestore");
const {
  createInviteHandler,
  joinHouseholdHandler,
  leaveHouseholdHandler,
  removeMemberHandler,
  updateDisplayNameHandler,
} = require("./households");

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

const rejectsWith = async (promise, code) => {
  const error = await promise.then(
    () => null,
    (e) => e
  );
  expect(error).not.toBeNull();
  expect(error.code).toBe(code);
};

describe("invite lifecycle", () => {
  const invite = (householdId, createdBy, extra = {}) => ({
    householdId,
    createdBy,
    createdAt: ts(NOW - 1000),
    expiresAt: ts(NOW + DAY_MS),
    ...extra,
  });
  const invites = () =>
    [...fake.store.keys()].filter((k) => k.startsWith("Invites/"));

  beforeEach(() => {
    fake.store.set("Users/kian", { householdId: "kian" });
    fake.store.set("Households/kian", {
      name: "Kian's home",
      createdBy: "kian",
      ...members("kian", "sam", "alex"),
    });
    fake.store.set("Users/sam", { householdId: "kian" });
    fake.store.set("Users/alex", { householdId: "kian" });
  });

  it("a new invite revokes the household's older ones, not other households'", async () => {
    fake.store.set("Invites/OLDCODE1", invite("kian", "kian"));
    fake.store.set(
      "Invites/OLDCODE2",
      invite("kian", "sam", { expiresAt: ts(NOW - 1) })
    );
    fake.store.set("Invites/OTHER123", invite("elsewhere", "eve"));

    const { code } = await createInviteHandler({ db, uid: "kian", now: NOW });

    expect(invites().sort()).toEqual(
      [`Invites/${code}`, "Invites/OTHER123"].sort()
    );
  });

  it("an older code no longer lets anyone join", async () => {
    fake.store.set("Invites/K7PXM3QH", invite("kian", "kian"));
    await createInviteHandler({ db, uid: "kian", now: NOW });
    await rejectsWith(
      joinHouseholdHandler({
        db,
        uid: "eve",
        data: { code: "K7PXM3QH" },
        now: NOW,
      }),
      "not-found"
    );
  });

  it("two invites made at once don't revoke each other", async () => {
    fake.store.set(
      "Invites/NEWER000",
      invite("kian", "sam", { createdAt: ts(NOW + 5) })
    );
    const { code } = await createInviteHandler({ db, uid: "kian", now: NOW });
    expect(invites().sort()).toEqual(
      [`Invites/${code}`, "Invites/NEWER000"].sort()
    );
  });

  it("an invite stops working when its creator leaves", async () => {
    fake.store.set("Invites/K7PXM3QH", invite("kian", "sam"));
    fake.store.set("Invites/KEEPKEEP", invite("kian", "kian"));

    await leaveHouseholdHandler({ db, uid: "sam", now: NOW });

    expect(invites()).toEqual(["Invites/KEEPKEEP"]);
    await rejectsWith(
      joinHouseholdHandler({
        db,
        uid: "eve",
        data: { code: "K7PXM3QH" },
        now: NOW,
      }),
      "not-found"
    );
  });

  it("an invite stops working when its creator is removed", async () => {
    fake.store.set("Invites/K7PXM3QH", invite("kian", "alex"));
    await removeMemberHandler({
      db,
      uid: "kian",
      data: { uid: "alex" },
      now: NOW,
    });
    expect(invites()).toEqual([]);
  });

  it("joining is refused for a code whose creator is no longer a member, even if it wasn't revoked", async () => {
    fake.store.set("Invites/K7PXM3QH", invite("kian", "ghost"));
    await rejectsWith(
      joinHouseholdHandler({
        db,
        uid: "eve",
        data: { code: "K7PXM3QH" },
        now: NOW,
      }),
      "not-found"
    );
  });
});

describe("updateDisplayNameHandler", () => {
  const token = { email: "pf.e2e.b.85390@example.com" };
  const rename = (displayName, uid = "sam", authToken = token) =>
    updateDisplayNameHandler({ db, uid, authToken, data: { displayName } });

  it("renames the profile, the member entry and an automatic household name", async () => {
    fake.store.set("Users/sam", {
      householdId: "sam",
      displayName: "pf.e2e.b.85390@example.com",
    });
    fake.store.set("Households/sam", {
      name: "pf.e2e.b.85390's home",
      createdBy: "sam",
      memberIds: ["sam"],
      members: { sam: { displayName: "pf.e2e.b.85390" } },
    });

    const result = await rename("  Sam ");

    expect(result).toEqual({ displayName: "Sam", householdName: "Sam's home" });
    expect(fake.store.get("Users/sam").displayName).toBe("Sam");
    expect(fake.store.get("Households/sam")).toMatchObject({
      name: "Sam's home",
      members: { sam: { displayName: "Sam" } },
    });
  });

  it("renames \"<old name>'s home\" when the old name was a real one", async () => {
    fake.store.set("Users/sam", { householdId: "sam", displayName: "Sam" });
    fake.store.set("Households/sam", {
      name: "Sam's home",
      createdBy: "sam",
      ...members("sam"),
      members: { sam: { displayName: "Sam" } },
    });
    expect(await rename("Sammy")).toEqual({
      displayName: "Sammy",
      householdName: "Sammy's home",
    });
  });

  it("keeps a household name when the caller didn't create the household or it was renamed", async () => {
    fake.store.set("Users/sam", { householdId: "kian", displayName: "Sam" });
    fake.store.set("Households/kian", {
      name: "Sam's home",
      createdBy: "kian",
      ...members("kian", "sam"),
    });
    // Same text as an automatic name, but Kian made the household.
    expect(await rename("Sammy")).toEqual({
      displayName: "Sammy",
      householdName: "Sam's home",
    });
    expect(fake.store.get("Households/kian").members.sam.displayName).toBe(
      "Sammy"
    );
    // Housemates' entries are untouched.
    expect(fake.store.get("Households/kian").members.kian.displayName).toBe(
      "kian"
    );

    fake.store.set("Users/kian", { householdId: "kian", displayName: "Kian" });
    fake.store.set("Households/kian", {
      name: "The Flat",
      createdBy: "kian",
      ...members("kian", "sam"),
    });
    expect(await rename("Kiano", "kian")).toMatchObject({
      householdName: "The Flat",
    });
  });

  it("updates just the profile before a household exists", async () => {
    expect(await rename("Sam")).toEqual({
      displayName: "Sam",
      householdName: null,
    });
    expect(fake.store.get("Users/sam")).toEqual({ displayName: "Sam" });
  });

  it.each([undefined, "", "   ", 5, "x".repeat(51)])(
    "rejects a bad name (%p)",
    async (name) => {
      await rejectsWith(rename(name), "invalid-argument");
    }
  );
});
