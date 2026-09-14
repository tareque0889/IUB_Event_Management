import React, {
  useState
} from "react";
import {
  useNavigate,
  useParams
} from "react-router";

import { toast } from "sonner";
import {
  ArrowLeft
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { clubsManagedBy } from "../lib/store";

export function EventFormPage() {
  const { id } = useParams<{ id: string }>();
  const { store, doCreateEvent, doUpdateEvent } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isEdit = !!id;
  const existingEvent = store.events.find((e) => e.id === id);
  const managedClubs = clubsManagedBy(store, currentUser);
  // For edits keep the event's own club; for new events use the first managed club.
  const myClub = existingEvent
    ? store.clubs.find((c) => c.id === existingEvent.club_id)
    : managedClubs[0];

  const [form, setForm] = useState({
    title: existingEvent?.title ?? "",
    description: existingEvent?.description ?? "",
    date: existingEvent?.date ?? "",
    start_time: existingEvent?.start_time ?? "",
    end_time: existingEvent?.end_time ?? "",
    venue: existingEvent?.venue ?? "",
    capacity: existingEvent?.capacity ?? 50,
    poster_url: existingEvent?.poster_url ?? "",
    tags: (existingEvent?.tags ?? []).join(", "),
    status: (existingEvent?.status ?? "published") as
      "draft" | "published",
    recurrence: (existingEvent?.recurrence ?? "none") as
      "none" | "daily" | "weekly" | "monthly",
    recurrence_count: existingEvent?.recurrence_count ?? 4,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!myClub) return;
    if (form.end_time <= form.start_time) {
      toast.error("Invalid time range", {
        description: "End time must be later than start time.",
      });
      return;
    }
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const recurrenceFields = {
      recurrence: form.recurrence,
      recurrence_count:
        form.recurrence === "none"
          ? 1
          : Math.max(1, Number(form.recurrence_count)),
    };

    if (isEdit && existingEvent) {
      doUpdateEvent(existingEvent.id, {
        title: form.title,
        description: form.description,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue,
        capacity: Number(form.capacity),
        poster_url: form.poster_url,
        tags,
        status: form.status,
        ...recurrenceFields,
      });
    } else {
      doCreateEvent({
        title: form.title,
        description: form.description,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue,
        capacity: Number(form.capacity),
        poster_url: form.poster_url,
        tags,
        status: form.status,
        club_id: myClub.id,
        created_by: currentUser!.id,
        ...recurrenceFields,
        exception_dates: [],
      });
    }
    navigate("/admin/events");
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back
      </button>
      <h1
        style={{ fontFamily: "'Outfit', sans-serif" }}
        className="text-xl sm:text-2xl font-semibold mb-6"
      >
        {isEdit ? "Edit Event" : "Create New Event"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Event Title *</Label>
          <Input
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            placeholder="e.g. IUB Hackathon 2026"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Description *</Label>
          <Textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            rows={4}
            placeholder="Describe the event..."
            className="resize-none"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Start Time *</Label>
            <Input
              type="time"
              value={form.start_time}
              onChange={(e) =>
                setForm({ ...form, start_time: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>End Time *</Label>
            <Input
              type="time"
              value={form.end_time}
              onChange={(e) =>
                setForm({ ...form, end_time: e.target.value })
              }
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Venue *</Label>
          <Input
            value={form.venue}
            onChange={(e) =>
              setForm({ ...form, venue: e.target.value })
            }
            placeholder="e.g. Main Auditorium, Block A"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Max Capacity *</Label>
            <Input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) =>
                setForm({
                  ...form,
                  capacity: Number(e.target.value),
                })
              }
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  status: v as "draft" | "published",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">
                  Published
                </SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Repeats</Label>
            <Select
              value={form.recurrence}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  recurrence: v as typeof form.recurrence,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  Does not repeat
                </SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.recurrence !== "none" && (
            <div className="space-y-1.5">
              <Label>Number of sessions</Label>
              <Input
                type="number"
                min={1}
                max={52}
                value={form.recurrence_count}
                onChange={(e) =>
                  setForm({
                    ...form,
                    recurrence_count: Number(e.target.value),
                  })
                }
              />
            </div>
          )}
        </div>
        {form.recurrence !== "none" && (
          <p className="text-xs text-muted-foreground -mt-2">
            Creates a series of{" "}
            {Math.max(1, Number(form.recurrence_count))}{" "}
            {form.recurrence} sessions starting from the date
            above. You can cancel individual sessions later from
            the event page.
          </p>
        )}
        <div className="space-y-1.5">
          <Label>Poster Image URL</Label>
          <Input
            value={form.poster_url}
            onChange={(e) =>
              setForm({ ...form, poster_url: e.target.value })
            }
            placeholder="https://images.unsplash.com/..."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <Input
            value={form.tags}
            onChange={(e) =>
              setForm({ ...form, tags: e.target.value })
            }
            placeholder="e.g. Tech, Workshop, Competition"
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated list of tags
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90"
          >
            {isEdit ? "Save Changes" : "Create Event"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Attendee Roster ──────────────────────────────────────────────────────────
