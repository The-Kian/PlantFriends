// Tests for firestore.rules. Run with `npm test` in this folder; it starts
// the Firestore emulator (needs Java) and runs these with node:test.
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { before, after, beforeEach, describe, test } = require("node:test");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  setLogLevel,
} = require("firebase/firestore");

const ALICE = "alice";
const BOB = "bob"; // Alice's housemate
const EVE = "eve"; // not in the household

let env;

const db = (uid) =>
  uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();

const plant = (extra = {}) => ({
  id: "p1",
  plantId: "monstera",
  custom_name: "Monty",
  addedBy: ALICE,
  userId: ALICE,
  carerIds: [ALICE],
  shared: false,
  ...extra,
});

setLogLevel("silent");

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-plantfriends",
    firestore: {
      rules: readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8"),
    },
  });
});

after(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const admin = ctx.firestore();
    await setDoc(doc(admin, "Households/h1"), {
      name: "Flat",
      memberIds: [ALICE, BOB],
      members: { [ALICE]: { displayName: "Alice" }, [BOB]: { displayName: "Bob" } },
      createdBy: ALICE,
    });
    await setDoc(doc(admin, "Households/h1/Plants/p1"), plant());
    await setDoc(doc(admin, "Users/alice"), { householdId: "h1" });
    await setDoc(doc(admin, "Users/alice/Devices/tok"), { expoPushToken: "tok" });
    await setDoc(doc(admin, "Plants/monstera"), { id: "monstera", name: "Monstera" });
    await setDoc(doc(admin, "AnonymousPlants/a1"), { plantId: "monstera" });
    await setDoc(doc(admin, "Invites/i1"), { householdId: "h1" });
  });
});

describe("Users", () => {
  test("can read and write your own profile and devices", async () => {
    await assertSucceeds(getDoc(doc(db(ALICE), "Users/alice")));
    await assertSucceeds(setDoc(doc(db(ALICE), "Users/alice"), { a: 1 }, { merge: true }));
    await assertSucceeds(getDoc(doc(db(ALICE), "Users/alice/Devices/tok")));
  });

  test("can write every key the app writes except householdId", async () => {
    const ref = doc(db(ALICE), "Users/alice");
    await assertSucceeds(setDoc(ref, { displayName: "Alice", email: "a@example.com" }, { merge: true }));
    await assertSucceeds(setDoc(ref, { timeZone: "Europe/London" }, { merge: true }));
    await assertSucceeds(setDoc(ref, { notificationPrefs: { reminders: false } }, { merge: true }));
    await assertSucceeds(setDoc(ref, { plantsMigratedAt: Date.now() }, { merge: true }));
    // Writing the value it already has is not a change.
    await assertSucceeds(setDoc(ref, { householdId: "h1" }, { merge: true }));
  });

  test("can't change householdId, except to a household of their own they're alone in", async () => {
    // Setting up the first time: create the household, then point at it.
    const eveHome = { name: "Eve's home", memberIds: [EVE], members: {}, createdBy: EVE };
    await assertSucceeds(setDoc(doc(db(EVE), "Households/eve"), eveHome));
    await assertSucceeds(setDoc(doc(db(EVE), "Users/eve"), { householdId: "eve" }, { merge: true }));
    await assertSucceeds(
      setDoc(doc(db(EVE), "Users/eve"), { displayName: "Eve", householdId: "eve" }, { merge: true }),
    );

    // Pointing at someone else's household (to read it, or join without a code).
    await assertFails(setDoc(doc(db(EVE), "Users/eve"), { householdId: "h1" }, { merge: true }));
    await assertFails(updateDoc(doc(db(EVE), "Users/eve"), { householdId: "h1" }));
    // At a household that doesn't exist, or isn't a string, or is removed.
    await assertFails(updateDoc(doc(db(EVE), "Users/eve"), { householdId: "nowhere" }));
    await assertFails(updateDoc(doc(db(EVE), "Users/eve"), { householdId: 5 }));
    await assertFails(updateDoc(doc(db(EVE), "Users/eve"), { householdId: null }));
    await assertFails(updateDoc(doc(db(EVE), "Users/eve"), { householdId: deleteField() }));
  });

  test("a member of a shared household can't switch to a different one", async () => {
    await assertFails(updateDoc(doc(db(ALICE), "Users/alice"), { householdId: "h1x" }));
    // Not even a "solo" household that isn't theirs.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "Households/zed"), {
        name: "Zed's", memberIds: ["zed"], members: {}, createdBy: "zed",
      });
    });
    await assertFails(updateDoc(doc(db(ALICE), "Users/alice"), { householdId: "zed" }));
  });

  test("a new profile can't be created pointing at someone else's household", async () => {
    await assertFails(setDoc(doc(db(EVE), "Users/eve"), { householdId: "h1" }));
    await assertSucceeds(setDoc(doc(db(EVE), "Users/eve"), { displayName: "Eve" }));
  });

  test("can't read or write someone else's profile or devices", async () => {
    await assertFails(getDoc(doc(db(BOB), "Users/alice")));
    await assertFails(setDoc(doc(db(BOB), "Users/alice"), { a: 1 }));
    await assertFails(getDoc(doc(db(BOB), "Users/alice/Devices/tok")));
    await assertFails(setDoc(doc(db(BOB), "Users/alice/Devices/x"), { a: 1 }));
    await assertFails(getDoc(doc(db(null), "Users/alice")));
  });
});

