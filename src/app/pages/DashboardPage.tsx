import {
  Navigate, useNavigate
} from "react-router";

import { parseISO, isPast } from "date-fns";
import {
  CalendarDays,
  Users,
  Bell, ChevronRight, CalendarCheck, MailCheck, Sparkles
} from "lucide-react";
import { Button } from "../components/ui/button";
import type {
  Club,
  Event
} from "../lib/store";
import { useAuth } from "../context/AuthContext";
import { roleHome } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { EventCard } from "../components/EventCard";
import { ClubCard } from "../components/ClubCard";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";

const NEW_FEATURES = [
  {
    title: "Application & registration forms",
    description:
      "Joining a club or registering for an event now uses a quick form so organisers can reach you.",
  },
  {
    title: "Live seat availability",
    description:
      "Event pages show real-time seats. Registration closes automatically once an event is full.",
  },
  {
    title: "Personalised dashboards",
    description:
      "Your dashboard now highlights only what's relevant to you as a student.",
  },
];

export function DashboardPage() {
  const { store, doSendDigest } = useData();
  const { currentUser, isStudent } = useAuth();
  const navigate = useNavigate();

  // Non-students have their own home (coordinator / admin / super admin).
  if (currentUser && !isStudent)
    return <Navigate to={roleHome(currentUser.role)} replace />;

  const myRegs = store.registrations.filter(
    (r) => r.user_id === currentUser?.id,
  );
  const myRegistered = myRegs.filter(
    (r) => r.status === "registered",
  );

  const upcomingEvents = myRegistered
    .map((r) => store.events.find((e) => e.id === r.event_id))
    .filter(Boolean)
    .filter(
      (e) =>
        e!.status !== "cancelled" && !isPast(parseISO(e!.date)),
    )
    .sort((a, b) => a!.date.localeCompare(b!.date))
    .slice(0, 3) as Event[];

  const myMemberships = store.memberships.filter(
    (m) =>
      m.user_id === currentUser?.id && m.status === "approved",
  );
  const myClubs = myMemberships
    .map((m) => store.clubs.find((c) => c.id === m.club_id))
    .filter(Boolean) as Club[];

  const unread = store.notifications.filter(
    (n) => n.user_id === currentUser?.id && !n.is_read,
  ).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-2xl sm:text-3xl font-semibold text-foreground"
          >
            {currentUser?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentUser?.department} ·{" "}
            {currentUser?.student_id}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto shrink-0"
          onClick={doSendDigest}
        >
          <MailCheck className="size-4 mr-2" /> Email me a
          digest
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CalendarCheck}
          label="Registered"
          value={myRegistered.length}
          sub="upcoming events"
        />
        <StatCard
          icon={Users}
          label="Clubs Joined"
          value={myClubs.length}
          color="green"
        />
        {unread > 0 && (
          <StatCard
            icon={Bell}
            label="Unread"
            value={unread}
            sub="notifications"
            color="purple"
          />
        )}
      </div>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
          <h2
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-lg font-semibold"
          >
            Your Upcoming Events
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-xs w-full sm:w-auto"
            onClick={() => navigate("/events")}
          >
            Browse all{" "}
            <ChevronRight className="size-3.5 ml-1" />
          </Button>
        </div>
        {upcomingEvents.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming events"
            description="You haven't registered for any events yet."
            action={
              <Button
                size="sm"
                onClick={() => navigate("/events")}
              >
                Explore events
              </Button>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-primary" />
          <h2
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-lg font-semibold"
          >
            New Features
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NEW_FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-4 bg-card border border-border rounded-lg"
            >
              <p className="text-sm font-semibold mb-1">
                {f.title}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
          <h2
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-lg font-semibold"
          >
            My Clubs
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-xs w-full sm:w-auto"
            onClick={() => navigate("/clubs")}
          >
            All clubs <ChevronRight className="size-3.5 ml-1" />
          </Button>
        </div>
        {myClubs.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No club memberships"
            description="Join a club to connect with fellow students."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/clubs")}
              >
                Browse clubs
              </Button>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myClubs.map((c) => (
              <ClubCard key={c.id} club={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Event Feed ───────────────────────────────────────────────────────────────
