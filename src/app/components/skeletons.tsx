/**
 * skeletons.tsx
 *
 * Composed loading placeholders that mirror the layout of the real
 * components (EventCard, ClubCard, StatCard, table rows, whole pages) so
 * content doesn't jump when data arrives. Used as React.Suspense fallbacks
 * for lazily-loaded routes and as first-load placeholders for lists.
 */
import { Skeleton } from "./ui/skeleton";

export function EventCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/3" />
        <div className="space-y-2 pt-1">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-2 w-full mt-3" />
      </div>
    </div>
  );
}

export function EventGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      role="status"
      aria-busy="true"
      aria-label="Loading events"
    >
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ClubCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function ClubGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
      role="status"
      aria-busy="true"
      aria-label="Loading clubs"
    >
      {Array.from({ length: count }, (_, i) => (
        <ClubCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-start gap-4">
      <Skeleton className="size-10 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton
          key={i}
          className={i === 0 ? "h-4 w-1/3" : "h-4 flex-1"}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div
      className="bg-card border border-border rounded-lg overflow-hidden"
      role="status"
      aria-busy="true"
    >
      {Array.from({ length: rows }, (_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

/** Generic page-level fallback used by React.lazy routes inside AppShell. */
export function PageSkeleton() {
  return (
    <div className="p-6 max-w-6xl mx-auto" role="status" aria-busy="true">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-40 mb-8" />
      <StatRowSkeleton />
      <div className="mt-8">
        <EventGridSkeleton count={4} />
      </div>
    </div>
  );
}

/** Lightweight fallback for public (pre-auth) pages like Register / Forgot. */
export function AuthPageSkeleton() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      role="status"
      aria-busy="true"
    >
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