describe("Households", () => {
  test("members can read; others can't", async () => {
    await assertSucceeds(getDoc(doc(db(BOB), "Households/h1")));
    await assertFails(getDoc(doc(db(EVE), "Households/h1")));
    await assertFails(getDoc(doc(db(null), "Households/h1")));
  });

  test("you can check whether your own household exists", async () => {
    await assertSucceeds(getDoc(doc(db(EVE), "Households/eve")));
  });

  test("you can create only your own solo household", async () => {
    const own = { name: "Mine", memberIds: [EVE], members: {}, createdBy: EVE };
    await assertSucceeds(setDoc(doc(db(EVE), "Households/eve"), own));
    await assertFails(setDoc(doc(db(EVE), "Households/other"), own));
    await assertFails(
      setDoc(doc(db(EVE), "Households/eve"), { ...own, memberIds: [EVE, ALICE] }),
    );
  });

  test("members can rename but not change members", async () => {
    await assertSucceeds(updateDoc(doc(db(BOB), "Households/h1"), { name: "Home" }));
    await assertFails(updateDoc(doc(db(BOB), "Households/h1"), { memberIds: [BOB] }));
    await assertFails(
      updateDoc(doc(db(BOB), "Households/h1"), { memberIds: [ALICE, BOB, EVE] }),
    );
    await assertFails(
      updateDoc(doc(db(BOB), "Households/h1"), { "members.eve": { displayName: "Eve" } }),
    );
    await assertFails(updateDoc(doc(db(BOB), "Households/h1"), { createdBy: BOB }));
  });

  test("non-members can't write; nobody can delete", async () => {
    await assertFails(updateDoc(doc(db(EVE), "Households/h1"), { name: "Mine" }));
    await assertFails(deleteDoc(doc(db(ALICE), "Households/h1")));
  });
});

