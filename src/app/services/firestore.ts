/**
 * firestore.ts
 *
 * Per-entity Firestore persistence for the app store.
 *
 * Before: the whole StoreState lived in ONE document (`appState/main`); every
 * read downloaded everything and every write re-uploaded everything.
 *
 * Now: each entity array maps to its own collection (doc id === entity id):
 *
 *   users / clubs / events / registrations / memberships / notifications /
 *   roleRequests
 *
 * - `subscribeStore` attaches one onSnapshot listener per collection and
 *   re-assembles the same StoreState shape the reducers in lib/store.ts
 *   expect, so no page or business-logic code changes. Snapshots arrive
 *   from the IndexedDB cache first (instant paint) and then from the server,
 *   giving real-time multi-user updates for free.
 * - `persistStoreDiff(prev, next)` diffs two store snapshots per entity and
 *   writes ONLY the added/changed/removed documents in a writeBatch.
 * - `migrateLegacyStore` copies a legacy `appState/main` snapshot into the
 *   collections (run once, automatically, by the first signed-in user).
 * - `fetchDocsByIds` batches point-reads with `documentId() in [...]` (30 ids
 *   per query) for future targeted queries.
 */
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  type DocumentData,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import type { StoreState } from "@/app/lib/store";
import { db, isFirebaseConfigured } from "@/app/lib/firebase";
import { createDemoStore, createEmptyStore } from "@/app/lib/storeHelpers";

// ─── Collections ─────────────────────────────────────────────────────────────

export type EntityKey = Exclude<keyof StoreState, "currentUserId">;

/** StoreState array key → Firestore collection name. */
export const ENTITY_COLLECTIONS: Record<EntityKey, string> = {
  users: "users",
  clubs: "clubs",
  events: "events",
  registrations: "registrations",
  memberships: "memberships",
  notifications: "notifications",
  roleRequests: "roleRequests",
};

export const ENTITY_KEYS = Object.keys(ENTITY_COLLECTIONS) as EntityKey[];

const LEGACY_COLLECTION = "appState";
const LEGACY_DOC = "main";

/** Firestore caps a batch at 500 operations; leave headroom. */
const BATCH_LIMIT = 450;
/** `in` queries accept at most 30 values. */
const IN_LIMIT = 30;

type Entity = { id: string };

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase not configured");
  }
  return db;
}

/** Strips undefined values so JSON comparison + Firestore writes are stable. */
function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// ─── Read: live subscription ─────────────────────────────────────────────────

export type StoreMode =
  /** Data is coming from the per-entity collections. */
  | "collections"
  /** Collections are empty; data came from the legacy appState/main doc (or
   *  the demo seed). Persist via whole-doc until migrated. */
  | "legacy";

export interface StoreSnapshot {
  store: StoreState;
  mode: StoreMode;
  /** True while the emission came purely from the local cache. */
  fromCache: boolean;
  /**
   * Collections this client is not allowed to read (signed-out visitor →
   * registrations/memberships/notifications/roleRequests). Their slices are
   * empty placeholders, NOT authoritative — never derive writes from them.
   */
  denied: EntityKey[];
}

/** Give up waiting for a first server response after this long (offline). */
const OFFLINE_TIMEOUT_MS = 10_000;

/**
 * Subscribes to every entity collection and emits an assembled StoreState
 * whenever any of them changes. The first emission waits until all
 * collections have delivered once (cache or server).
 *
 * Collections the current user is not allowed to read (see firestore.rules)
 * resolve to an empty array and are listed in `denied`. Because onSnapshot
 * listeners are terminal after an error, callers must re-subscribe when the
 * auth identity changes (Providers does this).
 */
