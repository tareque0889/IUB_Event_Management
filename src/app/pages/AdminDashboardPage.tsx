import { lazy, Suspense } from "react";
import {
  useNavigate
} from "react-router";

import { format, parseISO, isPast } from "date-fns";
import {
  CalendarDays,
  Users, ChevronRight, Plus, Ticket,
  AlertCircle, List,
  UserCheck
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  formatEventTime
} from "../lib/eventUtils";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/ui/skeleton";

// recharts is ~300 KB; only load it when this dashboard actually renders a chart.
const AdminEngagementChart = lazy(
  () => import("../components/AdminEngagementChart"),
);

export function AdminDashboardPage() {
  const { store } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const myClub = store.clubs.find(
    (c) => c.admin_user_id === currentUser?.id,
  );
  if (!myClub)
    return (
      <EmptyState
        icon={AlertCircle}
        title="No club found"
        description=""
      />
    );

  const myEvents = store.events.filter(
    (e) => e.club_id === myClub.id,
  );
  const upcoming = myEvents.filter(
    (e) =>
      e.status === "published" && !isPast(parseISO(e.date)),
  );
  const totalRegistrations = store.registrations.filter((r) =>
    myEvents.some((e) => e.id === r.event_id),
  ).length;
  const pendingReqs = store.memberships.filter(
    (m) => m.club_id === myClub.id && m.status === "pending",
  ).length;
  const approvedMems = store.memberships.filter(
    (m) => m.club_id === myClub.id && m.status === "approved",
  ).length;

  // Attendance analytics: registrations vs check-ins across this club's events.
  const chartData = myEvents
    .map((e) => {
      const regs = store.registrations.filter(
        (r) => r.event_id === e.id && r.status === "registered",
      );
      return {
        id: e.id,
        name:
          e.title.length > 18
            ? `${e.title.slice(0, 18)}…`
            : e.title,
        registrations: e.registered_count,
        checkedIn: regs.filter((r) => r.checked_in).length,
      };
    })
    .sort((a, b) => b.registrations - a.registrations)
    .slice(0, 6);
  const totalCheckedIn = store.registrations.filter(
    (r) =>
      myEvents.some((e) => e.id === r.event_id) && r.checked_in,
  ).length;
  const attendanceRate =
    totalRegistrations > 0
      ? Math.round((totalCheckedIn / totalRegistrations) * 100)
      : 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Club Admin
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-2xl sm:text-3xl font-semibold"
        >
          {myClub.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          {myClub.short_name} · {myClub.category}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Members"
          value={approvedMems}
        />
        <StatCard
          icon={CalendarDays}
          label="Upcoming Events"
          value={upcoming.length}
          color="accent"
        />
        <StatCard
          icon={Ticket}
          label="Registrations"
          value={totalRegistrations}
          color="green"
        />
        <StatCard
          icon={UserCheck}
          label="Pending Requests"
          value={pendingReqs}
          color="purple"
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-lg font-semibold"
          >
            Event Engagement
          </h2>
          <div className="text-right">
            <p className="text-2xl font-mono font-bold text-quaternary">
              {attendanceRate}%
            </p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
              attendance rate
            </p>
          </div>
        </div>
        {chartData.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No events yet"
            description="Create an event to see engagement analytics."
          />
        ) : (
          <Suspense
            fallback={
              <Skeleton
                className="w-full"
                style={{ height: Math.max(160, chartData.length * 46) }}
              />
            }
          >
            <AdminEngagementChart data={chartData} />
          </Suspense>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: "var(--primary)" }}
            />{" "}
            Registered
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: "var(--quaternary)" }}
            />{" "}
            Checked in
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
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
          onClick={() => navigate("/admin/requests")}
        >
          <UserCheck className="size-5" />
          <span>
            Review Requests{" "}
            {pendingReqs > 0 && `(${pendingReqs})`}
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-1.5 border-border"
          onClick={() => navigate("/admin/members")}
        >
          <List className="size-5" />
          <span>View Members</span>
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
            Manage all{" "}
            <ChevronRight className="size-3.5 ml-1" />
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
            {upcoming.slice(0, 5).map((e) => {
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

// ─── Event Manage ─────────────────────────────────────────────────────────────
