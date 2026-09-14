# IUB Event & Club Management System

A web-based campus activity management platform developed for **Independent University, Bangladesh (IUB)**. It brings student clubs, events, registrations, memberships, notifications, and administrative workflows together in one centralized application.

**Live website:** https://iub-event-management.web.app

## Project overview

Information about university clubs and campus events is often scattered across different platforms and communication channels. This project gives IUB students and club organizers a single place to discover events, join clubs, register for activities, and manage extracurricular operations.

The platform is designed for:

- IUB students
- Event coordinators
- Club administrators
- System administrators

Account registration is restricted to users with a valid `@iub.edu.bd` email address.

## Core features

### Authentication and profiles

- Email/password authentication through Firebase Authentication
- Registration restricted to the IUB email domain
- Protected routes and role-based permissions
- User profiles with academic and personal information
- Password-reset support
- Local demo mode when Firebase is not configured

### Event discovery and registration

Students can:

- Browse and search published campus events
- View event dates, times, venues, organizers, and available capacity
- Submit contact information through an event registration form
- Join the waitlist when an event reaches capacity
- Cancel a registration or waitlist entry
- View registration status from their dashboard
- Present a personal QR code for event check-in

The registration workflow prevents duplicate entries and keeps confirmed and waitlisted attendees separate. Event organizers can view attendee rosters, monitor capacity, and record check-ins.

### Club discovery and membership

Students can explore university clubs, view club details, and submit membership applications containing their contact information and motivation.

Club administrators can:

- Review, approve, or reject membership applications
- Manage approved members
- Assign club-level roles and committee positions
- Organize club events
- View event attendees and check-in statistics

### Event management

Authorized club administrators and coordinators can:

- Create, edit, publish, and cancel events
- Set event dates, start and end times, venues, and capacities
- Add event descriptions, tags, and promotional images
- Create recurring daily, weekly, or monthly events
- Define exception dates for recurring events
- Review registered and waitlisted attendees
- Check in attendees using registration QR data

Coordinators can manage event operations only for their assigned clubs. Membership and club-member administration remain restricted to club administrators.

### Dashboards

Each role receives a dashboard tailored to its responsibilities:

- **Students:** registrations, memberships, upcoming activities, and notifications
- **Coordinators:** assigned-club events, attendance, and event operations
- **Club Admins:** club statistics, events, membership requests, and member management
- **Super Admins:** platform-wide users, clubs, roles, and administrative requests

### Notifications

In-app notifications keep users informed about:

- Event registrations and waitlist changes
- Event updates
- Membership decisions
- Role-request decisions
- General platform announcements

## User roles

The system uses four application roles with protected routes and role-specific capabilities.

### 1. Student

Students can:

- Browse clubs and published events
- Register for events or join waiting lists
- Apply for club membership
- View their personal dashboard
- Manage their profile
- Receive notifications
- Submit eligible club leadership or creation requests

Students cannot access administrative pages or view other students' private details.

### 2. Coordinator

Coordinators manage event operations for clubs assigned to them through the club's coordinator list.

They can:

- Create and edit events
- Manage event status and capacity
- View attendee and waitlist rosters
- Record attendee check-ins
- Monitor event performance

Coordinators cannot manage club memberships or approve member applications.

### 3. Club Admin

Club Admins manage the clubs for which they are responsible.

They can:

- Perform all club event-management tasks
- Review membership applications
- Approve or reject requests
- Manage member rosters
- Assign committee roles and permissions
- Monitor club and event statistics

Administrative permissions are limited to the relevant club or clubs.

### 4. Super Admin

The Super Admin provides system-level oversight and can:

- Monitor platform activity
- Manage users and application roles
- Review role and club-creation requests
- Oversee clubs, events, and memberships
- Manage administrative access

## Event registration flow

```text
Student opens an event
        |
        v
Completes registration form
        |
        v
System validates the request
        |
        v
System checks event capacity
       / \
      /   \
 Seat      Event
available   full
    |         |
    v         v
Registered  Waitlisted
    |         |
    +----+----+
         |
         v
Dashboard and notification updated
```

A student cannot be both registered and waitlisted for the same event, and duplicate registrations are blocked.

## Event creation flow

```text
Club Admin or Coordinator
           |
           v
    Opens event form
           |
           v
 Enters event information
           |
           v
  Saves or publishes event
           |
           v
  Event becomes available
  to the permitted audience
```

Only an authorized Club Admin or assigned Coordinator can manage an event for a club.

## Main data entities

| Entity | Purpose |
| --- | --- |
| **Users** | Stores identity, profile information, academic details, and application roles |
| **Clubs** | Stores club information and links clubs to administrators and coordinators |
| **Events** | Stores event details, capacity, publication status, recurrence, and organizer information |
| **Registrations** | Connects students to events with `registered` or `waitlisted` status and check-in data |
| **Memberships** | Connects students to clubs with `pending`, `approved`, or `rejected` status |
| **Notifications** | Stores user-specific event, membership, waitlist, role, and general updates |
| **Role requests** | Tracks requests to lead an existing club or create a new club |

