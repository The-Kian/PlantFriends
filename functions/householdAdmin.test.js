const { displayNameFor, linkWrites, moveWrites, unlinkWrites } = require("./householdAdmin");

const household = {
  memberIds: ["kian"],
  members: { kian: { displayName: "Kian" } },
};
const plants = [
  { id: "monstera", data: { addedBy: "kian", carerIds: ["kian"], shared: false } },
  { id: "pothos", data: { addedBy: "kian", carerIds: ["kian"], shared: true } },
];

describe("displayNameFor", () => {
  it("prefers the display name, then the start of the email", () => {
    expect(displayNameFor({ displayName: "Sam", email: "sam@example.com" })).toBe("Sam");
    expect(displayNameFor({ email: "sam@example.com" })).toBe("sam");
  });
});

describe("linkWrites", () => {
  it("adds the housemate to the household and to shared plants only", () => {
    const writes = linkWrites({ householdId: "kian", household, plants, uid: "sam", name: "Sam" });

    expect(writes.household).toEqual({
      memberIds: ["kian", "sam"],
      members: { kian: { displayName: "Kian" }, sam: { displayName: "Sam" } },
    });
    expect(writes.plantUpdates).toEqual([
      { id: "pothos", update: { carerIds: ["kian", "sam"] } },
    ]);
    expect(writes.user).toEqual({ householdId: "kian" });
  });

  it("does nothing for someone already in the household", () => {
    expect(linkWrites({ householdId: "kian", household, plants, uid: "kian", name: "Kian" })).toBeNull();
  });
});

describe("unlinkWrites", () => {
  const shared = {
    memberIds: ["kian", "sam"],
    members: { kian: { displayName: "Kian" }, sam: { displayName: "Sam" } },
  };

  it("removes the housemate and hands their own plants to the others", () => {
    const writes = unlinkWrites({
      household: shared,
      plants: [
        { id: "pothos", data: { carerIds: ["kian", "sam"], shared: true } },
        { id: "fern", data: { addedBy: "sam", carerIds: ["sam"], shared: false } },
        { id: "cactus", data: { addedBy: "kian", carerIds: ["kian"] } },
      ],
      uid: "sam",
    });

    expect(writes.household).toEqual({
      memberIds: ["kian"],
      members: { kian: { displayName: "Kian" } },
    });
    expect(writes.plantUpdates).toEqual([
      { id: "pothos", update: { carerIds: ["kian"] } },
      { id: "fern", update: { carerIds: ["kian"], shared: true } },
    ]);
    expect(writes.clearUserHousehold).toBe(true);
  });

  it("passes the household to the longest-standing member when its creator goes", () => {
    const writes = unlinkWrites({
      household: { ...shared, memberIds: ["kian", "sam", "alex"], createdBy: "kian" },
      plants: [],
      uid: "kian",
    });
    expect(writes.household.createdBy).toBe("sam");
  });

  it("won't remove the last member", () => {
    expect(() => unlinkWrites({ household, plants, uid: "kian" })).toThrow();
  });

  it("does nothing for someone not in the household", () => {
    expect(unlinkWrites({ household, plants, uid: "sam" })).toBeNull();
  });
});

describe("moveWrites", () => {
  it("keeps each plant and makes it personal to the person moving", () => {
    const moved = moveWrites({
      plants: [
        {
          id: "pothos",
          data: { plantId: "p1", addedBy: "old", userId: "old", carerIds: ["old", "x"], shared: true, custom_name: "Polly" },
        },
        { id: "fern", data: { addedBy: "sam" } },
      ],
      uid: "sam",
    });

    expect(moved).toEqual([
      {
        id: "pothos",
        data: { plantId: "p1", custom_name: "Polly", addedBy: "sam", userId: "sam", carerIds: ["sam"], shared: false },
      },
      { id: "fern", data: { addedBy: "sam", userId: "sam", carerIds: ["sam"], shared: false } },
    ]);
  });

  it("does nothing when there are no plants", () => {
    expect(moveWrites({ plants: [], uid: "sam" })).toEqual([]);
  });
});
