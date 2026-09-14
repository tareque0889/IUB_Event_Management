/**
 * selectors.ts
 *
 * Memoised derived views of the StoreState. Building the index maps once per
 * store change turns the O(N) `.find()`/`.filter()` calls scattered across
 * cards and dashboards into O(1) lookups. Each `select*` function caches on
 * the identity of the array slice it reads, so it's safe to call from many
 * components without recomputing.
 */
import type {
  Club,
  Event,
  Membership,
  Notification,
  Registration,
  StoreState,
  User,
} from "./store";

/** Memoise a one-argument function on the identity of its argument. */
function memoOne<A extends object, R>(fn: (a: A) => R): (a: A) => R {
  let lastArg: A | undefined;
  let lastResult: R;
  return (a: A) => {
    if (a !== lastArg) {
      lastArg = a;
      lastResult = fn(a);
    }
    return lastResult;
  };
}

function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return map;
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = map.get(k);
    if (bucket) bucket.push(item);
    else map.set(k, [item]);
  }
  return map;
}

export const EMPTY: never[] = [];

// ─── Index maps ───────────────────────────────────────────────────────────────

export const selectClubsById = memoOne((clubs: Club[]) => indexById(clubs));
export const selectEventsById = memoOne((events: Event[]) => indexById(events));
export const selectUsersById = memoOne((users: User[]) => indexById(users));

/** `${user_id}|${event_id}` → Registration */
export const selectRegistrationsByUserEvent = memoOne(
  (registrations: Registration[]) => {
    const map = new Map<string, Registration>();
    for (const r of registrations) map.set(`${r.user_id}|${r.event_id}`, r);
    return map;
  },
);

export const selectRegistrationsByEvent = memoOne(
  (registrations: Registration[]) => groupBy(registrations, (r) => r.event_id),
);

export const selectRegistrationsByUser = memoOne(
  (registrations: Registration[]) => groupBy(registrations, (r) => r.user_id),
);

/** `${user_id}|${club_id}` → Membership */
export const selectMembershipsByUserClub = memoOne(
  (memberships: Membership[]) => {
    const map = new Map<string, Membership>();
    for (const m of memberships) map.set(`${m.user_id}|${m.club_id}`, m);
    return map;
  },
);

export const selectMembershipsByClub = memoOne((memberships: Membership[]) =>
  groupBy(memberships, (m) => m.club_id),
);

export const selectNotificationsByUser = memoOne(
  (notifications: Notification[]) => {
    const grouped = groupBy(notifications, (n) => n.user_id);
    // Newest first, matching every consumer's sort order.
    for (const list of grouped.values()) {
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return grouped;
  },
);

/** Published events sorted by date ascending (event feed base list). */
export const selectPublishedEventsSorted = memoOne((events: Event[]) =>
  events
    .filter((e) => e.status === "published")
    .sort((a, b) => a.date.localeCompare(b.date)),
);

// ─── Convenience lookups (take the whole store) ───────────────────────────────

export const clubById = (s: StoreState, id: string) =>
  selectClubsById(s.clubs).get(id);

export const eventById = (s: StoreState, id: string) =>
  selectEventsById(s.events).get(id);

export const userById = (s: StoreState, id: string) =>
  selectUsersById(s.users).get(id);

export const registrationFor = (
  s: StoreState,
  userId: string | undefined,
  eventId: string,
) =>
  userId
    ? selectRegistrationsByUserEvent(s.registrations).get(`${userId}|${eventId}`)
    : undefined;

export const membershipFor = (
  s: StoreState,
  userId: string | undefined,
  clubId: string,
) =>
  userId
    ? selectMembershipsByUserClub(s.memberships).get(`${userId}|${clubId}`)
    : undefined;

export const notificationsFor = (
  s: StoreState,
  userId: string | undefined,
): Notification[] =>
  userId
    ? (selectNotificationsByUser(s.notifications).get(userId) ?? EMPTY)
    : EMPTY;

export const unreadCountFor = (s: StoreState, userId: string | undefined) =>
  notificationsFor(s, userId).reduce((n, x) => (x.is_read ? n : n + 1), 0);