## Technology stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI
- Lucide icons

### Backend and infrastructure

- Firebase Authentication for email/password identity
- Cloud Firestore for application-state persistence
- Firebase Hosting for deployment
- Firestore Security Rules for authenticated institutional writes

### Source control

- Git
- GitHub

## System architecture

```text
React + TypeScript frontend
           |
           +---- Firebase Authentication
           |
           +---- Cloud Firestore (one collection per entity, live onSnapshot)
           |       |
           |       +---- users / clubs / events
           |       +---- registrations / memberships / notifications / roleRequests
           |       `---- appState/main   (legacy snapshot, read only until migrated)
           |
           +---- Firebase Hosting (global CDN, immutable asset caching)
```

Each entity array of the in-memory `StoreState` maps to its own Firestore collection (document id = entity id). The client subscribes to every collection with `onSnapshot`, so all users see changes live, and the IndexedDB persistent cache lets repeat visits paint instantly and keep working offline. Business rules stay pure functions in `src/app/lib/store.ts`; after each state change `persistStoreDiff(prev, next)` writes only the documents that actually changed in a single `writeBatch`.

`clubs` and `events` are publicly readable so visitors can browse; `users`, `registrations`, `memberships`, `notifications` and `roleRequests` require a signed-in `@iub.edu.bd` account (every in-app route is behind `ProtectedRoute`, so anonymous visitors never need personal data). All writes require a signed-in `@iub.edu.bd` account and a document `id` that matches its path.

### Migrating from the legacy `appState/main` document

Older deployments kept the whole state in one document. Migration is automatic: the first signed-in user to load the app after deploy copies the snapshot into the collections (`migrateLegacyStore`) and the listeners switch over. To migrate from the CLI instead (admin credentials):

```bash
# Firebase console -> Project settings -> Service accounts -> Generate key
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
node scripts/migrate-appstate.mjs --project iub-event-management --dry-run
node scripts/migrate-appstate.mjs --project iub-event-management
```

## Performance notes

| Area | What is in place | Where |
| --- | --- | --- |
| Data reads | One `onSnapshot` per collection; IndexedDB `persistentLocalCache` (multi-tab); auto long-polling fallback | `src/app/lib/firebase.ts`, `src/app/services/firestore.ts` |
| Data writes | Per-entity diff → `writeBatch` (≤450 ops/batch) instead of rewriting the whole state | `src/app/services/firestore.ts` `persistStoreDiff` |
| Indexes | Composite indexes for events (status+date, club_id+date), registrations (event_id+status, user_id+registered_at), memberships (club_id+status), notifications (user_id+created_at); large text fields excluded from indexing | `firestore.indexes.json` |
| Re-renders | `StoreContext` / `ActionsContext` split; `useStoreSelector` (useSyncExternalStore + shallow equality); `React.memo` on `EventCard`, `ClubCard`, `StatCard`; O(1) index maps in `selectors.ts` | `src/app/context/DataContext.tsx`, `src/app/lib/selectors.ts` |
| Input | `useDebouncedValue` (250 ms) on event/club/admin search | `src/app/hooks/useDebounce.ts` |
| Code splitting | `React.lazy` for every page except Landing/Login; recharts and the QR encoder load only inside their route/dialog; vendor chunks `vendor-react`, `vendor-firebase`, `vendor-radix` | `src/app/App.tsx`, `vite.config.ts` |
| Assets | esbuild minify + Lightning CSS; `vite-plugin-image-optimizer`; `sharp` script emits WebP/AVIF siblings; `ImageWithFallback` adds `loading="lazy"`, `decoding="async"` and an Unsplash `srcSet` | `vite.config.ts`, `scripts/optimize-images.mjs`, `src/app/lib/imageUtils.ts` |
| Delivery | Fonts preconnected + non-blocking preload; Hosting sends `immutable` for hashed assets, `must-revalidate` for `index.html`, `stale-while-revalidate` for images | `index.html`, `firebase.json` |
| Skeletons | `Skeleton` primitive and composed `EventGridSkeleton`, `ClubGridSkeleton`, `StatRowSkeleton`, `TableSkeleton`, `PageSkeleton` used as Suspense fallbacks | `src/app/components/skeletons.tsx` |

### Profiling re-renders

1. Install the React Developer Tools extension and open the **Profiler** tab.
2. In the Profiler settings enable **Record why each component rendered while profiling** and, under Components, **Highlight updates when components render**.
3. Record while registering for an event on `/events`. Only the affected `EventCard`, the `NotificationBell` badge and the page header should flash; other cards must not.
4. If a component re-renders on every store change, read its slice through `useStoreSelector` and dispatch through `useActions()` instead of `useData()`.

### Regional and scale considerations

- Firebase Hosting is already anycast + CDN; there is no load balancer to configure. Check the Firestore location with `node .\node_modules\firebase-tools\lib\bin\firebase.js firestore:databases:list` — `asia-south1` (Mumbai) is the closest region to Dhaka.
- If Cloud Functions are added later, pin them to the same region: `setGlobalOptions({ region: "asia-south1", maxInstances: 10 })` and set `Cache-Control: public, max-age=300, s-maxage=600` on any public HTTP endpoint so the Hosting CDN caches it at the edge.
- Firestore has no connection pool: the SDK multiplexes every listener over one stream per `Firestore` instance. The real limits are duplicate `initializeApp` calls (guarded with `getApps()`), listener count (7 collection listeners, never per-card) and write frequency (now one batch per user action).
- When a collection outgrows "load everything" (roughly >500 events), replace that listener with a cursor query: `query(collection(db, "events"), where("status", "==", "published"), orderBy("date"), startAfter(lastDoc), limit(24))` — the composite index is already declared.

### Bundle and dependency hygiene

```powershell
node .\node_modules\depcheck\bin\depcheck.js          # unused dependencies
node .\node_modules\vite\bin\vite.js build            # chunk sizes are printed per file
node scripts\optimize-images.mjs                       # regenerate WebP/AVIF for src/assets
```

`lighthouserc.json` holds performance budgets for `@lhci/cli`; run `npx lhci autorun` (or `node .\node_modules\@lhci\cli\src\cli.js autorun` on Windows) against `vite preview` after installing `@lhci/cli` to fail the build when the budgets regress.

## Demo mode credentials

When Firebase configuration is absent, the application runs with seeded local data and no persistence.

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@iub.edu.bd` | `Admin@12345` |
| Club Admin | `shoikat.azad@iub.edu.bd` | `Club@12345` |
| Coordinator | `coordinator@iub.edu.bd` | `Coord@12345` |
| Student | `anika.rahman@iub.edu.bd` | `Student@12345` |

