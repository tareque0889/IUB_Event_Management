import React, {
  useState
} from "react";
import {
  useNavigate
} from "react-router";

import {
  Bell, AlertCircle,
  CheckCircle2, UserCheck, BadgeCheck,
  Hourglass
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "./ui/dropdown-menu";
import type {
  Notification
} from "../lib/store";
import { useAuth } from "../context/AuthContext";
import { useActions, useStoreSelector } from "../context/DataContext";
import { notificationsFor } from "../lib/selectors";

export function NotificationBell() {
  const { doMarkNotificationsRead } = useActions();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // The bell is mounted on every page; subscribe only to this user's
  // notifications (already sorted newest-first by the selector).
  const mine = useStoreSelector(
    (s) => notificationsFor(s, currentUser?.id),
    [currentUser?.id],
  );
  const myNotifs = mine.slice(0, 8);
  const unread = mine.reduce((n, x) => (x.is_read ? n : n + 1), 0);

  const notifIcon = (type: Notification["type"]) => {
    const map: Record<string, React.ElementType> = {
      registration: CheckCircle2,
      waitlist: Hourglass,
      event_update: AlertCircle,
      membership: UserCheck,
      role_request: BadgeCheck,
      general: Bell,
    };
    return map[type] ?? Bell;
  };

  function handleOpen(val: boolean) {
    setOpen(val);
    if (val && unread > 0) doMarkNotificationsRead();
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-[480px] overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center justify-between sticky top-0 bg-popover z-10">
          <span>Notifications</span>
          {myNotifs.length > 0 && (
            <button
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="text-xs text-primary hover:underline font-normal"
            >
              View all
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {myNotifs.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        ) : (
          myNotifs.map((n) => {
            const Icon = notifIcon(n.type);
            return (
              <div
                key={n.id}
                className={`flex gap-3 px-3 py-3 border-b border-border/50 last:border-0 ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <div
                  className={`mt-0.5 shrink-0 size-7 rounded-full flex items-center justify-center ${!n.is_read ? "bg-primary/10" : "bg-muted"}`}
                >
                  <Icon
                    className={`size-3.5 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed text-foreground">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">
                    {n.created_at.slice(0, 10)}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="size-2 rounded-full bg-accent shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

