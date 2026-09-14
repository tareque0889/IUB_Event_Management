/**
 * liveStore.ts
 *
 * A tiny bridge that lets non-React modules (e.g. memberService) read and
 * mutate the single React `store` owned by Providers, and lets components
 * subscribe to store changes without going through React context
 * (see useStoreSelector in DataContext). Providers registers the
 * getter/setter once on mount and calls notifyLiveStore() after every commit.
 *
 * This keeps a single source of truth (the React store) while allowing the
 * service layer to stay call-compatible with the previous backend API.
 */
import type { StoreState } from "./store";

type Getter = () => StoreState;
type Setter = (updater: (prev: StoreState) => StoreState) => void;
type Listener = () => void;

let getter: Getter | null = null;
let setter: Setter | null = null;
const listeners = new Set<Listener>();

export function registerLiveStore(get: Getter, set: Setter): void {
  getter = get;
  setter = set;
}

export function getLiveStore(): StoreState {
  if (!getter) {
    throw new Error("liveStore not registered yet");
  }
  return getter();
}

/** Apply a pure mutation to the live store; returns the resulting state. */
export function mutateLiveStore(
  updater: (prev: StoreState) => StoreState,
): StoreState {
  if (!setter || !getter) {
    throw new Error("liveStore not registered yet");
  }
  const next = updater(getter());
  setter(() => next);
  return next;
}

/** Subscribe to store commits. Returns an unsubscribe function. */
export function subscribeLiveStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called by Providers after each committed store change. */
export function notifyLiveStore(): void {
  for (const l of listeners) l();
}
