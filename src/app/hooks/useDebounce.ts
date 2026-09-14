/**
 * useDebounce.ts
 *
 * - useDebouncedValue(value, delay): returns a copy of `value` that only
 *   updates after `delay` ms of inactivity. Keep the raw value for the
 *   controlled input; derive filtered lists from the debounced one.
 * - useDebouncedCallback(fn, delay): a stable callback that defers `fn`
 *   until the caller has been quiet for `delay` ms (for onChange handlers
 *   that hit Firestore or do heavy work).
 */
import { useCallback, useEffect, useRef, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay = 250,
): (...args: Args) => void {
  const fnRef = useRef(fn);
  const timer = useRef<number | undefined>(undefined);

  // Always call the latest fn without re-creating the debounced wrapper.
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return useCallback(
    (...args: Args) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => fnRef.current(...args), delay);
    },
    [delay],
  );
}