describe("Household plants", () => {
  const p = (uid, id = "p1") => doc(db(uid), `Households/h1/Plants/${id}`);

  const watering = () => ({
    last_watered_date: Date.now(),
    next_watering_date: Date.now() + 1,
    last_watered_by: BOB,
    last_watered_by_name: "Bob",
  });

  // p1 is Alice's personal plant; "shared" is looked after by both of them;
  // "bobs" is Bob's personal plant.
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const admin = ctx.firestore();
      await setDoc(
        doc(admin, "Households/h1/Plants/shared"),
        plant({ id: "shared", shared: true, carerIds: [ALICE, BOB] }),
      );
      await setDoc(
        doc(admin, "Households/h1/Plants/bobs"),
        plant({ id: "bobs", addedBy: BOB, userId: BOB, carerIds: [BOB] }),
      );
    });
  });

  test("members can read, add, edit and delete their own plants", async () => {
    await assertSucceeds(getDoc(p(BOB)));
    await assertSucceeds(setDoc(p(BOB, "p2"), plant({ id: "p2", addedBy: BOB, carerIds: [BOB] })));
    await assertSucceeds(updateDoc(p(BOB, "bobs"), { custom_notes: "Likes shade" }));
    await assertSucceeds(updateDoc(p(BOB, "bobs"), watering()));
    await assertSucceeds(deleteDoc(p(BOB, "bobs")));
  });

  test("a housemate can't edit or delete someone's personal plant", async () => {
    await assertFails(updateDoc(p(BOB), { custom_notes: "Likes shade" }));
    await assertFails(updateDoc(p(BOB), { custom_name: "Mine now" }));
    await assertFails(updateDoc(p(BOB), { shared: true, carerIds: [ALICE, BOB] }));
    await assertFails(updateDoc(p(BOB), { carerIds: [ALICE, BOB] }));
    await assertFails(deleteDoc(p(BOB)));
    // Not even to log a watering: it isn't shared with them.
    await assertFails(updateDoc(p(BOB), watering()));
    // The owner still can.
    await assertSucceeds(updateDoc(p(ALICE), { custom_notes: "Likes shade" }));
    await assertSucceeds(deleteDoc(p(ALICE)));
  });

  test("any member can log a watering on a shared plant, and nothing else", async () => {
    await assertSucceeds(updateDoc(p(BOB, "shared"), watering()));
    await assertSucceeds(updateDoc(p(BOB, "shared"), { last_watered_date: Date.now() }));
    await assertSucceeds(updateDoc(p(BOB, "shared"), { next_watering_date: null }));
  });

  test("a carer can edit a shared plant they look after", async () => {
    await assertSucceeds(updateDoc(p(BOB, "shared"), { custom_notes: "Bright spot" }));
    await assertSucceeds(updateDoc(p(ALICE, "shared"), { custom_notes: "Bright spot" }));
  });

  test("a member who isn't a carer of a shared plant can only log waterings", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      // Bob joined, so he's a member, but nothing has added him as a carer yet.
      await setDoc(
        doc(ctx.firestore(), "Households/h1/Plants/shared"),
        plant({ id: "shared", shared: true, carerIds: [ALICE] }),
      );
    });
    await assertSucceeds(updateDoc(p(BOB, "shared"), watering()));
    await assertFails(updateDoc(p(BOB, "shared"), { custom_notes: "x" }));
    await assertFails(updateDoc(p(BOB, "shared"), { custom_name: "x" }));
    await assertFails(updateDoc(p(BOB, "shared"), { shared: false }));
    await assertFails(updateDoc(p(BOB, "shared"), { carerIds: [ALICE, BOB] }));
    await assertFails(updateDoc(p(BOB, "shared"), { ...watering(), custom_notes: "x" }));
  });

  test("a shared plant can be deleted by any member; a personal one only by its adder or a carer", async () => {
    await assertSucceeds(deleteDoc(p(BOB, "shared")));
    await assertFails(deleteDoc(p(BOB, "p1")));
    await assertFails(deleteDoc(p(ALICE, "bobs")));
    // The adder can always delete, even if no longer listed as a carer.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), "Households/h1/Plants/odd"),
        plant({ id: "odd", carerIds: [BOB] }),
      );
    });
    await assertSucceeds(deleteDoc(p(ALICE, "odd")));
  });

  test("a carer of a personal plant can delete and edit it", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), "Households/h1/Plants/p1"),
        plant({ carerIds: [ALICE, BOB] }),
      );
    });
    await assertSucceeds(updateDoc(p(BOB), { custom_notes: "I water this one" }));
    await assertSucceeds(deleteDoc(p(BOB)));
  });

  test("non-members can't read or write", async () => {
    await assertFails(getDoc(p(EVE)));
    await assertFails(setDoc(p(EVE, "p2"), plant({ addedBy: EVE, carerIds: [] })));
    await assertFails(updateDoc(p(EVE), { custom_name: "Mine" }));
    await assertFails(deleteDoc(p(EVE)));
  });

  test("addedBy must be you and can't change", async () => {
    await assertFails(setDoc(p(BOB, "p2"), plant({ addedBy: ALICE })));
    await assertFails(updateDoc(p(BOB, "bobs"), { addedBy: ALICE }));
    await assertFails(updateDoc(p(BOB, "shared"), { addedBy: BOB }));
  });

  test("clients can't write the notify_* fields", async () => {
    for (const [key, value] of [
      ["notify_at", 1],
      ["notify_stage", "due"],
      ["notify_for", 1],
      ["notify_lease", 1],
      ["notify_sending", "due"],
    ]) {
      await assertFails(setDoc(p(ALICE, "p2"), plant({ [key]: value })));
      await assertFails(updateDoc(p(ALICE), { [key]: value }));
    }
  });

  test("carerIds can only include members", async () => {
    await assertSucceeds(updateDoc(p(ALICE), { carerIds: [ALICE, BOB] }));
    await assertFails(updateDoc(p(ALICE), { carerIds: [ALICE, EVE] }));
    await assertFails(setDoc(p(ALICE, "p2"), plant({ carerIds: [EVE] })));
  });

  test("fields have the right types and lengths", async () => {
    await assertFails(updateDoc(p(ALICE), { custom_name: "x".repeat(101) }));
    await assertFails(updateDoc(p(ALICE), { custom_name: 5 }));
    await assertFails(updateDoc(p(ALICE), { custom_notes: "x".repeat(2001) }));
    await assertFails(updateDoc(p(ALICE), { last_watered_date: "yesterday" }));
    await assertFails(updateDoc(p(ALICE), { next_watering_date: true }));
    await assertFails(updateDoc(p(ALICE), { date_added: "today" }));
    await assertFails(updateDoc(p(ALICE), { shared: "yes" }));
    await assertFails(setDoc(p(ALICE, "p2"), plant({ location: "x".repeat(101) })));
    await assertSucceeds(updateDoc(p(ALICE), { next_watering_date: null }));
  });
});

