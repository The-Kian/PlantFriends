const path = require("path");

const { indexRequests } = require("./deployFirestoreIndexes");
const config = require(path.join(__dirname, "../../firestore.indexes.json"));

describe("indexRequests", () => {
  it("adds the collection-group index on Plants.notify_at that reminders query", () => {
    const requests = indexRequests(config, "demo");
    const field = requests.find((r) => r.url.includes("/fields/notify_at"));

    expect(field.method).toBe("PATCH");
    expect(field.url).toBe(
      "https://firestore.googleapis.com/v1/projects/demo/databases/(default)/collectionGroups/Plants/fields/notify_at?updateMask=indexConfig",
    );
    expect(field.body.indexConfig.indexes).toContainEqual({
      queryScope: "COLLECTION_GROUP",
      fields: [{ fieldPath: "notify_at", order: "ASCENDING" }],
    });
    // The overrides replace the field's defaults, so the ascending and
    // descending ones are kept. Nothing queries notify_at with array-contains,
    // so that index is gone.
    expect(field.body.indexConfig.indexes).toContainEqual({
      queryScope: "COLLECTION",
      fields: [{ fieldPath: "notify_at", order: "ASCENDING" }],
    });
    expect(JSON.stringify(field.body)).not.toContain("CONTAINS");
  });

  it("creates composite indexes, tolerating ones that exist", () => {
    const [request] = indexRequests(
      {
        indexes: [
          {
            collectionGroup: "Plants",
            queryScope: "COLLECTION_GROUP",
            fields: [
              { fieldPath: "a", order: "ASCENDING" },
              { fieldPath: "b", order: "DESCENDING" },
            ],
          },
        ],
      },
      "demo",
    );
    expect(request).toMatchObject({ method: "POST", okIfExists: true });
    expect(request.url).toMatch(/collectionGroups\/Plants\/indexes$/);
    expect(request.body.queryScope).toBe("COLLECTION_GROUP");
  });
});
