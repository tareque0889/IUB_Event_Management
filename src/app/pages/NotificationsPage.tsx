import React from "react";

import { format, parseISO } from "date-fns";
import {
  Bell, AlertCircle,
  CheckCircle2, UserCheck, BadgeCheck,
  Hourglass
} from "lucide-react";
import { Button } from "../components/ui/button";
import type {
  Notification
} from "../lib/store";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { EmptyState } from "../components/EmptyState";

export function NotificationsPage() {
  const { store, doMarkNotificationsRead } = useData();
  const { currentUser } = useAuth();

  const notifs = store.notifications
    .filter((n) => n.user_id === currentUser?.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const unread = notifs.filter((n) => !n.is_read).length;

  const typeInfo = (type: Notification["type"]) => {
    const map: Record<
      string,
      { icon: React.ElementType; color: string }
    > = {
      registration: {
        icon: CheckCircle2,
        color: "text-quaternary",
      },
      waitlist: { icon: Hourglass, color: "text-accent" },
      event_update: {
        icon: AlertCircle,
        color: "text-secondary",
      },
      membership: { icon: UserCheck, color: "text-primary" },
      role_request: { icon: BadgeCheck, color: "text-primary" },
      general: { icon: Bell, color: "text-muted-foreground" },
    };
    return (
      map[type] ?? {
        icon: Bell,
        color: "text-muted-foreground",
      }
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
            Inbox
          </p>
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-2xl sm:text-3xl font-semibold"
          >
            Notifications
          </h1>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={doMarkNotificationsRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {notifs.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="No notifications yet. Register for an event to get started."
        />
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const { icon: Icon, color } = typeInfo(n.type);
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                  !n.is_read
                    ? "bg-secondary/40 border-primary/20"
                    : "bg-card border-border"
                }`}
              >
                <div
                  className={`rounded-full p-2 shrink-0 ${!n.is_read ? "bg-primary/8" : "bg-muted"}`}
                >
                  <Icon
                    className={`size-4 ${!n.is_read ? color : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-relaxed ${!n.is_read ? "font-medium" : ""}`}
                  >
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {format(
                      parseISO(n.created_at),
                      "d MMM yyyy · HH:mm",
                    )}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="size-2 rounded-full bg-accent shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
