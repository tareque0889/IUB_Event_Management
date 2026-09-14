import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
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
import { persistAppState } from "../services/stateService";
import {
  migrateLegacyStore,
  persistStoreDiff,
  subscribeStore,
  type StoreMode,
} from "../services/firestore";
import { isFirebaseConfigured } from "../lib/firebase";
import { notifyLiveStore, registerLiveStore } from "../lib/liveStore";
import {
  createEmptyStore,
  createDemoStore,
} from "../lib/storeHelpers";
import {
  AuthContext,
  type AuthContextValue,
} from "./AuthContext";
import {
  ActionsContext,
  StoreContext,
  type DataActions,
} from "./DataContext";
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

  // Expose the live store to non-React modules (e.g. memberService) and to
  // useStoreSelector. Registered during render (idempotent) so children can
  // read it on their very first render.
  registerLiveStore(() => storeRef.current, setStore);

  // Wake useStoreSelector subscribers after each committed store change.
  useEffect(() => {
    notifyLiveStore();
  }, [store]);

  // The authenticated identity is an email. currentUser is derived by matching
  // that email to a users record in the store.
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isBackendAvailable, setIsBackendAvailable] =
    useState(true);

  const currentUser = useMemo(
    () =>
      authEmail
        ? store.users.find(
            (u) => u.email.toLowerCase() === authEmail.toLowerCase(),
          ) ?? null
        : null,
    [store.users, authEmail],
  );
  const currentUserId = currentUser?.id ?? null;

  // Restore / track the Firebase Auth session (no-op in demo mode). The
  // first callback tells us whether a session was restored; Firestore
  // listeners are only attached after that so protected collections aren't
  // requested with the wrong identity.
  const [authResolved, setAuthResolved] = useState(!isFirebaseConfigured);
  useEffect(() => {
    return authService.onAuthChange((email) => {
      setAuthEmail(email);
      setAuthResolved(true);
    });
  }, []);

  // Where the data is coming from: per-entity collections (normal) or the
  // legacy single appState/main document (pre-migration / first run).
  const [mode, setMode] = useState<StoreMode>("legacy");
  // The last store known to match Firestore. Diffs are computed against it so
  // we only write documents the user actually changed. `null` means "no
  // trustworthy baseline yet" and blocks persistence entirely.
  const persistedRef = React.useRef<StoreState | null>(null);
  const migratingRef = React.useRef(false);

  const bootedRef = React.useRef(false);

  // Profile created during register / Google sign-in. The identity change
  // re-subscribes Firestore, and the incoming snapshot would otherwise wipe
  // the optimistic local user; it is re-applied on top of that snapshot and
  // persisted by the normal diff (or migration).
  const pendingProfileRef = React.useRef<Parameters<typeof registerUser>[1] | null>(null);

  const applyPendingProfile = useCallback((base: StoreState): StoreState => {
    const profile = pendingProfileRef.current;
    if (!profile) return base;
    const email = profile.email.toLowerCase();
    if (base.users.some((u) => u.email.toLowerCase() === email)) {
      pendingProfileRef.current = null;
      return base;
    }
    return registerUser(base, profile).state;
  }, []);

  // Live subscription to Firestore. First emission comes from the IndexedDB
  // cache (instant paint), later ones from the server / other users.
  //
  // Re-runs whenever the signed-in identity changes: onSnapshot listeners
  // that were denied for a signed-out visitor are terminal, so login must
  // attach fresh ones (and logout must drop the private data).
  useEffect(() => {
    if (!authResolved) return;

    if (!isFirebaseConfigured) {
      bootedRef.current = true;
      setStore(createDemoStore());
      setIsBackendAvailable(false);
      setIsBootstrapping(false);
      toast.info("Firebase not configured — demo mode enabled", {
        description:
          "Using local seeded demo data for login and browsing.",
      });
      return;
    }

    const enterDemoMode = (error: unknown) => {
      console.error("Failed to load Firebase state.", error);
      bootedRef.current = true;
      setStore(createDemoStore());
      setIsBackendAvailable(false);
      setIsBootstrapping(false);
      toast.info("Could not reach Firebase — demo mode enabled", {
        description:
          "Using local seeded demo data for login and browsing.",
      });
    };

    // No baseline until this subscription delivers; blocks the persist effect
    // from diffing stale/partial data against the new identity's view.
    persistedRef.current = null;

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeStore(
        ({ store: remote, mode: remoteMode, denied }) => {
          seedCounters(remote);
          const complete = denied.length === 0;
          // Only trust the snapshot as a write baseline when every collection
          // was readable; a signed-out view has empty private slices and must
          // never be diffed against (it would delete/zero real data).
          persistedRef.current = complete ? remote : null;
          setMode(remoteMode);
          // member_count is derived from memberships; skip the fix-up when that
          // slice is a permission placeholder rather than real data.
          const synced = complete ? syncMemberCounts(remote) : remote;
          setStore(complete ? applyPendingProfile(synced) : synced);
          setIsBackendAvailable(true);
          bootedRef.current = true;
          setIsBootstrapping(false);
        },
        (error) => {
          // A failure after the first successful load is transient (offline
          // etc.); the cache keeps serving. Only fall back before first paint.
          if (bootedRef.current) {
            console.error("Firestore subscription error.", error);
            return;
          }
          enterDemoMode(error);
        },
      );
    } catch (error) {
      enterDemoMode(error);
    }

    return () => unsubscribe?.();
  }, [authResolved, authEmail, applyPendingProfile]);

  // Persist local changes. Runs synchronously after commit (layout effect) so
  // the write reaches Firestore's local cache before any incoming snapshot
  // could overwrite the optimistic state.
  React.useLayoutEffect(() => {
    // Writes require an authenticated user (per Firestore rules), so only
    // persist when someone is signed in. This also avoids overwriting cloud
    // data from a logged-out browsing session.
    if (isBootstrapping || !isBackendAvailable || !authEmail) return;
    const prev = persistedRef.current;
    // No complete baseline from Firestore yet for this identity → wait.
    if (prev === null || prev === store) return;
    persistedRef.current = store;

    const reportFailure = (error: unknown) => {
      console.error("Failed to persist Firebase state.", error);
      toast.error("Failed to sync changes", {
        description:
          "Your latest updates were not saved to the cloud.",
      });
    };

    if (mode === "legacy") {
      // First signed-in session on a pre-migration database: copy the whole
      // snapshot into the per-entity collections once. The collection
      // listeners then take over and flip `mode` to "collections".
      if (migratingRef.current) return;
      migratingRef.current = true;
      void migrateLegacyStore(store)
        .then((stats) => {
          console.info(
            `Migrated appState/main → collections (${stats.sets} docs).`,
          );
        })
        .catch((error) => {
          migratingRef.current = false;
          console.error("Collection migration failed; using legacy doc.", error);
          // currentUser is auth-derived, so the shared snapshot stores no session id.
          return persistAppState({ store, currentUserId: null }).catch(
            reportFailure,
          );
        });
      return;
    }

    void persistStoreDiff(prev, store).catch(reportFailure);
  }, [
    store,
    mode,
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
    const exists = storeRef.current.users.some(
      (u) => u.email.toLowerCase() === email,
    );

    if (!exists) {
      const localPart = email.split("@")[0];
      pendingProfileRef.current = {
        name: displayName || localPart,
        email,
        student_id: localPart.toUpperCase(),
        department: "",
      };
      // Demo mode has no re-subscription, so apply immediately.
      if (!isFirebaseConfigured) setStore((s) => applyPendingProfile(s));
      toast.info("Google profile linked", {
        description:
          "Finish your profile from the account page if any details are missing.",
      });
    }

    setAuthEmail(email);
  }, [applyPendingProfile]);

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
      pendingProfileRef.current = {
        name: payload.name,
        email,
        student_id: payload.student_id,
        department: payload.department,
      };
      if (!isFirebaseConfigured) setStore((s) => applyPendingProfile(s));
      setAuthEmail(email);
    },
    [applyPendingProfile],
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
      // Read through the ref so this callback stays referentially stable.
      const { state: next, userId } = registerUser(storeRef.current, data);
      setStore(next);
      return userId;
    },
    [],
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

  const authValue = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isBootstrapping,
      login,
      signInWithGoogle,
      register,
      switchRole,
      logout,
      isStudent: currentUser?.role === "student",
      isCoordinator: currentUser?.role === "coordinator",
      isClubAdmin: currentUser?.role === "club_admin",
      isSuperAdmin: currentUser?.role === "super_admin",
    }),
    [currentUser, isBootstrapping, login, signInWithGoogle, register, switchRole, logout],
  );

  // Only the currentUserId-dependent callbacks change identity (on login /
  // logout); everything else is stable, so ActionsContext consumers almost
  // never re-render because of this object.
  const actions = useMemo<DataActions>(
    () => ({
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
    }),
    [
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
    ],
  );

  // Public routes (landing, login, register) paint immediately with an empty
  // store; only ProtectedRoute waits for the first snapshot. Blocking here
  // pushed LCP on the landing page behind the Firestore round-trip (~7 s on
  // a throttled mobile connection).
  return (
    <AuthContext.Provider value={authValue}>
      <ActionsContext.Provider value={actions}>
        <StoreContext.Provider value={store}>
          {children}
        </StoreContext.Provider>
      </ActionsContext.Provider>
    </AuthContext.Provider>
  );
}