## Local development

### Prerequisites

- Node.js 20 or newer
- npm
- Git
- A Firebase project for persistent mode

### Setup

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` or `.env.local`.
4. Add the Firebase web configuration values:

   ```env
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

5. Start the Vite development server:

   ```bash
   npm run dev
   ```

Leave the Firebase values blank to use local demo mode.

## Build and deployment

Create a production build:

```bash
npm run build
```

Deploy the application using Firebase CLI (hosting, rules and indexes):

```bash
npm run deploy
```

Deploy only the Firestore rules and composite indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes --project iub-event-management
```

On Windows systems where PowerShell blocks `.ps1` command shims, invoke the installed tools through Node:

```powershell
node .\node_modules\typescript\bin\tsc --noEmit
node .\node_modules\vite\bin\vite.js build
node .\node_modules\firebase-tools\lib\bin\firebase.js deploy --project iub-event-management
```

## Repository structure

```text
IUB_Event_Management/
|-- public/                  Static assets
|-- scripts/                 Image optimisation and Firestore migration scripts
|-- src/
|   |-- app/
|   |   |-- components/     Shared UI, skeletons and layout components
|   |   |-- context/        Authentication and application-state providers
|   |   |-- hooks/          Reusable hooks (useDebounce)
|   |   |-- lib/            Store types, business rules, selectors and helpers
|   |   |-- pages/          Public, student, and administrative pages
|   |   `-- services/       Firebase authentication and Firestore persistence
|   |-- assets/             Optimised raster images (JPEG + WebP + AVIF)
|   `-- styles/             Global styles
|-- .env.example            Firebase environment template
|-- firebase.json           Hosting (cache headers) and Firestore configuration
|-- firestore.rules         Firestore access rules (per collection)
|-- firestore.indexes.json  Firestore composite indexes
|-- lighthouserc.json       Lighthouse CI performance budgets
|-- package.json            Scripts and dependencies
`-- README.md
```

## Project scope

The current release focuses on the core campus event and club management workflow:

- Institutional email authentication
- Role-based access control
- Club and event discovery
- Club membership applications
- Event registration and waiting lists
- Recurring event management
- Attendee rosters and QR-assisted check-in
- Club member and committee management
- Role-specific dashboards
- In-app notifications

The project does not currently include:

- Integration with IUB's academic portal or SSO
- Native Android or iOS applications
- Direct financial payment processing
- Production-grade per-entity Firestore authorization
- Email or SMS notification delivery

## Educational use

This project was developed for academic and demonstration purposes as part of **CSE 309 - Web Applications & Internet** at **Independent University, Bangladesh**.

Its goal is to demonstrate the design and implementation of a complete web application involving responsive frontend development, authentication, authorization, cloud persistence, role-driven workflows, and structured software engineering practices.
