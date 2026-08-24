import { createContext, useContext } from "react";
import type {
  StoreState,
  User,
  UserRole,
  ClubRole,
  Event,
  RoleRequest,
} from "../lib/store";

// ─── Data Context ─────────────────────────────────────────────────────────────

export interface DataContextValue {
  store: StoreState;
  doRegister: (
    eventId: string,
    contact?: {
      full_name?: string;
      contact_email?: string;
      phone?: string;
    },
  ) => void;
  doCancel: (eventId: string) => void;
  doApplyClub: (
    clubId: string,
    application?: {
      contact_email?: string;
      phone?: string;
      motivation?: string;
    },
  ) => void;
  doReviewMembership: (
    membershipId: string,
    action: "approved" | "rejected",
  ) => void;
  doRemoveMember: (membershipId: string) => void;
  doAssignRoles: (clubId: string) => void;
  doUpdateMemberRole: (membershipId: string, newRole: ClubRole) => void;
  doCreateEvent: (
    data: Omit<
      Event,
      "id" | "registered_count" | "waitlisted_count"
    >,
  ) => void;
  doUpdateEvent: (
    eventId: string,
    updates: Partial<Event>,
  ) => void;
  doCancelEvent: (eventId: string) => void;
  doDeleteEvent: (eventId: string) => void;
  doDeleteClub: (clubId: string) => void;
  doMarkNotificationsRead: () => void;
  doUpdateProfile: (
    updates: Partial<Pick<User, "name" | "student_id" | "department" | "bio">>,
  ) => void;
  doRegisterUser: (data: {
    name: string;
    email: string;
    student_id: string;
    department: string;
  }) => string;
  doSubmitRoleRequest: (
    payload: Omit<
      RoleRequest,
      "id" | "user_id" | "status" | "created_at"
    >,
  ) => void;
  doReviewRoleRequest: (
    requestId: string,
    action: "approved" | "rejected",
  ) => void;
  doChangeUserRole: (userId: string, newRole: UserRole) => void;
  doCheckIn: (registrationId: string, value: boolean) => void;
  doToggleException: (eventId: string, date: string) => void;
  doSendDigest: () => void;
}

export const DataContext = createContext<DataContextValue>(
  {} as DataContextValue,
);
export const useData = () => useContext(DataContext);
