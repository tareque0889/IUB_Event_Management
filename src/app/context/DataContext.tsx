import {
  createContext,
  useContext,
  useRef,
  useSyncExternalStore,
} from "react";
import type {
  StoreState,
  User,
  UserRole,
  ClubRole,
  Event,
  RoleRequest,
} from "../lib/store";
import { getLiveStore, subscribeLiveStore } from "../lib/liveStore";

// ─── Data Context ─────────────────────────────────────────────────────────────
//
// The app state is exposed through TWO contexts so that a component which only
// dispatches actions (buttons, forms) is not re-rendered every time the store
// changes:
//
//   StoreContext   – the StoreState snapshot (changes on every write)
//   ActionsContext – stable, memoised callbacks (never changes after mount)
//
// `useData()` is kept as a compatibility hook that merges both, so existing
// pages keep working. New/hot components should prefer `useStoreSelector`
// (re-renders only when the selected slice changes) + `useActions()`.

export interface DataActions {
  doRegister: (
    eventId: string,
    contact?: {
      full_name?: string;
      contact_email?: string;
      phone?: string;
    },
  ) => void;
  doCancel: (eventId: string) => void;
  doApplyClub: (
    clubId: string,
    application?: {
      contact_email?: string;
      phone?: string;
      motivation?: string;
    },
  ) => void;
  doReviewMembership: (
    membershipId: string,
    action: "approved" | "rejected",
  ) => void;
  doRemoveMember: (membershipId: string) => void;
  doAssignRoles: (clubId: string) => void;
  doUpdateMemberRole: (membershipId: string, newRole: ClubRole) => void;
  doCreateEvent: (
    data: Omit<
      Event,
      "id" | "registered_count" | "waitlisted_count"
    >,
  ) => void;
  doUpdateEvent: (
    eventId: string,
    updates: Partial<Event>,
  ) => void;
  doCancelEvent: (eventId: string) => void;
  doDeleteEvent: (eventId: string) => void;
  doDeleteClub: (clubId: string) => void;
  doMarkNotificationsRead: () => void;
  doUpdateProfile: (
    updates: Partial<Pick<User, "name" | "student_id" | "department" | "bio">>,
  ) => void;
  doRegisterUser: (data: {
    name: string;
    email: string;
    student_id: string;
    department: string;
  }) => string;
  doSubmitRoleRequest: (
    payload: Omit<
      RoleRequest,
      "id" | "user_id" | "status" | "created_at"
    >,
  ) => void;
  doReviewRoleRequest: (
    requestId: string,
    action: "approved" | "rejected",
  ) => void;
  doChangeUserRole: (userId: string, newRole: UserRole) => void;
  doCheckIn: (registrationId: string, value: boolean) => void;
  doToggleException: (eventId: string, date: string) => void;
  doSendDigest: () => void;
}

export interface DataContextValue extends DataActions {
  store: StoreState;
}

export const StoreContext = createContext<StoreState>({} as StoreState);
export const ActionsContext = createContext<DataActions>({} as DataActions);

/** Full store snapshot. Re-renders the caller on every store change. */
export const useStore = () => useContext(StoreContext);

/** Stable action callbacks only. Never causes store-driven re-renders. */
export const useActions = () => useContext(ActionsContext);

/** Compatibility hook: `{ store, ...actions }` exactly as before the split. */
export function useData(): DataContextValue {
  const store = useStore();
  const actions = useActions();
  return { store, ...actions };
}

// ─── Selector subscription ────────────────────────────────────────────────────

/** Shallow equality for arrays and plain objects (one level deep). */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (
      !Object.prototype.hasOwnProperty.call(b, k) ||
      !Object.is((a as any)[k], (b as any)[k])
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Subscribe to a derived slice of the store. The component re-renders only
 * when `selector(store)` changes according to `isEqual` (shallow by default),
 * bypassing React context propagation entirely.
 *
 * `deps` lists every closure value the selector reads (like `useMemo`); the
 * cached result is invalidated when the store OR any dep changes.
 *
 *   const club = useStoreSelector((s) => s.clubs.find((c) => c.id === id), [id]);
 */
export function useStoreSelector<T>(
  selector: (state: StoreState) => T,
  deps: React.DependencyList = [],
  isEqual: (a: T, b: T) => boolean = shallowEqual,
): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual;

  // Cache keyed by store identity + deps so getSnapshot is referentially
  // stable between renders when nothing relevant changed (required by
  // useSyncExternalStore to avoid re-render loops).
  const cache = useRef<{
    store: StoreState;
    deps: React.DependencyList;
    value: T;
  } | null>(null);

  const getSnapshot = () => {
    const store = getLiveStore();
    const cached = cache.current;
    if (cached && cached.store === store && depsEqual(cached.deps, deps)) {
      return cached.value;
    }
    const next = selectorRef.current(store);
    if (cached && isEqualRef.current(cached.value, next)) {
      cache.current = { store, deps, value: cached.value };
      return cached.value;
    }
    cache.current = { store, deps, value: next };
    return next;
  };

  return useSyncExternalStore(subscribeLiveStore, getSnapshot, getSnapshot);
}

function depsEqual(a: React.DependencyList, b: React.DependencyList): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}
