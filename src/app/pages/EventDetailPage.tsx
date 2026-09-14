import { lazy, Suspense } from "react";
import {
  useNavigate,
  useParams
} from "react-router";

import { toast } from "sonner";
import { format, parseISO, isPast } from "date-fns";
import {
  CalendarDays,
  Users, Clock,
  MapPin,
  Ticket,
  AlertCircle,
  CheckCircle2, List, Edit3, BadgeCheck,
  Hourglass, ArrowLeft, Share2,
  CalendarPlus,
  Download,
  Repeat
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger
} from "../components/ui/dropdown-menu";
import { Separator } from "../components/ui/separator";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  downloadICS,
  googleCalendarUrl,
  shareEvent,
  checkInCode, getOccurrences,
  recurrenceLabel,
  formatEventTime
} from "../lib/eventUtils";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { CapacityBar } from "../components/CapacityBar";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/ui/skeleton";

// The QR encoder is only needed inside the check-in dialog.
const CheckInQr = lazy(() => import("../components/CheckInQr"));

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { store, doCancel, doToggleException } =
    useData();
  const { currentUser, isClubAdmin } = useAuth();
  const navigate = useNavigate();

  const event = store.events.find((e) => e.id === id);
  const club = store.clubs.find((c) => c.id === event?.club_id);
  const myReg = store.registrations.find(
    (r) => r.user_id === currentUser?.id && r.event_id === id,
  );
  const isAdmin =
    isClubAdmin && club?.admin_user_id === currentUser?.id;

  if (!event) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Event not found"
          description="This event may have been removed."
        />
      </div>
    );
  }

  const isFull = event.registered_count >= event.capacity;
  const isEventPast = isPast(
    parseISO(`${event.date}T${event.end_time}`),
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="relative h-64 sm:h-80 rounded-xl overflow-hidden bg-muted mb-6">
        <ImageWithFallback
          src={event.poster_url}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {event.status === "cancelled" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Badge className="bg-destructive text-white text-sm px-4 py-1.5">
              Event Cancelled
            </Badge>
          </div>
        )}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">
              {club?.name}
            </p>
            <h1
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="text-3xl font-semibold leading-snug"
            >
              {event.title}
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: CalendarDays,
                label: "Date",
                value: format(
                  parseISO(event.date),
                  "EEEE, d MMMM yyyy",
                ),
              },
              {
                icon: Clock,
                label: "Time",
                value: `${formatEventTime(event.start_time)} – ${formatEventTime(event.end_time)}`,
              },
              {
                icon: MapPin,
                label: "Venue",
                value: event.venue,
              },
              {
                icon: Users,
                label: "Capacity",
                value: `${event.capacity} seats`,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex gap-3 p-3 bg-card border border-border rounded-lg"
              >
                <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {label}
                  </p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div>
            <h2
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="font-semibold text-lg mb-3"
            >
              About this event
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {recurrenceLabel(event) && (
            <div>
              <Separator className="mb-6" />
              <div className="flex items-center gap-2 mb-3">
                <Repeat className="size-4 text-primary" />
                <h2
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                  className="font-semibold text-lg"
                >
                  Schedule
                </h2>
                <Badge
                  variant="outline"
                  className="text-xs font-mono"
                >
                  {recurrenceLabel(event)}
                </Badge>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {getOccurrences(event).map((occ) => (
                  <div
                    key={occ.date}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border ${
                      occ.skipped
                        ? "border-border/50 bg-muted/40 text-muted-foreground line-through"
                        : "border-border bg-card"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {format(
                        parseISO(occ.date),
                        "EEE, d MMM yyyy",
                      )}
                    </span>
                    {isAdmin ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs no-underline"
                        onClick={() =>
                          doToggleException(event.id, occ.date)
                        }
                      >
                        {occ.skipped ? "Restore" : "Cancel"}
                      </Button>
                    ) : (
                      occ.skipped && (
                        <Badge
                          variant="outline"
                          className="text-xs font-mono text-destructive border-destructive/30"
                        >
                          Cancelled
                        </Badge>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`/admin/events/edit/${event.id}`)
                }
              >
                <Edit3 className="size-3.5 mr-1.5" /> Edit Event
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`/admin/events/${event.id}/roster`)
                }
              >
                <List className="size-3.5 mr-1.5" /> View Roster
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold">
                  Availability
                </p>
                {isFull && (
                  <Badge
                    variant="outline"
                    className="text-destructive border-destructive/30 text-xs font-mono"
                  >
                    Full
                  </Badge>
                )}
                {!isFull && event.waitlisted_count > 0 && (
                  <Badge
                    variant="outline"
                    className="text-foreground border-accent/50 text-xs font-mono"
                  >
                    {event.waitlisted_count} waitlisted
                  </Badge>
                )}
              </div>
              <CapacityBar
                registered={event.registered_count}
                capacity={event.capacity}
              />
            </div>

            <Separator />

            {event.status === "cancelled" ? (
              <div className="rounded-md bg-destructive/8 border border-destructive/20 p-3 text-sm text-destructive text-center">
                This event has been cancelled.
              </div>
            ) : isEventPast ? (
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground text-center">
                This event has ended.
              </div>
            ) : myReg ? (
              <div className="space-y-3">
                <div
                  className={`rounded-md p-3 text-sm text-center font-medium ${
                    myReg.status === "registered"
                      ? "bg-quaternary/10 text-foreground border border-quaternary/30"
                      : "bg-accent/10 text-foreground border border-accent/30"
                  }`}
                >
                  {myReg.status === "registered" ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="size-4" /> You
                      are registered
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Hourglass className="size-4" /> You are
                      on the waitlist
                    </span>
                  )}
                </div>
                {myReg.status === "registered" &&
                  (myReg.checked_in ? (
                    <div className="rounded-md bg-quaternary/15 border border-quaternary/40 p-3 text-xs text-foreground text-center font-medium flex items-center justify-center gap-1.5">
                      <BadgeCheck className="size-4" /> Checked
                      in
                      {myReg.checked_in_at &&
                        ` · ${format(parseISO(myReg.checked_in_at), "d MMM, HH:mm")}`}
                    </div>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full"
                        >
                          <Ticket className="size-4 mr-2" />{" "}
                          Show Check-in QR
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                          <DialogTitle>
                            Your check-in ticket
                          </DialogTitle>
                          <DialogDescription>
                            Present this QR code at the event
                            entrance for contactless check-in.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                          <div className="bg-white p-4 rounded-xl border-2 border-border">
                            <Suspense
                              fallback={<Skeleton className="size-[200px]" />}
                            >
                              <CheckInQr
                                value={checkInCode(
                                  event.id,
                                  myReg.id,
                                )}
                                size={200}
                              />
                            </Suspense>
                          </div>
                          <p className="text-xs font-mono text-muted-foreground">
                            {currentUser?.name} · {event.title}
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive border-destructive/30"
                    >
                      Cancel Registration
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Cancel registration?
                      </DialogTitle>
                      <DialogDescription>
                        {myReg.status === "waitlisted"
                          ? "You will lose your waitlist spot."
                          : "Your spot may be given to someone on the waitlist."}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">
                        Keep my spot
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          doCancel(event.id);
                          navigate("/events");
                        }}
                      >
                        Yes, cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : isFull ? (
              <div className="space-y-3">
                <div className="rounded-md bg-destructive/8 border border-destructive/25 p-3 text-sm text-destructive text-center font-semibold flex items-center justify-center gap-1.5">
                  <AlertCircle className="size-4" /> Seats are full
                </div>
                <Button className="w-full" disabled>
                  Registration Closed
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => navigate(`/events/${event.id}/register`)}
              >
                <Ticket className="size-4 mr-2" /> Register Now
              </Button>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <p className="text-xs font-mono text-muted-foreground">
              Add & share
            </p>
            <div className="grid grid-cols-1 gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <CalendarPlus className="size-4 mr-2" /> Add
                    to Calendar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56"
                >
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(
                        googleCalendarUrl(event, club),
                        "_blank",
                        "noopener",
                      )
                    }
                  >
                    <CalendarDays className="size-4 mr-2" />{" "}
                    Google Calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadICS(event, club)}
                  >
                    <Download className="size-4 mr-2" />{" "}
                    Download .ics
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  const result = await shareEvent(event);
                  if (result === "copied")
                    toast.success("Link copied", {
                      description:
                        "Event link copied to your clipboard.",
                    });
                  else if (result === "failed")
                    toast.error("Couldn't share", {
                      description:
                        "Please copy the page URL manually.",
                    });
                }}
              >
                <Share2 className="size-4 mr-2" /> Share Event
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs font-mono text-muted-foreground mb-2">
              Organised by
            </p>
            <div
              className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/clubs/${club?.id}`)}
            >
              <div className="size-10 rounded-md overflow-hidden bg-muted shrink-0">
                <ImageWithFallback
                  src={club?.cover_url ?? ""}
                  alt={club?.name ?? ""}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {club?.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {club?.member_count?.toLocaleString()} members
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Club Directory ───────────────────────────────────────────────────────────

