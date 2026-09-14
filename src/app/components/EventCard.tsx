import { memo, useCallback } from "react";
import {
  useNavigate
} from "react-router";

import { format, parseISO } from "date-fns";
import {
  CalendarDays, Clock,
  MapPin
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  formatEventTime
} from "../lib/eventUtils";
import type {
  Event
} from "../lib/store";
import { useAuth } from "../context/AuthContext";
import { useStoreSelector } from "../context/DataContext";
import { clubById, registrationFor } from "../lib/selectors";
import { CapacityBar } from "./CapacityBar";

/**
 * Memoised: with N cards on the feed, a single registration used to
 * re-render every card. Now a card only re-renders when its own event, club
 * or the viewer's registration for it changes.
 */
export const EventCard = memo(function EventCard({ event }: { event: Event }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const club = useStoreSelector((s) => clubById(s, event.club_id), [event.club_id]);
  const myReg = useStoreSelector(
    (s) => registrationFor(s, currentUser?.id, event.id),
    [currentUser?.id, event.id],
  );
  const isFull = event.registered_count >= event.capacity;
  const open = useCallback(
    () => navigate(`/events/${event.id}`),
    [navigate, event.id],
  );

  return (
    <Card
      className="group overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-all duration-200 border-border focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      onClick={open}
      // The whole card is the click target; expose it to keyboard and
      // screen-reader users as a link to the event (WCAG 2.1.1 / 4.1.2).
      role="link"
      tabIndex={0}
      aria-label={`${event.title} — view event`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className="relative h-44 overflow-hidden bg-muted">
        <ImageWithFallback
          src={event.poster_url}
          alt={event.title}
          displayWidth={640}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {event.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/75 text-white backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
        {myReg && (
          <div className="absolute top-3 right-3">
            <span
              className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                myReg.status === "registered"
                  ? "bg-quaternary text-white"
                  : "bg-accent text-foreground"
              }`}
            >
              {myReg.status === "registered"
                ? "Registered"
                : "Waitlisted"}
            </span>
          </div>
        )}
        {event.status === "cancelled" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              Cancelled
            </span>
          </div>
        )}
        {isFull && !myReg && event.status !== "cancelled" && (
          <div className="absolute bottom-3 right-3">
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-destructive/90 text-white">
              Full
            </span>
          </div>
        )}
      </div>

      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </CardTitle>
        <CardDescription className="text-xs font-mono text-muted-foreground">
          {club?.short_name ?? club?.name}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3 flex-1 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3 shrink-0" />
          <span>
            {format(parseISO(event.date), "d MMM yyyy")}
          </span>
          <span>·</span>
          <Clock className="size-3 shrink-0" />
          <span>{formatEventTime(event.start_time)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          <span className="line-clamp-1">{event.venue}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-4">
        <CapacityBar
          registered={event.registered_count}
          capacity={event.capacity}
        />
      </CardFooter>
    </Card>
  );
});

