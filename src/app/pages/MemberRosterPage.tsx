import {
  useState,
  useCallback,
  useEffect
} from "react";

import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  Users, Plus, Trash2,
  Edit3
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
import type {
  ClubRole
} from "../lib/store";
import {
  fetchClubMembers,
  assignRoles as assignClubRolesApi,
  updateMemberRole as updateMemberRoleApi,
  deleteMember as deleteMemberApi,
  addMember as addMemberApi,
  updateMemberDetails as updateMemberDetailsApi,
  type GetClubMembersResponse,
  type MemberSummary,
} from "../services/memberService";
import { getInitials, roleBadgeClass } from "../lib/uiHelpers";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { EmptyState } from "../components/EmptyState";
import { HamsterLoader } from "../components/Spinner";

const CLUB_ROLES: ClubRole[] = [
  "President",
  "Vice President",
  "General Secretary",
  "Treasurer",
  "Organizing Secretary",
  "Event Manager",
  "Member",
];

/**
 * MemberRosterPage
 *
 * Single source of truth: both `totalCount` and `members` come from the same
 * GET /clubs/:clubId/members response so the count and the rendered list are
 * always in sync with the database.
 *
 * Mutations (remove, assign-roles, role-edit) call the backend directly and
 * re-fetch after each operation — no local derivation, no slice tricks.
 */
