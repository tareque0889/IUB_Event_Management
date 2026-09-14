# ADR-0002: Keep Client-Side Business Rules and Document the Firestore Trust Model

- **Date**: 2026-09-14
- **Status**: Accepted (with known debt)
- **Deciders**: IUB Event Management maintainers
- **Tags**: security, authorization, firestore, client-state

## Context and Problem Statement

IUB Event Management inherited a single-document Firestore model where the whole
application state was one writable `appState/main` blob. In that model, the
browser already applied business rules locally through pure reducers in
`src/app/lib/store.ts`, then persisted the resulting state.

The collection split in ADR-0001 needed to ship without introducing server
infrastructure, Cloud Functions or a full authorization rewrite. The project
also targets Firebase's free tier and currently has zero server-side application
code. Keeping the reducer model preserved delivery speed, but it makes the
trust boundary explicit: Firestore rules are not yet the source of business
authorization.

## Decision Drivers

- Preserve the existing optimistic reducer flow used by the app.
- Avoid Cloud Functions or custom backends during the collection migration.
- Keep Firebase free-tier deployment and operations simple.
- Restrict access to the institutional `@iub.edu.bd` population.
- Make the security debt explicit instead of implying server-side enforcement.
- Leave a clear path toward per-role rules and server-owned mutations.

## Considered Options

- Keep client-side business rules with institutional Firestore rules.
- Implement per-role Firestore rules and custom claims immediately.
- Move sensitive mutations into callable Cloud Functions immediately.

## Decision Outcome

Chosen option: **"Keep client-side business rules with institutional Firestore
rules"**, because it lets the storage migration land without rewriting every
mutation path or adding server code.

Business rules remain pure client-side reducers in `src/app/lib/store.ts`. The
client applies them optimistically and persists the resulting documents.
Firestore rules currently check that callers are signed in with an
`@iub.edu.bd` email and, for writes, that the document's `id` field matches the
document path. Public browsing data (`clubs`, `events`) remains readable without
auth; private collections require a signed-in institutional account.

This means any authenticated IUB user can technically write any document,
including changing their own `users.role`. The app relies on the closed IUB
account population, client UX, auditability of Firestore data and planned
hardening rather than complete server-side authorization today.

### Positive Consequences

- The collection split ships without Cloud Functions or a backend rewrite.
- Pages continue to use the existing optimistic reducer experience.
- Rules are still stricter than the old anonymous single-blob model because
  private collections are no longer anonymously readable.
- The client refuses to persist against a permission-denied partial baseline, so
  logged-out reads cannot accidentally delete private data.
- The trust model and security debt are recorded for future maintainers.

### Negative Consequences

- There is no server-side authorization for role-specific actions.
- Privilege escalation is possible if an authenticated user edits documents
  directly, for example by changing their own `users.role`.
- Firestore rules validate document shape only minimally through id/path
  consistency; they do not encode club-admin, owner or super-admin workflows.
- Sensitive mutations remain client-owned until follow-up hardening lands.

## Pros and Cons of the Options

### Keep client-side business rules with institutional Firestore rules ✅ Chosen

- ✅ Preserves the existing reducer architecture and optimistic UI.
- ✅ Requires no server runtime, deployment pipeline or paid Firebase features.
- ✅ Narrows anonymous access compared with the legacy single-document model.
- ❌ Any authenticated IUB user can bypass the UI and write arbitrary allowed
  collection documents.
- ❌ Role and ownership checks are social and client-side, not authoritative.

### Implement per-role Firestore rules and custom claims immediately

- ✅ Would make many authorization checks server-enforced at the database edge.
- ✅ Could make `users.role` immutable except to trusted administrators.
- ❌ Requires a claims management path, migration of existing users and more
  rule complexity before the collection split can ship.
- ❌ Some cross-document invariants are awkward or impossible in rules alone.

### Move sensitive mutations into callable Cloud Functions immediately

- ✅ Best place for authoritative checks, transactions and audit logging.
- ✅ Can enforce registration, membership, notification and role workflows on
  the server.
- ❌ Adds server code, deployment complexity and likely paid-tier operational
  considerations.
- ❌ Requires changing every sensitive client mutation path at once.

## Links

- [Threat model](../security/THREAT_MODEL.md)
- [Client reducers](../../src/app/lib/store.ts)
- [Firestore security rules](../../firestore.rules)
- [Provider baseline safeguards](../../src/app/context/Providers.tsx)
- [ADR-0001: Use Per-Entity Firestore Collections for Store Persistence](0001-per-entity-firestore-collections.md)
