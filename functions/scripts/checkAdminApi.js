/**
 * Calls everything ./admin.js exports against the real firebase-admin, so CI
 * fails if an SDK upgrade removes something the functions use. Makes no
 * network calls. Run by the "Functions" CI job: `node scripts/checkAdminApi.js`.
 */
const admin = require("../admin");

admin.initializeApp({ projectId: "demo-check-admin-api" });

const checks = {
  "db()": () => typeof admin.db().collection === "function",
  "db().bulkWriter()": () => typeof admin.db().bulkWriter === "function",
  "db().recursiveDelete()": () => typeof admin.db().recursiveDelete === "function",
  "auth().deleteUser": () => typeof admin.auth().deleteUser === "function",
  "auth().getUserByEmail": () => typeof admin.auth().getUserByEmail === "function",
  "Timestamp.fromMillis()": () => admin.Timestamp.fromMillis(1000).toMillis() === 1000,
  "FieldValue.serverTimestamp()": () => Boolean(admin.FieldValue.serverTimestamp()),
  "FieldValue.delete()": () => Boolean(admin.FieldValue.delete()),
  "FieldValue.arrayUnion()": () => Boolean(admin.FieldValue.arrayUnion("x")),
  "FieldValue.arrayRemove()": () => Boolean(admin.FieldValue.arrayRemove("x")),
};

const failed = Object.entries(checks).filter(([, check]) => {
  try {
    return !check();
  } catch {
    return true;
  }
});

if (failed.length > 0) {
  console.error(`::error::firebase-admin is missing: ${failed.map(([name]) => name).join(", ")}`);
  process.exit(1);
}
console.log(`firebase-admin API OK (${Object.keys(checks).length} checks).`);
