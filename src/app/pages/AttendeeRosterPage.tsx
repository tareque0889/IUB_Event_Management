import {
  useState
} from "react";
import {
  useNavigate,
  useParams
} from "react-router";

import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  CheckCircle2, BadgeCheck,
  Hourglass, ArrowLeft
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
} from "../components/ui/avatar";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  parseCheckInCode, formatEventTime
} from "../lib/eventUtils";
import { getInitials } from "../lib/uiHelpers";
import { useData } from "../context/DataContext";
import { CapacityBar } from "../components/CapacityBar";
import { EmptyState } from "../components/EmptyState";

const FAKE_NAMES = [
  "Sadia Islam",
  "Rafiq Hossain",
  "Mehrin Akter",
  "Arif Khan",
  "Tasnuva Begum",
  "Nabil Ahmed",
  "Samiha Chowdhury",
  "Imran Ali",
  "Lamia Rahman",
  "Sakib Hassan",
  "Puja Roy",
  "Zahid Hasan",
  "Ayesha Siddiqua",
  "Rony Das",
  "Farhan Kabir",
  "Nadia Sultana",
  "Tashfin Ahmed",
  "Minhaj Uddin",
  "Rabeya Khatun",
  "Asif Iqbal",
  "Sharmin Akter",
  "Jubayer Islam",
  "Maliha Hoque",
  "Rifat Hossain",
  "Sumona Begum",
  "Masud Rana",
  "Dilruba Khanam",
  "Tanveer Ahmed",
  "Shamima Nasrin",
  "Rashed Khan",
];

export function AttendeeRosterPage() {
  const { id } = useParams<{ id: string }>();
  const { store, doCheckIn } = useData();
  const navigate = useNavigate();
  const [scanOpen, setScanOpen] = useState(false);
  const [scanCode, setScanCode] = useState("");

  const event = store.events.find((e) => e.id === id);
  const realRegs = store.registrations.filter(
    (r) => r.event_id === id,
  );
  const realRegistered = realRegs.filter(
    (r) => r.status === "registered",
  );
  const realWaitlisted = realRegs.filter(
    (r) => r.status === "waitlisted",
  );
  const checkedInCount = realRegistered.filter(
    (r) => r.checked_in,
  ).length;

  const fakePadding = Math.max(
    0,
    (event?.registered_count ?? 0) - realRegistered.length,
  );
  const fakeAttendees = FAKE_NAMES.slice(0, fakePadding);

  const handleScan = () => {
    const parsed = parseCheckInCode(scanCode);
    if (!parsed || parsed.eventId !== id) {
      toast.error("Invalid code", {
        description: "That QR code isn't for this event.",
      });
      return;
    }
    const reg = realRegistered.find(
      (r) => r.id === parsed.registrationId,
    );
    if (!reg) {
      toast.error("Not found", {
        description: "No matching registration for this event.",
      });
      return;
    }
    const attendee = store.users.find(
      (u) => u.id === reg.user_id,
    );
    if (reg.checked_in) {
      toast.info("Already checked in", {
        description: `${attendee?.name ?? "This attendee"} is already checked in.`,
      });
    } else {
      doCheckIn(reg.id, true);
      toast.success("Checked in", {
        description: `${attendee?.name ?? "This attendee"} is now checked in.`,
      });
    }
    setScanCode("");
    setScanOpen(false);
  };

  if (!event) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={AlertCircle}
          title="Event not found"
          description=""
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <p className="text-xs font-mono text-muted-foreground mb-1">
            Attendee Roster
          </p>
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-xl sm:text-2xl font-semibold"
          >
            {event.title}
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {format(parseISO(event.date), "d MMM yyyy")} ·{" "}
            {formatEventTime(event.start_time)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold">
            {event.registered_count}/{event.capacity}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            registered
          </p>
          <p className="text-xs text-quaternary font-mono mt-0.5">
            {checkedInCount} checked in
          </p>
          {event.waitlisted_count > 0 && (
            <p className="text-xs text-accent font-mono mt-0.5">
              {event.waitlisted_count} waitlisted
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <CapacityBar
          registered={event.registered_count}
          capacity={event.capacity}
        />
        <Dialog open={scanOpen} onOpenChange={setScanOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto shrink-0 bg-primary hover:bg-primary/90">
              <CheckCircle2 className="size-4 mr-2" /> Scan
              Check-in
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Scan attendee QR</DialogTitle>
              <DialogDescription>
                Scan the attendee's QR with any reader and paste
                the decoded code below, or enter it manually to
                check them in.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label
                htmlFor="scan-code"
                className="text-xs font-mono"
              >
                Check-in code
              </Label>
              <Input
                id="scan-code"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                placeholder="CHK|event_1|reg_1"
                onKeyDown={(e) =>
                  e.key === "Enter" && handleScan()
                }
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setScanOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleScan}
                disabled={!scanCode.trim()}
              >
                Check in
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="registered" className="mt-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="registered">
            Registered ({event.registered_count})
          </TabsTrigger>
          <TabsTrigger value="waitlisted">
            Waitlist ({event.waitlisted_count})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registered" className="mt-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-mono">
                      #
                    </TableHead>
                    <TableHead className="text-xs font-mono">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-mono">
                      Department
                    </TableHead>
                    <TableHead className="text-xs font-mono">
                      Registered At
                    </TableHead>
                    <TableHead className="text-xs font-mono text-right">
                      Check-in
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {realRegistered.map((r, i) => {
                    const user = store.users.find(
                      (u) => u.id === r.user_id,
                    );
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {i + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px]">
                                {getInitials(user?.name ?? "?")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {user?.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {user?.department}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {format(
                            parseISO(r.registered_at),
                            "d MMM · HH:mm",
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.checked_in ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-quaternary hover:text-quaternary h-7"
                              onClick={() =>
                                doCheckIn(r.id, false)
                              }
                            >
                              <BadgeCheck className="size-3.5 mr-1" />{" "}
                              In
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7"
                              onClick={() =>
                                doCheckIn(r.id, true)
                              }
                            >
                              Check in
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {fakeAttendees.map((name, i) => (
                    <TableRow key={`fake_${i}`}>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {realRegistered.length + i + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                            <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        CSE
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        —
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono text-muted-foreground">
                        —
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="waitlisted" className="mt-4">
          {realWaitlisted.length === 0 &&
          event.waitlisted_count === 0 ? (
            <EmptyState
              icon={Hourglass}
              title="No one on waitlist"
              description="Waitlist is empty."
            />
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-mono">
                        Position
                      </TableHead>
                      <TableHead className="text-xs font-mono">
                        Name
                      </TableHead>
                      <TableHead className="text-xs font-mono">
                        Joined Waitlist
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {realWaitlisted.map((r, i) => {
                      const user = store.users.find(
                        (u) => u.id === r.user_id,
                      );
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs font-mono text-accent font-semibold">
                            #{i + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-6">
                                <AvatarFallback className="bg-accent/10 text-foreground text-[10px]">
                                  {getInitials(user?.name ?? "?")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {user?.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {format(
                              parseISO(r.registered_at),
                              "d MMM · HH:mm",
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Membership Requests ──────────────────────────────────────────────────────