export function MemberRosterPage() {
  const { store } = useData();
  const { currentUser } = useAuth();

  const myClub = store.clubs.find(
    (c) => c.admin_user_id === currentUser?.id,
  );

  // ── API-sourced state ────────────────────────────────────────────────────
  const [apiData, setApiData] =
    useState<GetClubMembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [assigningRoles, setAssigningRoles] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // ── Add Member dialog state ──────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addStudentId, setAddStudentId] = useState("");
  const [addDept, setAddDept] = useState("CSE");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<ClubRole>("Member");
  const [addSaving, setAddSaving] = useState(false);

  // ── Edit Member dialog state ─────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<MemberSummary | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const DEPARTMENTS = ["CSE", "EEE", "BBA", "ENG", "Economics", "Architecture"];

  // Fetch members + authoritative count from the same DB query.
  const refresh = useCallback(async () => {
    if (!myClub) return;
    setLoading(true);
    try {
      const data = await fetchClubMembers(myClub.id);
      setApiData(data);
    } catch {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [myClub?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // totalCount = DB aggregate; members = DB rows — always the same dataset.
  const totalCount = apiData?.totalCount ?? 0;
  const members: MemberSummary[] = apiData?.members ?? [];

  // ── Mutations ────────────────────────────────────────────────────────────

  async function handleRemove(membershipId: string, memberName: string) {
    if (!myClub) return;
    setRemovingId(membershipId);
    try {
      await deleteMemberApi(myClub.id, membershipId);
      toast.info("Member removed", {
        description: `${memberName} removed from ${myClub.name}.`,
      });
      await refresh();
    } catch (err) {
      toast.error("Remove failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setRemovingId(null);
    }
  }

  async function handleAssignRoles() {
    if (!myClub) return;
    setAssigningRoles(true);
    try {
      // Backend runs Fisher-Yates shuffle, enforces exec-role limits, then
      // returns the updated list + count from the same query.
      const result = await assignClubRolesApi(myClub.id);
      setApiData(result);
      toast.success("Roles assigned", {
        description:
          "Executive and sub-committee roles have been randomly assigned.",
      });
    } catch (err) {
      toast.error("Role assignment failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setAssigningRoles(false);
    }
  }

  async function handleUpdateRole(membershipId: string, newRole: ClubRole) {
    if (!myClub) return;
    setUpdatingRoleId(membershipId);
    try {
      // Backend enforces exec-role limits before persisting.
      await updateMemberRoleApi(myClub.id, membershipId, newRole);
      toast.success("Role updated");
      await refresh();
    } catch (err) {
      toast.error("Role update failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUpdatingRoleId(null);
    }
  }

  async function handleAddMember() {
    if (!myClub) return;
    setAddSaving(true);
    try {
      const result = await addMemberApi(myClub.id, {
        name: addName,
        email: addEmail,
        student_id: addStudentId,
        department: addDept,
        password: addPassword || undefined,
        role: addRole,
      });
      setApiData(result);
      toast.success("Member added", {
        description: `${addName || addEmail} has been added to ${myClub.name}.`,
      });
      setAddOpen(false);
      setAddName(""); setAddEmail(""); setAddStudentId("");
      setAddDept("CSE"); setAddPassword(""); setAddRole("Member");
    } catch (err) {
      toast.error("Add failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setAddSaving(false);
    }
  }

  function openEditDialog(mem: MemberSummary) {
    setEditTarget(mem);
    setEditName(mem.name);
    setEditEmail(mem.email);
    setEditPassword("");
  }

  async function handleEditMember() {
    if (!myClub || !editTarget) return;
    setEditSaving(true);
    try {
      const result = await updateMemberDetailsApi(myClub.id, editTarget.id, {
        name: editName || undefined,
        email: editEmail || undefined,
        password: editPassword || undefined,
      });
      setApiData(result);
      toast.success("Member updated");
      setEditTarget(null);
    } catch (err) {
      toast.error("Update failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setEditSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
            Club Admin
          </p>
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-xl sm:text-2xl font-semibold"
          >
            Member Roster
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {myClub?.name} ·{" "}
            {loading ? "…" : `${totalCount} approved members`}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-3.5 mr-1.5" /> Add Member
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleAssignRoles()}
            disabled={assigningRoles || loading || totalCount === 0}
          >
            {assigningRoles ? "Assigning…" : "Assign Roles"}
          </Button>
        </div>
      </div>

      {/* ── Add Member Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Enter the member's details. If the email already has an account,
              that account will be linked. Otherwise a new account is created.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-mono">Full Name</Label>
              <Input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Farhan Ahmed"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono">Email</Label>
              <Input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="student@iub.edu.bd"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono">Student ID</Label>
                <Input
                  value={addStudentId}
                  onChange={(e) => setAddStudentId(e.target.value)}
                  placeholder="2321234"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono">Department</Label>
                <Select value={addDept} onValueChange={setAddDept}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono">
                Password{" "}
                <span className="text-muted-foreground">(required for new accounts)</span>
              </Label>
              <Input
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder="min. 8 characters"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono">Role</Label>
              <Select value={addRole} onValueChange={(v) => setAddRole(v as ClubRole)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLUB_ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs font-mono">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleAddMember()}
              disabled={addSaving || !addEmail}
            >
              {addSaving ? "Adding…" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Member Dialog ── */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update name, email, or password for {editTarget?.name}. Leave
              password blank to keep it unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-mono">Full Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono">Email</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono">
                New Password{" "}
                <span className="text-muted-foreground">(leave blank to keep)</span>
              </Label>
              <Input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="min. 8 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleEditMember()}
              disabled={editSaving}
            >
              {editSaving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
          <HamsterLoader label="Loading members" fontSize={7} />
          Loading members…
        </div>
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No members yet" description="" />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-mono">Member</TableHead>
                  <TableHead className="text-xs font-mono">Department</TableHead>
                  <TableHead className="text-xs font-mono">Role</TableHead>
                  <TableHead className="text-xs font-mono">Joined</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((mem) => (
                  <TableRow key={mem.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                            {getInitials(mem.name ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{mem.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {mem.student_id}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {mem.department}
                  </TableCell>

                  <TableCell>
                    <Select
                      value={mem.role ?? "Member"}
                      onValueChange={(val) =>
                        void handleUpdateRole(mem.id, val as ClubRole)
                      }
                      disabled={updatingRoleId === mem.id}
                    >
                      <SelectTrigger
                        className={`h-7 w-44 text-[10px] font-mono border ${roleBadgeClass(mem.role ?? "Member")}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLUB_ROLES.map((r) => (
                          <SelectItem
                            key={r}
                            value={r}
                            className="text-xs font-mono"
                          >
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {format(parseISO(mem.applied_at), "d MMM yyyy")}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(mem)}
                        title="Edit member details"
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      {mem.user_id !== currentUser?.id && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:bg-destructive/8"
                              disabled={removingId === mem.id}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Remove member?</DialogTitle>
                              <DialogDescription>
                                {mem.name} will be removed from{" "}
                                {myClub?.name}. They can re-apply later.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline">Cancel</Button>
                              <Button
                                variant="destructive"
                                disabled={removingId === mem.id}
                                onClick={() =>
                                  void handleRemove(mem.id, mem.name)
                                }
                              >
                                {removingId === mem.id
                                  ? "Removing…"
                                  : "Remove"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Super Admin Console ──────────────────────────────────────────────────────

// ─── Request Club Role (student → super admin) ────────────────────────────────
