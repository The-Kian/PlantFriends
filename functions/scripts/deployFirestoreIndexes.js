/**
 * Publishes firestore.indexes.json to the project the service account
 * belongs to. Run by the "Deploy Firestore rules" GitHub workflow.
 *
 * Like deployFirestoreRules.js it avoids `firebase deploy`, and calls the
 * Firestore Admin REST API directly. Only adds and updates: an index removed
 * from the file is left in place (delete it in the console).
 *
 * Index builds run in the background and can take a few minutes; until the
 * notify_at one is ready, sendWateringReminders logs a FAILED_PRECONDITION.
 *
 * Env: FIREBASE_SERVICE_ACCOUNT (the service account key JSON). It needs the
 * Firebase Admin (or Cloud Datastore Index Admin) role.
 * Arg: path to firestore.indexes.json.
 */
const fs = require("fs");

const API = "https://firestore.googleapis.com/v1";

/** The REST calls that make the project match `config`. Pure, for tests. */
function indexRequests(config, projectId) {
  const base = `${API}/projects/${projectId}/databases/(default)/collectionGroups`;
  const requests = [];

  for (const index of config.indexes || []) {
    requests.push({
      method: "POST",
      url: `${base}/${encodeURIComponent(index.collectionGroup)}/indexes`,
      body: { queryScope: index.queryScope || "COLLECTION", fields: index.fields },
      okIfExists: true,
    });
  }

  for (const override of config.fieldOverrides || []) {
    const indexes = (override.indexes || []).map(({ queryScope, ...field }) => ({
      queryScope: queryScope || "COLLECTION",
      fields: [{ fieldPath: override.fieldPath, ...field }],
    }));
    requests.push({
      method: "PATCH",
      url:
        `${base}/${encodeURIComponent(override.collectionGroup)}/fields/` +
        `${encodeURIComponent(override.fieldPath)}?updateMask=indexConfig`,
      body: { indexConfig: { indexes } },
      okIfExists: false,
    });
  }
  return requests;
}

async function main() {
  const configPath = process.argv[2];
  if (!configPath) throw new Error("Pass the path to firestore.indexes.json.");
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error("The FIREBASE_SERVICE_ACCOUNT secret isn't set. See functions/README.md.");
  }
  const admin = require("firebase-admin");
  const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const { access_token: token } = await admin.credential.cert(credentials).getAccessToken();

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  for (const request of indexRequests(config, credentials.project_id)) {
    const res = await fetch(request.url, {
      method: request.method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(request.body),
    });
    if (res.status === 409 && request.okIfExists) {
      console.log(`Already there: ${request.url}`);
      continue;
    }
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`${request.method} ${request.url} failed with ${res.status}: ${detail}`);
    }
    console.log(`Requested: ${request.method} ${request.url}`);
  }
  console.log(`Published ${configPath} to ${credentials.project_id}. Index builds run in the background.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`::error::${error.message}`);
    process.exit(1);
  });
}

module.exports = { indexRequests };
