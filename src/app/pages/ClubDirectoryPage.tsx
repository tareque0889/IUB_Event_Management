import {
  useMemo,
  useState
} from "react";

import {
  Users
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useData } from "../context/DataContext";
import { ClubCard } from "../components/ClubCard";
import { EmptyState } from "../components/EmptyState";
import { SearchInput } from "../components/SearchInput";
import { useDebouncedValue } from "../hooks/useDebounce";


export function ClubDirectoryPage() {
  const { store } = useData();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const query = useDebouncedValue(search.trim().toLowerCase(), 250);

  const categories = useMemo(
    () => Array.from(new Set(store.clubs.map((c) => c.category))),
    [store.clubs],
  );
  const clubs = useMemo(
    () =>
      store.clubs
        .filter((c) => {
          return (
            !query ||
            c.name.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query)
          );
        })
        .filter(
          (c) => catFilter === "all" || c.category === catFilter,
        ),
    [store.clubs, query, catFilter],
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Explore
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-3xl font-semibold"
        >
          Club Directory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {clubs.length} clubs
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <SearchInput
          className="flex-1 min-w-[220px]"
          label="CLUBS"
          placeholder="Search clubs..."
          value={search}
          onChange={setSearch}
          ariaLabel="Search clubs"
        />
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {clubs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clubs found"
          description="Try a different search."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clubs.map((c) => (
            <ClubCard key={c.id} club={c} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Club Detail ──────────────────────────────────────────────────────────────