export function subscribeStore(
  onChange: (snapshot: StoreSnapshot) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const database = requireDb();

  const slices: Partial<Record<EntityKey, Entity[]>> = {};
  const delivered = new Set<EntityKey>();
  const cacheOnly = new Set<EntityKey>();
  const denied = new Set<EntityKey>();
  let legacyChecked = false;
  let legacyStore: StoreState | null = null;
  let emitted = false;
  let disposed = false;

  // Offline first visit with an empty cache: Firestore delivers empty
  // cache-only snapshots and no error, so nothing below would ever emit.
  const offlineTimer = window.setTimeout(() => {
    if (disposed || emitted) return;
    onError(
      Object.assign(new Error("Firestore unreachable and no cached data"), {
        code: "unavailable",
      }),
    );
  }, OFFLINE_TIMEOUT_MS);

  const emit = () => {
    if (disposed || delivered.size !== ENTITY_KEYS.length) return;
    const store = createEmptyStore();
    let total = 0;
    for (const key of ENTITY_KEYS) {
      const rows = (slices[key] ?? []) as never[];
      (store as unknown as Record<EntityKey, unknown[]>)[key] = rows;
      total += rows.length;
    }
    const fromCache = cacheOnly.size > 0;
    const deniedList = Array.from(denied);

    if (total > 0) {
      emitted = true;
      onChange({ store, mode: "collections", fromCache, denied: deniedList });
      return;
    }

    // Nothing in the collections yet. Fall back to the legacy single doc
    // (or the demo seed on a brand-new project) until the migration runs.
    // Only decide this once we've heard from the server, otherwise an empty
    // offline cache would look like an empty database.
    if (fromCache) return;
    if (legacyChecked) {
      if (legacyStore) {
        emitted = true;
        onChange({ store: legacyStore, mode: "legacy", fromCache: false, denied: deniedList });
      }
      return;
    }
    legacyChecked = true;
    void getDoc(doc(database, LEGACY_COLLECTION, LEGACY_DOC))
      .then((snap) => {
        if (disposed) return;
        const data = snap.exists()
          ? (snap.data() as { store?: StoreState })
          : undefined;
        legacyStore = data?.store ?? createDemoStore();
        emitted = true;
        onChange({ store: legacyStore, mode: "legacy", fromCache: false, denied: deniedList });
      })
      .catch((err: unknown) => onError(err instanceof Error ? err : new Error(String(err))));
  };

  const unsubs: Unsubscribe[] = ENTITY_KEYS.map((key) =>
    onSnapshot(
      collection(database, ENTITY_COLLECTIONS[key]),
      (snap) => {
        slices[key] = snap.docs.map((d) => ({ ...(d.data() as Entity), id: d.id }));
        delivered.add(key);
        denied.delete(key);
        if (snap.metadata.fromCache) cacheOnly.add(key);
        else cacheOnly.delete(key);
        emit();
      },
      (error: FirestoreError) => {
        if (error.code === "permission-denied") {
          // Signed-out visitor hitting a protected collection: placeholder.
          slices[key] = [];
          delivered.add(key);
          denied.add(key);
          cacheOnly.delete(key);
          emit();
          return;
        }
        onError(error);
      },
    ),
  );

  return () => {
    disposed = true;
    window.clearTimeout(offlineTimer);
    for (const u of unsubs) u();
  };
}

// ─── Write: diff-based persistence ───────────────────────────────────────────

export interface DiffStats {
  sets: number;
  deletes: number;
}

/**
 * Computes the per-entity delta between two store snapshots and writes only
 * the changed documents. Slices whose array identity is unchanged are
 * skipped entirely (the reducers spread untouched slices through).
 */
export async function persistStoreDiff(
  prev: StoreState,
  next: StoreState,
): Promise<DiffStats> {
  const database = requireDb();
  const ops: Array<{ kind: "set" | "delete"; col: string; id: string; data?: DocumentData }> = [];

  for (const key of ENTITY_KEYS) {
    const before = prev[key] as unknown as Entity[];
    const after = next[key] as unknown as Entity[];
    if (before === after) continue;

    const col = ENTITY_COLLECTIONS[key];
    const beforeById = new Map(before.map((e) => [e.id, e]));
    const afterIds = new Set<string>();

    for (const item of after) {
      afterIds.add(item.id);
      const old = beforeById.get(item.id);
      const plain = toPlain(item);
      if (!old || JSON.stringify(toPlain(old)) !== JSON.stringify(plain)) {
        ops.push({ kind: "set", col, id: item.id, data: plain });
      }
    }
    for (const id of beforeById.keys()) {
      if (!afterIds.has(id)) ops.push({ kind: "delete", col, id });
    }
  }

  const stats: DiffStats = { sets: 0, deletes: 0 };
  if (ops.length === 0) return stats;

  for (const group of chunk(ops, BATCH_LIMIT)) {
    const batch = writeBatch(database);
    for (const op of group) {
      const ref = doc(database, op.col, op.id);
      if (op.kind === "set") {
        batch.set(ref, op.data!);
        stats.sets++;
      } else {
        batch.delete(ref);
        stats.deletes++;
      }
    }
    await batch.commit();
  }
  return stats;
}

// ─── Migration: appState/main → collections ──────────────────────────────────

/**
 * Writes every entity in `store` to its collection and stamps the legacy doc
 * so operators can see the migration happened. Idempotent — safe to run from
 * several clients; identical docs are simply overwritten with themselves.
 */
export async function migrateLegacyStore(store: StoreState): Promise<DiffStats> {
  const stats = await persistStoreDiff(createEmptyStore(), store);
  const database = requireDb();
  await setDoc(
    doc(database, LEGACY_COLLECTION, LEGACY_DOC),
    { migratedAt: serverTimestamp(), migratedEntities: stats.sets },
    { merge: true },
  ).catch(() => {
    /* stamping is best-effort */
  });
  return stats;
}

// ─── Batched point reads ─────────────────────────────────────────────────────

/**
 * Fetches many documents by id in ≤30-id `in` queries (Firestore's limit),
 * avoiding one round-trip per id. Use this instead of N `getDoc` calls when
 * a view needs, e.g., the User rows for a list of registrations.
 */
export async function fetchDocsByIds<T extends Entity>(
  key: EntityKey,
  ids: string[],
): Promise<T[]> {
  const database = requireDb();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return [];
  const col = collection(database, ENTITY_COLLECTIONS[key]);
  const results = await Promise.all(
    chunk(unique, IN_LIMIT).map((group) =>
      getDocs(query(col, where(documentId(), "in", group))),
    ),
  );
  return results.flatMap((snap) =>
    snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })),
  );
}