describe("Catalog plants", () => {
  const c = (uid, id = "new") => doc(db(uid), `Plants/${id}`);

  test("signed-in users can read and add a well-formed plant", async () => {
    await assertSucceeds(getDoc(c(EVE, "monstera")));
    await assertFails(getDoc(c(null, "monstera")));
    await assertSucceeds(
      setDoc(c(EVE), {
        id: "new",
        name: "Fern",
        slug: "fern",
        scientific_name: ["Nephrolepis exaltata"],
        common_names: [],
        images: ["https://example.com/fern.jpg"],
        watering_frequency: 3,
        isVerified: false,
        contributed_by: "Eve",
        contributedBy: "Trefle API",
      }),
    );
    await assertSucceeds(setDoc(c(EVE, "sci"), { scientific_name: ["Ficus"] }));
  });

  test("rejects junk", async () => {
    await assertFails(setDoc(c(null), { name: "Fern" }));
    await assertFails(setDoc(c(EVE), {}));
    await assertFails(setDoc(c(EVE), { name: "" }));
    await assertFails(setDoc(c(EVE), { name: "Fern", junk: "x" }));
    await assertFails(setDoc(c(EVE), { name: "x".repeat(201) }));
    await assertFails(setDoc(c(EVE), { name: "Fern", description: "x".repeat(2001) }));
    await assertFails(setDoc(c(EVE), { name: "Fern", images: Array(21).fill("x") }));
    await assertFails(setDoc(c(EVE), { name: "Fern", watering_frequency: "often" }));
    await assertFails(setDoc(c(EVE), { name: "Fern", id: "other" }));
    // Clients can't mark their own contribution as verified.
    await assertFails(setDoc(c(EVE), { name: "Fern", isVerified: true }));
  });

  test("can't be edited or deleted", async () => {
    await assertFails(updateDoc(c(EVE, "monstera"), { name: "Mine" }));
    await assertFails(deleteDoc(c(EVE, "monstera")));
  });
});

describe("Closed collections", () => {
  test("AnonymousPlants, Invites, RateLimits and PushTickets are closed", async () => {
    for (const path of [
      "AnonymousPlants/a1",
      "Invites/i1",
      "RateLimits/searchPlants_alice",
      "PushTickets/t1",
    ]) {
      await assertFails(getDoc(doc(db(ALICE), path)));
      await assertFails(setDoc(doc(db(ALICE), path), { a: 1 }));
    }
  });
});
