import { createContext, useContext } from "react";
import type { User, UserRole } from "../lib/store";

// ─── Auth Context ─────────────────────────────────────────────────────────────

/** Landing route for a role right after login / when hitting "/dashboard". */
export function roleHome(role: UserRole | undefined): string {
  switch (role) {
    case "super_admin":
      return "/superadmin";
    case "club_admin":
      return "/admin/dashboard";
    case "coordinator":
      return "/coordinator";
    default:
      return "/dashboard";
  }
}

export interface AuthContextValue {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    student_id: string;
    department: string;
    password: string;
  }) => Promise<void>;
  switchRole: (userId: string) => void;
  logout: () => void;
  isStudent: boolean;
  isCoordinator: boolean;
  isClubAdmin: boolean;
  isSuperAdmin: boolean;
}

export const AuthContext = createContext<AuthContextValue>(
  {} as AuthContextValue,
);
export const useAuth = () => useContext(AuthContext);
