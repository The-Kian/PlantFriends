/**
 * Publishes firestore.rules to the project the service account belongs to.
 * Run by the "Deploy Firestore rules" GitHub workflow.
 *
 * Uses the Admin SDK's security rules API rather than `firebase deploy`,
 * which first checks the Firestore API is enabled and needs a permission
 * (Service Usage) that the Firebase Admin SDK service account doesn't have.
 *
 * Env: FIREBASE_SERVICE_ACCOUNT (the service account key JSON).
 * Arg: path to the rules file.
 */
const fs = require("fs");

const admin = require("firebase-admin");

async function main() {
  const rulesPath = process.argv[2];
  if (!rulesPath) throw new Error("Pass the path to firestore.rules.");
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error("The FIREBASE_SERVICE_ACCOUNT secret isn't set. See functions/README.md.");
  }

  const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
    projectId: credentials.project_id,
  });

  const source = fs.readFileSync(rulesPath, "utf8");
  const ruleset = await admin.securityRules().releaseFirestoreRulesetFromSource(source);
  console.log(`Published ${rulesPath} to ${credentials.project_id} (ruleset ${ruleset.name}).`);
}

main().catch((error) => {
  console.error(`::error::${error.message}`);
  process.exit(1);
});
