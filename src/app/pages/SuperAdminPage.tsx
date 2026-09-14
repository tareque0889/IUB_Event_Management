import {
  useState
} from "react";
import { useDebouncedValue } from "../hooks/useDebounce";

import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  Users, Ticket,
  AlertCircle,
  CheckCircle2,
  XCircle, Trash2, BadgeCheck, Globe
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import type {
  UserRole
} from "../lib/store";
import { getInitials, roleBadge } from "../lib/uiHelpers";
import { useData } from "../context/DataContext";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { SearchInput } from "../components/SearchInput";

export function SuperAdminPage() {
  const {
    store,
    doDeleteEvent,
    doDeleteClub,
    doReviewRoleRequest,
    doChangeUserRole,
  } = useData();
  const [tab, setTab] = useState("requests");
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim().toLowerCase(), 250);

  const pendingRoleRequests = store.roleRequests.filter(
    (r) => r.status === "pending",
  );

  const allEvents = store.events.filter((e) => {
    return !q || e.title.toLowerCase().includes(q);
  });
  const allClubs = store.clubs.filter((c) => {
    return !q || c.name.toLowerCase().includes(q);
  });
  const allUsers = store.users.filter((u) => {
    return (
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const totalRegistrations = store.registrations.length;
  const pendingAllRequests = store.memberships.filter(
    (m) => m.status === "pending",
  ).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Super Admin
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-3xl font-semibold"
        >
          Admin Console
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          System-wide management dashboard
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={store.users.length}
        />
        <StatCard
          icon={Globe}
          label="Active Clubs"
          value={store.clubs.length}
          color="accent"
        />
        <StatCard
          icon={CalendarDays}
          label="Total Events"
          value={store.events.length}
          color="green"
        />
        <StatCard
          icon={Ticket}
          label="Registrations"
          value={totalRegistrations}
          color="purple"
        />
      </div>

      {(pendingRoleRequests.length > 0 ||
        pendingAllRequests > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 bg-accent/10 border border-accent/30 rounded-lg">
          <AlertCircle className="size-5 text-accent shrink-0" />
          <p className="text-sm text-foreground">
            {pendingRoleRequests.length > 0 && (
              <>
                <strong>{pendingRoleRequests.length}</strong>{" "}
                organizer request
                {pendingRoleRequests.length !== 1
                  ? "s"
                  : ""}{" "}
                awaiting your review.
              </>
            )}
            {pendingRoleRequests.length > 0 &&
              pendingAllRequests > 0 &&
              " · "}
            {pendingAllRequests > 0 && (
              <>
                <strong>{pendingAllRequests}</strong> club
                membership request
                {pendingAllRequests !== 1 ? "s" : ""} across all
                clubs.
              </>
            )}
          </p>
        </div>
      )}

      <div>
        <SearchInput
          className="w-full"
          label="ADMIN"
          placeholder="Search events, clubs, or users..."
          value={search}
          onChange={setSearch}
          ariaLabel="Search events, clubs, or users"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="requests">
            Requests
            {pendingRoleRequests.length > 0
              ? ` (${pendingRoleRequests.length})`
              : ""}
          </TabsTrigger>
          <TabsTrigger value="events">
            Events ({allEvents.length})
          </TabsTrigger>
          <TabsTrigger value="clubs">
            Clubs ({allClubs.length})
          </TabsTrigger>
          <TabsTrigger value="users">
            Users ({allUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="requests"
          className="mt-4 space-y-3"
        >
          {store.roleRequests.length === 0 ? (
            <EmptyState
              icon={BadgeCheck}
              title="No organizer requests"
              description="Student requests to lead or create clubs will appear here."
            />
          ) : (
            [...store.roleRequests]
              .sort((a, b) =>
                b.created_at.localeCompare(a.created_at),
              )
              .map((r) => {
                const applicant = store.users.find(
                  (u) => u.id === r.user_id,
                );
                const club = r.club_id
                  ? store.clubs.find((c) => c.id === r.club_id)
                  : null;
                return (
                  <div
                    key={r.id}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                          {getInitials(applicant?.name ?? "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">
                            {applicant?.name}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono"
                          >
                            {r.kind === "create_club"
                              ? "New Club"
                              : "Officer Role"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono ${
                              r.status === "pending"
                                ? "text-foreground border-accent/50"
                                : r.status === "approved"
                                  ? "text-foreground border-quaternary/50"
                                  : "text-destructive border-destructive/30"
                            }`}
                          >
                            {r.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {applicant?.email} ·{" "}
                          {r.created_at.slice(0, 10)}
                        </p>
                        <p className="text-sm mt-2">
                          Requesting{" "}
                          <strong>{r.requested_role}</strong>
                          {r.kind === "create_club" ? (
                            <>
                              {" "}
                              of new club{" "}
                              <strong>{r.club_name}</strong> (
                              {r.club_category})
                            </>
                          ) : (
                            <>
                              {" "}
                              of <strong>{club?.name}</strong>
                            </>
                          )}
                        </p>
                        {r.club_description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {r.club_description}
                          </p>
                        )}
                        {r.message && (
                          <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-border pl-2">
                            "{r.message}"
                          </p>
                        )}
                        {r.status === "pending" && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                              onClick={() =>
                                doReviewRoleRequest(
                                  r.id,
                                  "approved",
                                )
                              }
                            >
                              <CheckCircle2 className="size-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() =>
                                doReviewRoleRequest(
                                  r.id,
                                  "rejected",
                                )
                              }
                            >
                              <XCircle className="size-3.5 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-mono">
                    Event
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Club
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Regs
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEvents.map((e) => {
                  const club = store.clubs.find(
                    (c) => c.id === e.club_id,
                  );
                  const regs = store.registrations.filter(
                    (r) => r.event_id === e.id,
                  ).length;
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <p className="text-sm font-medium line-clamp-1">
                          {e.title}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {club?.short_name}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {format(parseISO(e.date), "d MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${
                            e.status === "published"
                              ? "text-foreground border-quaternary/40"
                              : e.status === "cancelled"
                                ? "text-destructive border-destructive/30"
                                : "text-muted-foreground"
                          }`}
                        >
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {regs}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Delete event?
                              </DialogTitle>
                              <DialogDescription>
                                Permanently delete "{e.title}"
                                and all its registrations.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline">
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  doDeleteEvent(e.id)
                                }
                              >
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="clubs" className="mt-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-mono">
                    Club
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Category
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Admin
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Members
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {allClubs.map((c) => {
                  const admin = store.users.find(
                    (u) => u.id === c.admin_user_id,
                  );
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded overflow-hidden bg-muted shrink-0">
                            <ImageWithFallback
                              src={c.cover_url}
                              alt={c.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-sm font-medium">
                            {c.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {c.category}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {admin?.name}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {c.member_count}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Remove club?
                              </DialogTitle>
                              <DialogDescription>
                                Permanently remove "{c.name}",
                                its events, and all memberships.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline">
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  doDeleteClub(c.id)
                                }
                              >
                                Remove
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-mono">
                    User
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Department
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Email
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Role / Change
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {u.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {u.student_id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {u.department}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${roleBadge(u.role)}`}
                        >
                          {u.role.replace("_", " ")}
                        </Badge>
                        <Select
                          value={u.role}
                          onValueChange={(v) =>
                            doChangeUserRole(
                              u.id,
                              v as UserRole,
                            )
                          }
                        >
                          <SelectTrigger className="h-7 w-[130px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">
                              Student
                            </SelectItem>
                            <SelectItem value="coordinator">
                              Co-ordinator
                            </SelectItem>
                            <SelectItem value="club_admin">
                              Club Admin
                            </SelectItem>
                            <SelectItem value="super_admin">
                              Super Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

