import React, {
  useState,
  useCallback,
  useEffect,
} from "react";
import { toast } from "sonner";
import type {
  StoreState,
  User,
  UserRole,
  ClubRole,
  Event,
  RoleRequest,
} from "../lib/store";
import {
  registerForEvent,
  cancelRegistration,
  applyToClub,
  reviewMembership,
  removeMember,
  assignClubRoles,
  updateMemberRole,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEventAdmin,
  deleteClubAdmin,
  markNotificationsRead,
  updateProfile,
  registerUser,
  submitRoleRequest,
  reviewRoleRequest,
  changeUserRole,
  seedCounters,
  syncMemberCounts,
  setCheckIn,
  toggleEventException,
  sendDigest,
} from "../lib/store";
import { authService } from "../services/authService";
import {
  fetchAppState,
  persistAppState,
} from "../services/stateService";
import { registerLiveStore } from "../lib/liveStore";
import {
  createEmptyStore,
  createDemoStore,
} from "../lib/storeHelpers";
import {
  AuthContext,
  type AuthContextValue,
} from "./AuthContext";
import {
  DataContext,
  type DataContextValue,
} from "./DataContext";
import { LoadingScreen } from "../components/Spinner";
export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store, setStore] = useState<StoreState>(createEmptyStore);
  // Always-current ref so callbacks with [] deps can read the latest store
  // without going stale.
  const storeRef = React.useRef<StoreState>(store);
  storeRef.current = store;

  // Expose the live store to non-React modules (e.g. memberService) so member
  // operations mutate the one source of truth and auto-persist.
  useEffect(() => {
    registerLiveStore(() => storeRef.current, setStore);
  }, []);

  // The authenticated identity is an email. currentUser is derived by matching
  // that email to a users record in the store.
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isBackendAvailable, setIsBackendAvailable] =
    useState(true);

  const currentUser = authEmail
    ? store.users.find(
        (u) => u.email.toLowerCase() === authEmail.toLowerCase(),
      ) ?? null
    : null;
  const currentUserId = currentUser?.id ?? null;

  // Restore / track the Firebase Auth session (no-op in demo mode).
  useEffect(() => {
    return authService.onAuthChange((email) => {
      setAuthEmail(email);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const snapshot = await fetchAppState();
        if (cancelled) return;
        seedCounters(snapshot.store);
        setStore(syncMemberCounts(snapshot.store));
        setIsBackendAvailable(true);
      } catch (error) {
        console.error("Failed to load Firebase state.", error);
        const demoStore = createDemoStore();
        if (cancelled) return;
        setStore(demoStore);
        setIsBackendAvailable(false);
        toast.info("Firebase not configured — demo mode enabled", {
          description:
            "Using local seeded demo data for login and browsing.",
        });
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Writes require an authenticated user (per Firestore rules), so only
    // persist when someone is signed in. This also avoids overwriting cloud
    // data from a logged-out browsing session.
    if (isBootstrapping || !isBackendAvailable || !authEmail) return;
    // currentUser is auth-derived, so the shared snapshot stores no session id.
    void persistAppState({ store, currentUserId: null }).catch((error) => {
      console.error("Failed to persist Firebase state.", error);
      toast.error("Failed to sync changes", {
        description:
          "Your latest updates were not saved to the cloud.",
      });
    });
  }, [
    store,
    authEmail,
    isBootstrapping,
    isBackendAvailable,
  ]);

  const login = useCallback(
    async (email: string, password: string) => {
      const authedEmail = await authService.login({ email, password });
      setAuthEmail(authedEmail);
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    const { email, displayName } = await authService.loginWithGoogle();
    let createdProfile = false;

    setStore((s) => {
      const existing = s.users.find(
        (u) => u.email.toLowerCase() === email,
      );
      if (existing) return s;

      createdProfile = true;
      const localPart = email.split("@")[0];
      const { state } = registerUser(s, {
        name: displayName || localPart,
        email,
        student_id: localPart.toUpperCase(),
        department: "",
      });
      return state;
    });

    if (createdProfile) {
      toast.info("Google profile linked", {
        description:
          "Finish your profile from the account page if any details are missing.",
      });
    }

    setAuthEmail(email);
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      student_id: string;
      department: string;
      password: string;
    }) => {
      await authService.register(payload);
      const email = payload.email.trim().toLowerCase();
      setStore((s) => {
        const existing = s.users.find(
          (u) => u.email.toLowerCase() === email,
        );
        if (existing) return s;
        const { state } = registerUser(s, {
          name: payload.name,
          email,
          student_id: payload.student_id,
          department: payload.department,
        });
        return state;
      });
      setAuthEmail(email);
    },
    [],
  );

  const switchRole = useCallback((userId: string) => {
    const user = storeRef.current.users.find((u) => u.id === userId);
    setAuthEmail(user?.email ?? null);
  }, []);

  const logout = useCallback(() => {
    void authService.logout().catch((error) => {
      console.error("Failed to log out.", error);
      toast.error("Logout failed", {
        description: "Could not close your session.",
      });
    });
    setAuthEmail(null);
  }, []);

  const doRegister = useCallback(
    (
      eventId: string,
      contact?: {
        full_name?: string;
        contact_email?: string;
        phone?: string;
      },
    ) => {
      setStore((s) => {
        const event = s.events.find((e) => e.id === eventId)!;
        const isFull = event.registered_count >= event.capacity;
        if (isFull) {
          toast.error("Seats are full", {
            description: `"${event.title}" has no available seats.`,
          });
          return s;
        }
        const next = registerForEvent(
          s,
          currentUserId ?? "",
          eventId,
          contact,
        );
        toast.success("Registered successfully!", {
          description: `See you at "${event.title}"!`,
        });
        return next;
      });
    },
    [currentUserId],
  );

  const doCancel = useCallback(
    (eventId: string) => {
      setStore((s) => {
        const event = s.events.find((e) => e.id === eventId)!;
        const next = cancelRegistration(
          s,
          currentUserId ?? "",
          eventId,
        );
        toast.info("Registration cancelled", {
          description: `Cancelled for "${event.title}".`,
        });
        return next;
      });
    },
    [currentUserId],
  );

  const doApplyClub = useCallback(
    (
      clubId: string,
      application?: {
        contact_email?: string;
        phone?: string;
        motivation?: string;
      },
    ) => {
      setStore((s) => {
        const club = s.clubs.find((c) => c.id === clubId)!;
        const next = applyToClub(
          s,
          currentUserId ?? "",
          clubId,
          application,
        );
        toast.success("Application submitted", {
          description: `Your request to join ${club.name} has been sent.`,
        });
        return next;
      });
    },
    [currentUserId],
  );

  const doReviewMembership = useCallback(
    (membershipId: string, action: "approved" | "rejected") => {
      setStore((s) => {
        const mem = s.memberships.find(
          (m) => m.id === membershipId,
        );
        const user = s.users.find((u) => u.id === mem?.user_id);
        const next = reviewMembership(s, membershipId, action);
        toast.success(
          action === "approved"
            ? "Member approved"
            : "Application rejected",
          {
            description: `${user?.name ?? "The member"}'s request was ${action}.`,
          },
        );
        return next;
      });
    },
    [],
  );

  const doRemoveMember = useCallback((membershipId: string) => {
    const mem = storeRef.current.memberships.find((m) => m.id === membershipId);
    const userName = storeRef.current.users.find((u) => u.id === mem?.user_id)?.name ?? "Member";
    setStore((s) => removeMember(s, membershipId));
    toast.info("Member removed", { description: `${userName} removed from club.` });
  }, []);

  const doAssignRoles = useCallback((clubId: string) => {
    setStore((s) => assignClubRoles(s, clubId));
    toast.success("Roles assigned", {
      description:
        "Executive and sub-committee roles have been randomly assigned.",
    });
  }, []);

  const doUpdateMemberRole = useCallback(
    (membershipId: string, newRole: ClubRole) => {
      try {
        setStore((s) => updateMemberRole(s, membershipId, newRole));
        toast.success("Role updated");
      } catch (err) {
        toast.error("Role update failed", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    },
    [],
  );

  const doCreateEvent = useCallback(
    (
      data: Omit<
        Event,
        "id" | "registered_count" | "waitlisted_count"
      >,
    ) => {
      setStore((s) => {
        const next = createEvent(s, data);
        toast.success("Event created", {
          description: `"${data.title}" is now published.`,
        });
        return next;
      });
    },
    [],
  );

  const doUpdateEvent = useCallback(
    (eventId: string, updates: Partial<Event>) => {
      setStore((s) => {
        const next = updateEvent(s, eventId, updates);
        toast.success("Event updated");
        return next;
      });
    },
    [],
  );

  const doCancelEvent = useCallback((eventId: string) => {
    setStore((s) => {
      const event = s.events.find((e) => e.id === eventId)!;
      const next = cancelEvent(s, eventId);
      toast.warning("Event cancelled", {
        description: `"${event.title}" cancelled. Attendees notified.`,
      });
      return next;
    });
  }, []);

  const doDeleteEvent = useCallback((eventId: string) => {
    setStore((s) => {
      const next = deleteEventAdmin(s, eventId);
      toast.info("Event deleted");
      return next;
    });
  }, []);

  const doDeleteClub = useCallback((clubId: string) => {
    setStore((s) => {
      const next = deleteClubAdmin(s, clubId);
      toast.info("Club removed");
      return next;
    });
  }, []);

  const doMarkNotificationsRead = useCallback(() => {
    setStore((s) =>
      markNotificationsRead(s, currentUserId ?? ""),
    );
  }, [currentUserId]);

  const doUpdateProfile = useCallback(
    (
      updates: Partial<
        Pick<User, "name" | "student_id" | "department" | "bio">
      >,
    ) => {
      setStore((s) => {
        const next = updateProfile(
          s,
          currentUserId ?? "",
          updates,
        );
        toast.success("Profile updated");
        return next;
      });
    },
    [currentUserId],
  );

  const doRegisterUser = useCallback(
    (data: {
      name: string;
      email: string;
      student_id: string;
      department: string;
    }) => {
      const { state: next, userId } = registerUser(store, data);
      setStore(next);
      return userId;
    },
    [store],
  );

  const doSubmitRoleRequest = useCallback(
    (
      payload: Omit<
        RoleRequest,
        "id" | "user_id" | "status" | "created_at"
      >,
    ) => {
      setStore((s) => {
        const next = submitRoleRequest(
          s,
          currentUserId ?? "",
          payload,
        );
        toast.success("Request submitted", {
          description:
            "The Student Affairs office will review your request.",
        });
        return next;
      });
    },
    [currentUserId],
  );

  const doReviewRoleRequest = useCallback(
    (requestId: string, action: "approved" | "rejected") => {
      setStore((s) => {
        const next = reviewRoleRequest(s, requestId, action);
        toast.success(
          action === "approved"
            ? "Request approved"
            : "Request rejected",
        );
        return next;
      });
    },
    [],
  );

  const doChangeUserRole = useCallback(
    (userId: string, newRole: UserRole) => {
      setStore((s) => {
        const next = changeUserRole(s, userId, newRole);
        toast.success("User role updated");
        return next;
      });
    },
    [],
  );

  const doCheckIn = useCallback(
    (registrationId: string, value: boolean) => {
      setStore((s) => setCheckIn(s, registrationId, value));
    },
    [],
  );

  const doToggleException = useCallback(
    (eventId: string, date: string) => {
      setStore((s) => {
        const wasSkipped = (
          s.events.find((e) => e.id === eventId)
            ?.exception_dates ?? []
        ).includes(date);
        const next = toggleEventException(s, eventId, date);
        toast.info(
          wasSkipped ? "Session restored" : "Session cancelled",
          {
            description: `${wasSkipped ? "Re-added" : "Skipped"} the ${date} occurrence.`,
          },
        );
        return next;
      });
    },
    [],
  );

  const doSendDigest = useCallback(() => {
    setStore((s) => {
      const next = sendDigest(s, currentUserId ?? "");
      toast.success("Digest sent", {
        description:
          "Your reminder digest is in your notifications.",
      });
      return next;
    });
  }, [currentUserId]);

  const authValue: AuthContextValue = {
    currentUser,
    login,
    signInWithGoogle,
    register,
    switchRole,
    logout,
    isStudent: currentUser?.role === "student",
    isCoordinator: currentUser?.role === "coordinator",
    isClubAdmin: currentUser?.role === "club_admin",
    isSuperAdmin: currentUser?.role === "super_admin",
  };

  if (isBootstrapping) {
    return <LoadingScreen label="Loading campus hub..." />;
  }

  const dataValue: DataContextValue = {
    store,
    doRegister,
    doCancel,
    doApplyClub,
    doReviewMembership,
    doRemoveMember,
    doAssignRoles,
    doUpdateMemberRole,
    doCreateEvent,
    doUpdateEvent,
    doCancelEvent,
    doDeleteEvent,
    doDeleteClub,
    doMarkNotificationsRead,
    doUpdateProfile,
    doRegisterUser,
    doSubmitRoleRequest,
    doReviewRoleRequest,
    doChangeUserRole,
    doCheckIn,
    doToggleException,
    doSendDigest,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <DataContext.Provider value={dataValue}>
        {children}
      </DataContext.Provider>
    </AuthContext.Provider>
  );
}
