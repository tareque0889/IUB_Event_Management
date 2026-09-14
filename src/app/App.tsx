import { lazy, Suspense, type ComponentType } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router";
import { Toaster } from "sonner";
import { Providers } from "./context/Providers";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthPageSkeleton, PageSkeleton } from "./components/skeletons";
// Landing + Login stay in the entry chunk: they're the first thing every
// visitor sees, so lazy-loading them would only add a round trip.
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";

/**
 * Wraps a dynamic import of a module that uses a *named* export so it can be
 * fed to React.lazy (which expects a default export).
 */
function lazyNamed<TModule, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  key: TKey,
) {
  return lazy(async () => {
    const mod = await loader();
    return { default: mod[key] as unknown as ComponentType<any> };
  });
}

// Every route below is its own chunk; Vite emits one file per page and
// Rollup drops page-specific vendors (recharts, qrcode) into those chunks.
const RegisterPage = lazyNamed(() => import("./pages/RegisterPage"), "RegisterPage");
const ForgotPasswordPage = lazyNamed(() => import("./pages/ForgotPasswordPage"), "ForgotPasswordPage");
const DashboardPage = lazyNamed(() => import("./pages/DashboardPage"), "DashboardPage");
const EventFeedPage = lazyNamed(() => import("./pages/EventFeedPage"), "EventFeedPage");
const EventDetailPage = lazyNamed(() => import("./pages/EventDetailPage"), "EventDetailPage");
const ClubDirectoryPage = lazyNamed(() => import("./pages/ClubDirectoryPage"), "ClubDirectoryPage");
const ClubDetailPage = lazyNamed(() => import("./pages/ClubDetailPage"), "ClubDetailPage");
const ProfilePage = lazyNamed(() => import("./pages/ProfilePage"), "ProfilePage");
const NotificationsPage = lazyNamed(() => import("./pages/NotificationsPage"), "NotificationsPage");
const AdminDashboardPage = lazyNamed(() => import("./pages/AdminDashboardPage"), "AdminDashboardPage");
const CoordinatorDashboard = lazyNamed(() => import("./pages/CoordinatorDashboard"), "CoordinatorDashboard");
const EventManagePage = lazyNamed(() => import("./pages/EventManagePage"), "EventManagePage");
const EventFormPage = lazyNamed(() => import("./pages/EventFormPage"), "EventFormPage");
const AttendeeRosterPage = lazyNamed(() => import("./pages/AttendeeRosterPage"), "AttendeeRosterPage");
const MembershipRequestsPage = lazyNamed(() => import("./pages/MembershipRequestsPage"), "MembershipRequestsPage");
const MemberRosterPage = lazyNamed(() => import("./pages/MemberRosterPage"), "MemberRosterPage");
const SuperAdminPage = lazyNamed(() => import("./pages/SuperAdminPage"), "SuperAdminPage");
const ClubApplicationForm = lazyNamed(() => import("./pages/ClubApplicationForm"), "ClubApplicationForm");
const EventRegistrationForm = lazyNamed(() => import("./pages/EventRegistrationForm"), "EventRegistrationForm");

export default function App() {
  const routerBase = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") || "/";

  return (
    <Providers>
      <BrowserRouter basename={routerBase}>
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            style: {
              fontFamily:
                "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: "13px",
            },
          }}
        />
        <AppContent />
      </BrowserRouter>
    </Providers>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/register"
        element={
          <Suspense fallback={<AuthPageSkeleton />}>
            <RegisterPage />
          </Suspense>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <Suspense fallback={<AuthPageSkeleton />}>
            <ForgotPasswordPage />
          </Suspense>
        }
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              {/* One Suspense boundary for all in-shell routes keeps the
                  sidebar/top bar mounted while a page chunk downloads. */}
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route
                    path="dashboard"
                    element={<DashboardPage />}
                  />
                  <Route
                    path="events"
                    element={<EventFeedPage />}
                  />
                  <Route
                    path="events/:id"
                    element={<EventDetailPage />}
                  />
                  <Route
                    path="clubs"
                    element={<ClubDirectoryPage />}
                  />
                  <Route
                    path="clubs/:id"
                    element={<ClubDetailPage />}
                  />
                  <Route
                    path="clubs/:id/apply"
                    element={
                      <ProtectedRoute role="student">
                        <ClubApplicationForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="events/:id/register"
                    element={
                      <ProtectedRoute role="student">
                        <EventRegistrationForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="notifications"
                    element={<NotificationsPage />}
                  />
                  <Route
                    path="profile"
                    element={<ProfilePage />}
                  />

                  <Route
                    path="coordinator"
                    element={
                      <ProtectedRoute role="coordinator">
                        <CoordinatorDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="admin/dashboard"
                    element={
                      <ProtectedRoute role="club_admin">
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/events"
                    element={
                      <ProtectedRoute role={["club_admin", "coordinator"]}>
                        <EventManagePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/events/new"
                    element={
                      <ProtectedRoute role={["club_admin", "coordinator"]}>
                        <EventFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/events/edit/:id"
                    element={
                      <ProtectedRoute role={["club_admin", "coordinator"]}>
                        <EventFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/events/:id/roster"
                    element={
                      <ProtectedRoute role={["club_admin", "coordinator"]}>
                        <AttendeeRosterPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/requests"
                    element={
                      <ProtectedRoute role="club_admin">
                        <MembershipRequestsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/members"
                    element={
                      <ProtectedRoute role="club_admin">
                        <MemberRosterPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="superadmin"
                    element={
                      <ProtectedRoute role="super_admin">
                        <SuperAdminPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                  <Route
                    index
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </Suspense>
            </AppShell>
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}
