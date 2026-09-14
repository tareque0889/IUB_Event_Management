# ADR-0001: Use Per-Entity Firestore Collections for Store Persistence

- **Date**: 2026-09-14
- **Status**: Accepted
- **Deciders**: IUB Event Management maintainers
- **Tags**: firestore, persistence, scalability, migration

## Context and Problem Statement

The original Firebase persistence model stored the entire `StoreState` snapshot in
one document, `appState/main`. Every read downloaded users, clubs, events,
registrations, memberships, notifications and role requests, and every write
rewrote the same large blob. That model was simple, but it made Firestore's 1 MiB
document limit a near-term scaling risk and prevented per-collection rules,
indexes and incremental writes.

At the same time, the React app already had about forty pure reducer-style
operations in `src/app/lib/store.ts`, and pages were written against one
in-memory `StoreState`. A storage change needed to avoid rewriting every route
or moving all business logic to server-side transactions.

## Decision Drivers

- Remove the 1 MiB single-document ceiling for normal growth.
- Keep the existing `StoreState` shape and client reducers unchanged.
- Preserve live multi-user updates and offline-first page loads.
- Write only changed entities rather than the whole application state.
- Enable collection-specific rules and composite indexes.
- Provide a safe migration path from existing `appState/main` data.

## Considered Options

- Keep `appState/main` and add more client caching.
- Rewrite views to per-query Firestore reads with TanStack Query and pagination.
- Split the snapshot into per-entity Firestore collections while preserving the
  in-memory `StoreState`.

## Decision Outcome

Chosen option: **"Split the snapshot into per-entity Firestore collections while
preserving the in-memory StoreState"**, because it removes the largest scaling
and rules limitations while keeping the UI and reducer layer stable.

Each StoreState array now maps to its own collection: `users`, `clubs`, `events`,
`registrations`, `memberships`, `notifications` and `roleRequests`. Document ids
match entity ids. `subscribeStore` attaches one `onSnapshot` listener per
collection, assembles the same `StoreState` shape in memory and uses the
IndexedDB `persistentLocalCache` for fast repeat visits and offline support.

Writes go through `persistStoreDiff(prev, next)`, which compares entity arrays,
skips unchanged slices and commits changed or deleted documents in `writeBatch`
chunks. `migrateLegacyStore` copies the legacy snapshot into collections during
the first signed-in session, and `scripts/migrate-appstate.mjs` provides an
admin CLI alternative.

### Positive Consequences

- Reads now scale by collection instead of by one ever-growing document.
- Writes are O(changed documents) instead of O(whole application state).
- Composite indexes can target hot collection queries.
- Firestore rules can now differ for public and private collections.
- Existing reducers, selectors and pages continue to consume one `StoreState`.
- Migration is automatic for deployed data and repeatable from the CLI.

### Negative Consequences

- The client still loads whole collections; pagination is a follow-up once a
  collection, especially `events`, grows beyond roughly 500 documents.
- The app owns listener coordination and must re-attach listeners whenever the
  Firebase Auth identity changes, because denied `onSnapshot` listeners are
  terminal.
- Client-side assembly means the app still receives broader data than many views
  need until targeted queries replace some collection listeners.

## Pros and Cons of the Options

### Keep `appState/main` and add caching

- ✅ Smallest code change.
- ✅ Preserves all existing reducers and page assumptions.
- ❌ Caching does not avoid the 1 MiB document limit.
- ❌ Every successful write still rewrites unrelated data.
- ❌ Security rules remain coarse because all entities share one blob.

### Rewrite views to per-query Firestore reads with TanStack Query and pagination

- ✅ Best long-term read efficiency for large collections.
- ✅ Lets each screen fetch only the data it needs.
- ❌ Touches nearly every page and data access path.
- ❌ Reducers would need to become transactions, Cloud Functions or equivalent
  server-side mutation handlers.
- ❌ Too much change for the migration step.

### Split snapshot into per-entity Firestore collections ✅ Chosen

- ✅ Removes the single-document limit and enables per-collection indexes/rules.
- ✅ Keeps the `StoreState` contract for UI and business logic.
- ✅ Diffed batches make common writes proportional to actual changes.
- ❌ Still loads complete collections until paginated queries are introduced.
- ❌ Requires session-aware listener lifecycle management.

## Links

- [Firestore persistence service](../../src/app/services/firestore.ts)
- [React providers and listener lifecycle](../../src/app/context/Providers.tsx)
- [Firestore security rules](../../firestore.rules)
- [Firestore indexes](../../firestore.indexes.json)
- [System architecture](../../README.md#system-architecture)
- [Admin migration CLI](../../scripts/migrate-appstate.mjs)
