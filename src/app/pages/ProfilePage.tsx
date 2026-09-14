import {
  useState, useEffect
} from "react";

import {
  Users, Ticket, Edit3
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription, CardHeader,
  CardTitle
} from "../components/ui/card";
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
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { getInitials, roleBadge } from "../lib/uiHelpers";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { StatCard } from "../components/StatCard";

export function ProfilePage() {
  const { currentUser } = useAuth();
  const { store, doUpdateProfile } = useData();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    student_id: currentUser?.student_id ?? "",
    department: currentUser?.department ?? "",
    bio: currentUser?.bio ?? "",
  });

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name,
        student_id: currentUser.student_id,
        department: currentUser.department,
        bio: currentUser.bio ?? "",
      });
    }
  }, [currentUser]);

  const myRegs = store.registrations.filter(
    (r) => r.user_id === currentUser?.id,
  );
  const myMems = store.memberships.filter(
    (m) =>
      m.user_id === currentUser?.id && m.status === "approved",
  );

  if (!currentUser) return null;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Account
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-2xl sm:text-3xl font-semibold"
        >
          My Profile
        </h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_240px] gap-6">
        <Card className="border-border">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {currentUser.name}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs mt-0.5">
                    {currentUser.email}
                  </CardDescription>
                  <Badge
                    className={`mt-2 text-xs font-mono ${roleBadge(currentUser.role)}`}
                    variant="outline"
                  >
                    {currentUser.role.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setEditing(!editing)}
              >
                <Edit3 className="size-3.5 mr-1.5" />{" "}
                {editing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Student ID</Label>
                  <Input
                  value={form.student_id}
                  onChange={(e) =>
                    setForm({ ...form, student_id: e.target.value })
                  }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select
                    value={form.department}
                    onValueChange={(v) =>
                      setForm({ ...form, department: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "CSE",
                        "EEE",
                        "BBA",
                        "MBA",
                        "ECO",
                        "PHY",
                        "ENG",
                        "SOC",
                      ].map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Bio</Label>
                  <Textarea
                    value={form.bio}
                    onChange={(e) =>
                      setForm({ ...form, bio: e.target.value })
                    }
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="resize-none"
                  />
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    doUpdateProfile(form);
                    setEditing(false);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">
                      Student ID
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {currentUser.student_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">
                      Department
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {currentUser.department}
                    </p>
                  </div>
                </div>
                {currentUser.bio && (
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">
                      Bio
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {currentUser.bio}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <StatCard
            icon={Ticket}
            label="Events"
            value={myRegs.length}
            sub="registered total"
          />
          <StatCard
            icon={Users}
            label="Clubs"
            value={myMems.length}
            sub="active memberships"
            color="green"
          />
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs font-mono text-muted-foreground mb-2">
              My Clubs
            </p>
            <div className="space-y-2">
              {myMems.slice(0, 3).map((m) => {
                const club = store.clubs.find(
                  (c) => c.id === m.club_id,
                );
                return club ? (
                  <div
                    key={m.id}
                    className="text-xs font-medium truncate"
                  >
                    {club.short_name}
                  </div>
                ) : null;
              })}
              {myMems.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No memberships yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────
