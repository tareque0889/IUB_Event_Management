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

- Firebase Authentication for email/password and Google (`@iub.edu.bd`) identity
- Cloud Firestore (one collection per entity, live `onSnapshot`, IndexedDB offline cache)
- Firebase Hosting (global CDN, Brotli, immutable asset caching, security headers)
- Firestore Security Rules for per-collection read policy and authenticated institutional writes
- Firestore composite indexes for the hot query paths

### Tooling

- graphify — local tree-sitter knowledge graph of the codebase (see [Code knowledge graph](#code-knowledge-graph-graphify))
- Playwright + axe-core — end-to-end and WCAG 2.1 AA tests (see [Testing](#testing))
- Lighthouse, depcheck, vite-plugin-image-optimizer, sharp, Lightning CSS, Lighthouse CI budgets

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

### Session-aware data loading

`Providers.tsx` attaches the Firestore listeners only after Firebase Auth has reported the restored session, and re-attaches them whenever the signed-in identity changes (login, logout, account switch). This matters because a Firestore listener that is denied by the security rules is terminal — it never recovers on its own. The snapshot handed to the app carries a `denied` list of collections the current identity could not read; while any slice is denied the client:

- shows the readable public data (`clubs`, `events`) as normal,
- **never** treats the partial snapshot as a write baseline, so a logged-out browse can't zero `member_count` or delete private documents,
- skips the `syncMemberCounts` fix-up, which would otherwise be derived from an empty placeholder.

A profile created during sign-up or first Google login is held in `pendingProfileRef` and re-applied on top of the first complete snapshot for the new identity, then persisted by the regular diff. If Firestore is unreachable and the local cache is empty, `subscribeStore` gives up after 10 s and the app falls back to demo mode instead of spinning forever.

### Access policy

`clubs` and `events` are publicly readable so visitors can browse; `users`, `registrations`, `memberships`, `notifications` and `roleRequests` require a signed-in `@iub.edu.bd` account (every in-app route is behind `ProtectedRoute`, so anonymous visitors never need personal data). All writes require a signed-in `@iub.edu.bd` account and a document `id` that matches its path.

Two hardening steps remain open and are marked in `firestore.rules`:

1. `appState/main` is still publicly readable so a fresh client can bootstrap before migration. Once the Firebase console shows the collections populated, change its `read` rule to `isIubUser()` and redeploy.
2. Any signed-in `@iub.edu.bd` account can currently write any document (the previous single-document trust model). Per-role rules — e.g. only a club's admin may write its events — are the natural next step now that data is per-entity.

Firebase Hosting also sends `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and a restrictive `Permissions-Policy` on every response (`firebase.json`).

The full attacker model, abuse paths and prioritised rule changes live in [`docs/security/THREAT_MODEL.md`](docs/security/THREAT_MODEL.md); the reasoning behind the current trust model is recorded in [ADR-0002](docs/adr/0002-client-side-business-rules-and-trust-model.md).

### Public pages paint before data

`Providers` no longer blocks the whole tree behind the Firestore bootstrap. Landing, login and register render immediately with an empty store; only `ProtectedRoute` shows the loading screen (and only while a restored session is still resolving its profile). Firebase Auth is created with `initializeAuth` and no popup resolver, so the 95 KB `__/auth/iframe.js` is fetched only when someone clicks *Continue with Google*. On a throttled mobile profile this moved the landing page's LCP from 7.7 s to 4.0 s and the login page from 6.5 s to 2.8 s (Lighthouse 12, see below).

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
| Data reads | One `onSnapshot` per collection; IndexedDB `persistentLocalCache` (multi-tab); auto long-polling fallback; listeners re-attached on identity change; 10 s offline timeout → demo mode | `src/app/lib/firebase.ts`, `src/app/services/firestore.ts`, `src/app/context/Providers.tsx` |
| Data writes | Per-entity diff → `writeBatch` (≤450 ops/batch) instead of rewriting the whole state | `src/app/services/firestore.ts` `persistStoreDiff` |
| Indexes | Composite indexes for events (status+date, club_id+date), registrations (event_id+status, user_id+registered_at), memberships (club_id+status), notifications (user_id+created_at); large text fields excluded from indexing | `firestore.indexes.json` |
| Re-renders | `StoreContext` / `ActionsContext` split; `useStoreSelector(selector, deps)` (useSyncExternalStore + shallow equality, cache keyed on store identity **and** deps); `React.memo` on `EventCard`, `ClubCard`, `StatCard`; O(1) index maps in `selectors.ts` | `src/app/context/DataContext.tsx`, `src/app/lib/selectors.ts` |
| Input | `useDebouncedValue` (250 ms) on event/club/admin search | `src/app/hooks/useDebounce.ts` |
| Code splitting | `React.lazy` for every page except Landing/Login; recharts and the QR encoder load only inside their route/dialog; vendor chunks `vendor-react`, `vendor-firebase`, `vendor-radix` | `src/app/App.tsx`, `vite.config.ts` |
| Assets | esbuild minify + Lightning CSS (`console`/`debugger` stripped in production builds only); `vite-plugin-image-optimizer`; `sharp` script emits WebP/AVIF siblings; `ImageWithFallback` adds `loading="lazy"`, `decoding="async"` and an Unsplash `srcSet` | `vite.config.ts`, `scripts/optimize-images.mjs`, `src/app/lib/imageUtils.ts` |
| Delivery | Fonts preconnected + non-blocking preload; Hosting sends `immutable` for hashed assets, `must-revalidate` for every HTML route (including SPA deep links), `stale-while-revalidate` for images; Brotli from the CDN | `index.html`, `firebase.json` |
| Skeletons | `Skeleton` primitive and composed `EventGridSkeleton`, `ClubGridSkeleton`, `StatRowSkeleton`, `TableSkeleton`, `PageSkeleton` used as Suspense fallbacks | `src/app/components/skeletons.tsx` |

### Profiling re-renders

1. Install the React Developer Tools extension and open the **Profiler** tab.
2. In the Profiler settings enable **Record why each component rendered while profiling** and, under Components, **Highlight updates when components render**.
3. Record while registering for an event on `/events`. Only the affected `EventCard`, the `NotificationBell` badge and the page header should flash; other cards must not.
4. If a component re-renders on every store change, read its slice through `useStoreSelector` and dispatch through `useActions()` instead of `useData()`. List every closure value the selector reads in the `deps` array, exactly as with `useMemo`:

   ```ts
   const myReg = useStoreSelector(
     (s) => registrationFor(s, currentUser?.id, event.id),
     [currentUser?.id, event.id],
   );
   ```

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

### Lighthouse scores (production, 2026-09-14)

`lighthouse` is a dev dependency; audit the live site with:

```powershell
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
node .\node_modules\lighthouse\cli\index.js https://iub-event-management.web.app/ --output=json --output-path=report.json --chrome-flags="--headless=new"
node .\node_modules\lighthouse\cli\index.js https://iub-event-management.web.app/ --preset=desktop --output=html --output-path=report.html --chrome-flags="--headless=new"
```

| Page / profile | Performance | Accessibility | Best practices | SEO | LCP |
| --- | --- | --- | --- | --- | --- |
| `/` mobile (Moto G4, slow 4G) | 65 → **77** | 92 → **100** | 100 | 91 → **100** | 7.7 s → **4.0 s** |
| `/` desktop | 96 → **97** | 92 → **100** | 100 | 91 → **100** | 1.25 s → **0.97 s** |
| `/login` mobile | 70 → **91** | 93 → **100** | 100 | 91 → **100** | 6.5 s → **2.8 s** |

What moved the numbers: public pages no longer wait for the Firestore bootstrap, the Firebase Auth iframe is deferred to the Google button, `robots.txt` / `sitemap.xml` / `llms.txt` are real static files (the SPA rewrite used to answer `robots.txt` with `index.html`), and the contrast / heading / landmark / button-name issues listed under *Accessibility* below were fixed. The remaining mobile gap is the ~250 KB (Brotli) of JavaScript needed before first paint on a 1.6 Mbps connection; the next lever is an inline critical-CSS pass or moving `vendor-firebase` behind the login route. Source maps are intentionally not published (`build.sourcemap: false`), which Lighthouse reports as `valid-source-maps`.

## Accessibility

Target: WCAG 2.1 AA. Every Playwright test runs an [axe-core](https://github.com/dequelabs/axe-core) scan (`expectNoA11yViolations` in `e2e/fixtures.ts`) with the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` rule tags, so a regression fails CI. Fixes shipped with the first audit:

- **Colour contrast** — `--primary` is `#7C3AED` (5.7:1 on white; `#8B5CF6` was 4.2:1), `--quaternary` is `#047857` (5.5:1; `#34D399` was 1.9:1), sidebar and brand-panel secondary text use ≥ 85 % alpha, image tag overlays use `bg-black/75`.
- **Names and labels** — icon-only buttons (`NotificationBell`) and every Radix `SelectTrigger` carry an `aria-label`; all register-form inputs are bound to their `<Label>` via `htmlFor`/`id` and have `autocomplete`.
- **Landmarks and structure** — login, register and forgot-password pages are wrapped in `<main>`; `CardTitle` renders a `<div>` (as upstream shadcn/ui) so card titles no longer create out-of-order `h4` headings.
- **Keyboard** — `EventCard` is `role="link"`, focusable, activates on Enter/Space and shows a visible focus ring.

Transient Sonner toasts are excluded from the scan (`[data-sonner-toaster]`) because their rich-colour theme is owned by the library.

## Testing

End-to-end tests use [Playwright](https://playwright.dev) against the Vite dev server in `--mode test`. `.env.test` blanks every `VITE_FIREBASE_*` variable, so the app runs in **demo mode** (seeded data, no network) and the suite never touches the production Firestore project.

```powershell
node .\node_modules\playwright\cli.js install chromium   # once
npm run test:e2e                                          # headless, chromium + Pixel 7 (public pages)
npm run test:e2e:ui                                       # Playwright UI mode
E2E_BASE_URL=https://iub-event-management.web.app npm run test:e2e -- public   # smoke the live site
```

| Spec | Covers |
| --- | --- |
| `e2e/public.spec.ts` | Landing / login / register render without a session and pass axe; non-IUB email is rejected client-side; anonymous visit to `/dashboard` redirects to `/login`; `robots.txt`, `sitemap.xml`, `llms.txt` are served |
| `e2e/app.spec.ts` | Student login → dashboard; debounced event search; full registration flow (feed → detail → form → confirmed); club directory; coordinator / club admin / super admin land on their role home and are bounced from student-only routes; student cannot open `/superadmin` |

Demo mode has no persisted session, so tests navigate in-app (sidebar links or `navigateInApp`, which drives React Router through the history API) instead of reloading. Traces and screenshots are kept only for failures under `test-results/` (git-ignored).

## Architecture decisions and security docs

- [`docs/adr/0001-per-entity-firestore-collections.md`](docs/adr/0001-per-entity-firestore-collections.md) — why `appState/main` was split into one collection per entity, the alternatives, and the consequences.
- [`docs/adr/0002-client-side-business-rules-and-trust-model.md`](docs/adr/0002-client-side-business-rules-and-trust-model.md) — why business rules stay client-side for now and what the planned hardening path is.
- [`docs/security/THREAT_MODEL.md`](docs/security/THREAT_MODEL.md) — trust boundaries, assets, attacker capabilities, abuse paths (privilege escalation via the `users.role` field, PII harvesting, registration tampering, legacy-doc exposure) and prioritised Firestore rule recommendations.

These were produced with the [Tech Leads Club agent skills](https://github.com/tech-leads-club/agent-skills) `create-adr`, `security-threat-model`, `security-best-practices`, `perf-lighthouse`, `core-web-vitals`, `web-accessibility` and `playwright-skill`; the graphify graph below was used to check caller impact of the changes.

## Code knowledge graph (graphify)

The repository can be mapped into a queryable knowledge graph with [graphify](https://github.com/Graphify-Labs/graphify). Code is parsed locally with tree-sitter (no LLM, nothing leaves the machine); the README and guidelines are linked to the code symbols they describe, so questions like "what does the access policy depend on?" resolve to `ProtectedRoute`, `firestore.rules` and `subscribeStore` instead of a grep.

```powershell
pip install graphifyy
python -m graphify update .              # (re)build the code graph after edits
python -m graphify cluster-only . --no-label

python -m graphify god-nodes --top 10    # most connected symbols
python -m graphify affected "useStoreSelector()"   # who depends on X
python -m graphify path "EventCard" "StoreState"   # how two symbols connect
python -m graphify query "firestore persist diff migrate"
```

Outputs land in `graphify-out/` (git-ignored): `graph.html` (interactive, open in a browser), `GRAPH_REPORT.md` (god nodes, surprising connections, suggested questions) and `graph.json`. The current graph has ~630 nodes in 27 labelled communities; the hubs are `cn()`, `useAuth()`, `useData()`, `Providers()` and `StoreState`. If graphify is installed as an agent skill, `/graphify` runs the same pipeline from the AI assistant.

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
|-- docs/
|   |-- adr/                 Architecture Decision Records
|   `-- security/            Threat model
|-- e2e/                     Playwright end-to-end + axe accessibility tests
|-- public/                  Static assets, robots.txt, sitemap.xml, llms.txt
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
|-- graphify-out/           Generated code knowledge graph (git-ignored)
|-- .env.example            Firebase environment template
|-- .env.test               Blank Firebase vars -> demo mode for Playwright
|-- firebase.json           Hosting (cache + security headers) and Firestore configuration
|-- firestore.rules         Firestore access rules (per collection)
|-- firestore.indexes.json  Firestore composite indexes
|-- lighthouserc.json       Lighthouse CI performance budgets
|-- playwright.config.ts    E2E configuration (Vite dev server in --mode test)
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
