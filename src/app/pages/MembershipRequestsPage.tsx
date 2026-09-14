
import { format, parseISO } from "date-fns";
import {
  Users, CheckCircle2,
  XCircle, UserCheck
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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
import { getInitials } from "../lib/uiHelpers";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { EmptyState } from "../components/EmptyState";

export function MembershipRequestsPage() {
  const { store, doReviewMembership } = useData();
  const { currentUser } = useAuth();

  const myClub = store.clubs.find(
    (c) => c.admin_user_id === currentUser?.id,
  );
  const pending = store.memberships
    .filter(
      (m) => m.club_id === myClub?.id && m.status === "pending",
    )
    .map((m) => ({
      ...m,
      user: store.users.find((u) => u.id === m.user_id),
    }));

  const reviewed = store.memberships
    .filter(
      (m) => m.club_id === myClub?.id && m.status !== "pending",
    )
    .sort((a, b) => b.applied_at.localeCompare(a.applied_at))
    .slice(0, 10)
    .map((m) => ({
      ...m,
      user: store.users.find((u) => u.id === m.user_id),
    }));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Club Admin
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-2xl font-semibold"
        >
          Membership Requests
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {myClub?.name}
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="bg-muted">
          <TabsTrigger value="pending">
            Pending{" "}
            {pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
          <TabsTrigger value="reviewed">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No pending requests"
              description="All requests have been reviewed."
            />
          ) : (
            <div className="space-y-3">
              {pending.map(({ user, ...mem }) => (
                <div
                  key={mem.id}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                      {getInitials(user?.name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {user?.department} · {user?.student_id}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      Applied{" "}
                      {format(
                        parseISO(mem.applied_at),
                        "d MMM yyyy",
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-quaternary hover:bg-quaternary/90 text-white"
                      onClick={() =>
                        doReviewMembership(mem.id, "approved")
                      }
                    >
                      <CheckCircle2 className="size-3.5 mr-1" />{" "}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/8"
                      onClick={() =>
                        doReviewMembership(mem.id, "rejected")
                      }
                    >
                      <XCircle className="size-3.5 mr-1" />{" "}
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="mt-4">
          {reviewed.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No history"
              description=""
            />
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-mono">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-mono">
                      Department
                    </TableHead>
                    <TableHead className="text-xs font-mono">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-mono">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewed.map(({ user, ...mem }) => (
                    <TableRow key={mem.id}>
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
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${
                            mem.status === "approved"
                              ? "text-foreground border-quaternary/40 bg-quaternary/10"
                              : "text-destructive border-destructive/30 bg-destructive/5"
                          }`}
                        >
                          {mem.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {format(
                          parseISO(mem.applied_at),
                          "d MMM yyyy",
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Member Roster ────────────────────────────────────────────────────────────

