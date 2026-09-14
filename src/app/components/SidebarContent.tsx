
import {
  LayoutDashboard,
  CalendarDays,
  Users, UserCheck, BookOpen,
  Shield, Globe
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
} from "./ui/avatar";
import { getInitials } from "../lib/uiHelpers";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { NavLink } from "./NavLink";

export function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { currentUser, isStudent, isCoordinator, isClubAdmin, isSuperAdmin } =
    useAuth();
  const { store } = useData();

  const myClub = isClubAdmin
    ? store.clubs.find(
        (c) => c.admin_user_id === currentUser?.id,
      )
    : null;

  const coordinatorClubs = isCoordinator
    ? store.clubs.filter((c) =>
        (c.coordinator_ids ?? []).includes(currentUser?.id ?? ""),
      )
    : [];

  const pendingRequests = myClub
    ? store.memberships.filter(
        (m) =>
          m.club_id === myClub.id && m.status === "pending",
      ).length
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded bg-sidebar-primary/20 flex items-center justify-center">
            <BookOpen className="size-4 text-sidebar-primary" />
          </div>
          <div>
            <p
              className="text-sm font-bold text-sidebar-foreground leading-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              IUB Campus
            </p>
            <p className="text-[10px] text-sidebar-foreground/85 font-mono uppercase tracking-wide">
              Event & Club Hub
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {isStudent && (
          <NavLink
            to="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            onClick={onClose}
          />
        )}
        <NavLink
          to="/events"
          icon={CalendarDays}
          label="Events"
          onClick={onClose}
        />
        <NavLink
          to="/clubs"
          icon={Globe}
          label="Clubs"
          onClick={onClose}
        />
        {isCoordinator && coordinatorClubs.length > 0 && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-mono font-medium text-sidebar-foreground/85 uppercase tracking-wider">
                Co-ordinator
              </p>
            </div>
            <NavLink
              to="/coordinator"
              icon={LayoutDashboard}
              label="Dashboard"
              onClick={onClose}
            />
            <NavLink
              to="/admin/events"
              icon={CalendarDays}
              label="Manage Events"
              onClick={onClose}
            />
          </>
        )}
        {isClubAdmin && myClub && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-mono font-medium text-sidebar-foreground/85 uppercase tracking-wider">
                Club Admin
              </p>
            </div>
            <NavLink
              to="/admin/dashboard"
              icon={LayoutDashboard}
              label="Admin Dashboard"
              onClick={onClose}
            />
            <NavLink
              to="/admin/events"
              icon={CalendarDays}
              label="Manage Events"
              onClick={onClose}
            />
            <NavLink
              to="/admin/requests"
              icon={UserCheck}
              label="Membership Requests"
              badge={pendingRequests}
              onClick={onClose}
            />
            <NavLink
              to="/admin/members"
              icon={Users}
              label="Member Roster"
              onClick={onClose}
            />
          </>
        )}

        {isSuperAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-mono font-medium text-sidebar-foreground/85 uppercase tracking-wider">
                Administration
              </p>
            </div>
            <NavLink
              to="/superadmin"
              icon={Shield}
              label="Admin Console"
              onClick={onClose}
            />
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold">
              {getInitials(currentUser?.name ?? "U")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {currentUser?.name}
            </p>
            <p className="text-[10px] text-sidebar-foreground/85 font-mono truncate">
              {currentUser?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

