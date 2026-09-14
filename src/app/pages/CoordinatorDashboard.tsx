import { useNavigate } from "react-router";

import { format, parseISO, isPast } from "date-fns";
import {
  CalendarDays,
  Ticket,
  Plus,
  List,
  AlertCircle,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { formatEventTime } from "../lib/eventUtils";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";

export function CoordinatorDashboard() {
  const { store } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Clubs this coordinator manages events for.
  const myClubs = store.clubs.filter((c) =>
    (c.coordinator_ids ?? []).includes(currentUser?.id ?? ""),
  );

  if (myClubs.length === 0)
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <EmptyState
          icon={AlertCircle}
          title="No club assigned"
          description="You have not been assigned to coordinate any club yet. Please contact your club admin."
        />
      </div>
    );

  const clubIds = myClubs.map((c) => c.id);
  const myEvents = store.events.filter((e) =>
    clubIds.includes(e.club_id),
  );
  const upcoming = myEvents
    .filter(
      (e) => e.status === "published" && !isPast(parseISO(e.date)),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const totalRegistrations = store.registrations.filter((r) =>
    myEvents.some((e) => e.id === r.event_id),
  ).length;
  const totalCheckedIn = store.registrations.filter(
    (r) =>
      myEvents.some((e) => e.id === r.event_id) && r.checked_in,
  ).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Co-ordinator
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-2xl sm:text-3xl font-semibold"
        >
          {currentUser?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          Managing events for{" "}
          {myClubs.map((c) => c.short_name).join(", ")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CalendarDays}
          label="Upcoming Events"
          value={upcoming.length}
        />
        <StatCard
          icon={Ticket}
          label="Registrations"
          value={totalRegistrations}
          color="green"
        />
        <StatCard
          icon={BadgeCheck}
          label="Checked In"
          value={totalCheckedIn}
          color="accent"
        />
        <StatCard
          icon={List}
          label="Total Events"
          value={myEvents.length}
          color="purple"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Button
          className="bg-primary hover:bg-primary/90 h-auto py-4 flex-col gap-1.5"
          onClick={() => navigate("/admin/events/new")}
        >
          <Plus className="size-5" />
          <span>Create Event</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-1.5 border-border"
          onClick={() => navigate("/admin/events")}
        >
          <List className="size-5" />
          <span>Manage Events</span>
        </Button>
      </div>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
          <h2
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-lg font-semibold"
          >
            Upcoming Events
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-xs w-full sm:w-auto"
            onClick={() => navigate("/admin/events")}
          >
            Manage all <ChevronRight className="size-3.5 ml-1" />
          </Button>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming events"
            description="Create your first event to get started."
            action={
              <Button
                size="sm"
                onClick={() => navigate("/admin/events/new")}
              >
                Create Event
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 6).map((e) => {
              const regs = store.registrations.filter(
                (r) =>
                  r.event_id === e.id &&
                  r.status === "registered",
              ).length;
              return (
                <div
                  key={e.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/30 cursor-pointer transition-colors"
                  onClick={() =>
                    navigate(`/admin/events/${e.id}/roster`)
                  }
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <CalendarDays className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {e.title}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {format(parseISO(e.date), "d MMM")} ·{" "}
                        {formatEventTime(e.start_time)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto text-left sm:text-right shrink-0">
                    <p className="text-sm font-mono font-semibold">
                      {regs}/{e.capacity}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      registrations
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
