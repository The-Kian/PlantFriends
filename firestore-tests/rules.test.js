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

  test("members can read, add, edit and delete", async () => {
    await assertSucceeds(getDoc(p(BOB)));
    await assertSucceeds(setDoc(p(BOB, "p2"), plant({ id: "p2", addedBy: BOB, carerIds: [BOB] })));
    await assertSucceeds(updateDoc(p(BOB), { custom_notes: "Likes shade" }));
    await assertSucceeds(
      updateDoc(p(BOB), {
        last_watered_date: Date.now(),
        next_watering_date: Date.now() + 1,
        last_watered_by: BOB,
        last_watered_by_name: "Bob",
      }),
    );
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
    await assertFails(updateDoc(p(BOB), { addedBy: BOB }));
  });

  test("clients can't write notify_at or notify_stage", async () => {
    await assertFails(setDoc(p(ALICE, "p2"), plant({ notify_at: 1 })));
    await assertFails(setDoc(p(ALICE, "p2"), plant({ notify_stage: "due" })));
    await assertFails(updateDoc(p(ALICE), { notify_at: 1 }));
    await assertFails(updateDoc(p(ALICE), { notify_stage: "nudge" }));
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
