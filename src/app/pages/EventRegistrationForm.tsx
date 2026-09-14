import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { toast } from "sonner";
import { format, parseISO, isPast } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { formatEventTime } from "../lib/eventUtils";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { CapacityBar } from "../components/CapacityBar";
import { EmptyState } from "../components/EmptyState";

export function EventRegistrationForm() {
  const { id } = useParams<{ id: string }>();
  const { store, doRegister } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const event = store.events.find((e) => e.id === id);
  const existing = store.registrations.find(
    (r) => r.user_id === currentUser?.id && r.event_id === id,
  );

  const [fullName, setFullName] = useState(currentUser?.name ?? "");
  const [contactEmail, setContactEmail] = useState(
    currentUser?.email ?? "",
  );
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!event) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <EmptyState
          icon={AlertCircle}
          title="Event not found"
          description="This event may have been removed."
        />
      </div>
    );
  }

  const availableSeats = Math.max(
    0,
    event.capacity - event.registered_count,
  );
  const isFull = availableSeats === 0;
  const isEventPast = isPast(
    parseISO(`${event.date}T${event.end_time}`),
  );
  const isCancelled = event.status === "cancelled";
  const blocked = isFull || isEventPast || isCancelled || !!existing;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isFull) {
      toast.error("Seats are full", {
        description: "This event has no available seats.",
      });
      return;
    }
    if (!fullName.trim() || !contactEmail.trim() || !phone.trim()) {
      toast.error("Missing details", {
        description: "Please fill in your name, email, and phone number.",
      });
      return;
    }
    setIsSubmitting(true);
    doRegister(event!.id, {
      full_name: fullName.trim(),
      contact_email: contactEmail.trim(),
      phone: phone.trim(),
    });
    navigate(`/events/${event!.id}`);
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Event Registration
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-2xl sm:text-3xl font-semibold"
        >
          {event.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {format(parseISO(event.date), "d MMM yyyy")} ·{" "}
            {formatEventTime(event.start_time)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {event.venue}
          </span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <Users className="size-4" /> Availability
          </p>
          <p className="text-sm font-mono">
            {availableSeats} seat{availableSeats !== 1 ? "s" : ""} left
          </p>
        </div>
        <CapacityBar
          registered={event.registered_count}
          capacity={event.capacity}
        />
      </div>

      {existing ? (
        <div className="rounded-md bg-quaternary/10 border border-quaternary/30 p-4 text-sm text-foreground text-center font-medium flex items-center justify-center gap-1.5">
          <CheckCircle2 className="size-4" /> You are already registered
          for this event.
        </div>
      ) : isCancelled ? (
        <div className="rounded-md bg-destructive/8 border border-destructive/20 p-4 text-sm text-destructive text-center">
          This event has been cancelled.
        </div>
      ) : isEventPast ? (
        <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground text-center">
          This event has already ended.
        </div>
      ) : isFull ? (
        <div className="rounded-md bg-destructive/8 border border-destructive/25 p-4 text-sm text-destructive text-center font-semibold flex items-center justify-center gap-1.5">
          <AlertCircle className="size-4" /> Seats are full
        </div>
      ) : null}

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle style={{ fontFamily: "'Outfit', sans-serif" }}>
              Your contact information
            </CardTitle>
            <CardDescription>
              The organisers will use this to reach you about the event.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={blocked}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={blocked}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 01700000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={blocked}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={blocked || isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isFull
                ? "Seats are full"
                : isSubmitting
                  ? "Registering..."
                  : "Confirm Registration"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
