/**
 * scripts/migrate-appstate.mjs
 *
 * One-time migration of the legacy single-document snapshot
 * `appState/main` → per-entity collections (users, clubs, events,
 * registrations, memberships, notifications, roleRequests).
 *
 * The app performs this migration automatically the first time a signed-in
 * @iub.edu.bd user loads it after deploy (see Providers.tsx). Use this script
 * instead when you'd rather migrate from the CLI with admin credentials.
 *
 * Prerequisites
 *   1. A service-account key for the Firebase project:
 *      Firebase console → Project settings → Service accounts → Generate key
 *   2. export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
 *      (PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\key.json")
 *
 * Usage
 *   node scripts/migrate-appstate.mjs [--project iub-event-management] [--dry-run] [--purge-legacy]
 *
 *   --dry-run        Print what would be written; write nothing.
 *   --purge-legacy   After a successful copy, delete appState/main.
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const args = new Set(process.argv.slice(2));
const projectIdx = process.argv.indexOf("--project");
const projectId =
  projectIdx !== -1 ? process.argv[projectIdx + 1] : process.env.GCLOUD_PROJECT ?? "iub-event-management";
const dryRun = args.has("--dry-run");
const purgeLegacy = args.has("--purge-legacy");

const ENTITY_COLLECTIONS = {
  users: "users",
  clubs: "clubs",
  events: "events",
  registrations: "registrations",
  memberships: "memberships",
  notifications: "notifications",
  roleRequests: "roleRequests",
};
const BATCH_LIMIT = 450;

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const legacyRef = db.doc("appState/main");
const legacySnap = await legacyRef.get();
if (!legacySnap.exists) {
  console.error("appState/main does not exist — nothing to migrate.");
  process.exit(1);
}

const { store } = legacySnap.data();
if (!store) {
  console.error("appState/main has no `store` field.");
  process.exit(1);
}

let batch = db.batch();
let pending = 0;
let total = 0;

async function flush() {
  if (pending === 0) return;
  if (!dryRun) await batch.commit();
  batch = db.batch();
  pending = 0;
}

for (const [key, colName] of Object.entries(ENTITY_COLLECTIONS)) {
  const rows = Array.isArray(store[key]) ? store[key] : [];
  console.log(`${colName.padEnd(14)} ${rows.length} docs`);
  for (const row of rows) {
    if (!row?.id) continue;
    batch.set(db.collection(colName).doc(String(row.id)), JSON.parse(JSON.stringify(row)));
    pending++;
    total++;
    if (pending >= BATCH_LIMIT) await flush();
  }
}
await flush();

if (!dryRun) {
  if (purgeLegacy) {
    await legacyRef.delete();
    console.log("Deleted appState/main.");
  } else {
    await legacyRef.set(
      { migratedAt: FieldValue.serverTimestamp(), migratedEntities: total },
      { merge: true },
    );
  }
}

console.log(`${dryRun ? "[dry-run] would write" : "Wrote"} ${total} documents to ${projectId}.`);
