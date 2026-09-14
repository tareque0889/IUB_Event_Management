import {
  useMemo,
  useState
} from "react";

import {
  CalendarDays
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useData } from "../context/DataContext";
import { EventCard } from "../components/EventCard";
import { EmptyState } from "../components/EmptyState";
import { SearchInput } from "../components/SearchInput";
import { useDebouncedValue } from "../hooks/useDebounce";


export function EventFeedPage() {
  const { store } = useData();
  const [search, setSearch] = useState("");
  const [clubFilter, setClubFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  // The input stays controlled by `search`; filtering waits for typing to pause.
  const query = useDebouncedValue(search.trim().toLowerCase(), 250);

  const events = useMemo(
    () =>
      store.events
        .filter((e) => e.status === "published")
        .filter((e) => {
          return (
            !query ||
            e.title.toLowerCase().includes(query) ||
            e.description.toLowerCase().includes(query) ||
            e.tags.some((t) => t.toLowerCase().includes(query))
          );
        })
        .filter(
          (e) => clubFilter === "all" || e.club_id === clubFilter,
        )
        .filter((e) => {
          if (statusFilter === "available")
            return e.registered_count < e.capacity;
          if (statusFilter === "full")
            return e.registered_count >= e.capacity;
          return true;
        })
        .sort((a, b) => a.date.localeCompare(b.date)),
    [store.events, query, clubFilter, statusFilter],
  );

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Discover
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-2xl sm:text-3xl font-semibold"
        >
          Campus Events
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {events.length} upcoming event
          {events.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <SearchInput
          className="flex-1 min-w-[220px]"
          label="EVENTS"
          placeholder="Search events..."
          value={search}
          onChange={setSearch}
          ariaLabel="Search events"
        />
        <Select
          value={clubFilter}
          onValueChange={setClubFilter}
        >
          <SelectTrigger className="w-[180px] bg-card border-border" aria-label="Filter by club">
            <SelectValue placeholder="All clubs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clubs</SelectItem>
            {store.clubs.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.short_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[140px] bg-card border-border" aria-label="Filter by availability">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="full">
              Full (Waitlist)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Event Detail ─────────────────────────────────────────────────────────────
