/**
 * stateService.ts  (LEGACY)
 *
 * Whole-snapshot persistence to the single Firestore document
 * `appState/main`. Superseded by `services/firestore.ts`, which stores each
 * entity in its own collection and writes only what changed.
 *
 * Kept only as the write-path fallback used by Providers when the one-time
 * migration into per-entity collections fails (e.g. offline on first login).
 * Reading the legacy document is handled inside `subscribeStore`.
 */
import { doc, setDoc } from "firebase/firestore";
import type { StoreState } from "@/app/lib/store";
import { db, isFirebaseConfigured } from "@/app/lib/firebase";

export interface AppStateSnapshot {
  store: StoreState;
  currentUserId: string | null;
}

const APP_STATE_COLLECTION = "appState";
const APP_STATE_DOC = "main";

/** Strips undefined values so Firestore accepts the snapshot cleanly. */
function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Persists the whole app state snapshot to Firestore (legacy fallback). */
export async function persistAppState(
  snapshot: AppStateSnapshot,
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase not configured");
  }
  await setDoc(doc(db, APP_STATE_COLLECTION, APP_STATE_DOC), toPlain(snapshot));
}
