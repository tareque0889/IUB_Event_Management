// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole =
  | "student"
  | "coordinator"
  | "club_admin"
  | "super_admin";

/**
 * Executive Committee roles with strict per-club limits enforced by
 * EXEC_ROLE_LIMITS. Any approved member not assigned an executive role is
 * placed in the Sub-committee (committee_type = "sub_committee").
 */
export type ClubRole =
  | "President"
  | "Vice President"
  | "General Secretary"
  | "Treasurer"
  | "Organizing Secretary"
  | "Event Manager"
  | "Member";

export type CommitteeType = "executive" | "sub_committee";

/** Maximum number of each executive role allowed per club. */
export const EXEC_ROLE_LIMITS: Partial<Record<ClubRole, number>> = {
  President: 1,
  "Vice President": 2,
  "General Secretary": 1,
  Treasurer: 1,
  "Organizing Secretary": 1,
};

/** Roles that belong to the executive committee (have limits). */
export const EXEC_ROLES = Object.keys(EXEC_ROLE_LIMITS) as ClubRole[];

export interface User {
  id: string;
  email: string;
  name: string;
  student_id: string;
  department: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
}

export interface Club {
  id: string;
  name: string;
  short_name: string;
  description: string;
  category: string;
  admin_user_id: string;
  /** User ids of coordinators who manage this club's events. */
  coordinator_ids?: string[];
  member_count: number;
  cover_url: string;
  founded: string;
  contact_email: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  capacity: number;
  registered_count: number;
  waitlisted_count: number;
  poster_url: string;
  status: "draft" | "published" | "cancelled";
  club_id: string;
  created_by: string;
  tags: string[];
  // Recurrence. `date` is always the first occurrence. When recurrence is not
  // "none", the event repeats `recurrence_count` times at the given cadence,
  // skipping any dates listed in `exception_dates` (exception rules).
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  recurrence_count?: number;
  exception_dates?: string[];
}

export interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  status: "registered" | "waitlisted";
  registered_at: string;
  checked_in?: boolean;
  checked_in_at?: string;
  /** Contact info captured by the Event Registration Form. */
  full_name?: string;
  contact_email?: string;
  phone?: string;
}

export interface Membership {
  id: string;
  user_id: string;
  club_id: string;
  status: "pending" | "approved" | "rejected";
  applied_at: string;
  /** Contact details captured by the Club Application Form. */
  contact_email?: string;
  phone?: string;
  motivation?: string;
  /** Club-level role (e.g. "President", "Member"). */
  role?: string;
  /**
   * Which committee this member belongs to.
   * - "executive"     → has an exec-level role (President, VP, …)
   * - "sub_committee" → regular member / Event Manager
   * Undefined for pending/rejected memberships.
   */
  committee_type?: CommitteeType;
  /** RBAC permission tags for sub-committee members (e.g. ["manage_events"]). */
  permissions?: string[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: "registration" | "waitlist" | "event_update" | "membership" | "general" | "role_request";
  message: string;
  is_read: boolean;
  created_at: string;
  event_id?: string;
  club_id?: string;
}

// A student's request to the Super Admin to either lead/officer an existing club
// or create a brand-new club (which promotes them to club_admin).
export interface RoleRequest {
  id: string;
  user_id: string;
  kind: "lead_existing" | "create_club";
  requested_role: string; // e.g. "President", "General Secretary"
  club_id?: string; // for lead_existing
  club_name?: string; // for create_club
  club_category?: string; // for create_club
  club_description?: string; // for create_club
  message?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface StoreState {
  users: User[];
  clubs: Club[];
  events: Event[];
  registrations: Registration[];
  memberships: Membership[];
  notifications: Notification[];
  roleRequests: RoleRequest[];
  currentUserId: string;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const CORE_USERS: User[] = [
  {
    id: "user_1",
    email: "anika.rahman@iub.edu.bd",
    name: "Anika Rahman",
    student_id: "2321200",
    department: "CSE",
    role: "student",
    bio: "Third-year CSE student passionate about AI and open-source.",
  },
  {
    id: "user_2",
    email: "shoikat.azad@iub.edu.bd",
    name: "S.M. Shoikat Azad Shawon",
    student_id: "2320246",
    department: "CSE",
    role: "club_admin",
    bio: "President of IUB Computer Science Society.",
  },
  {
    id: "user_3",
    email: "admin@iub.edu.bd",
    name: "System Administrator",
    student_id: "ADM001",
    department: "Student Affairs",
    role: "super_admin",
    bio: "IUB Student Affairs Office.",
  },
  {
    id: "user_4",
    email: "nishe.nipa@iub.edu.bd",
    name: "Nishe Akther Nipa",
    student_id: "2321153",
    department: "EEE",
    role: "student",
    bio: "EEE student, photography enthusiast.",
  },
  {
    id: "user_5",
    email: "ahnaf.pushon@iub.edu.bd",
    name: "Ahnaf Pushon",
    student_id: "2320401",
    department: "BBA",
    role: "student",
    bio: "BBA student, loves debating.",
  },
  {
    id: "user_6",
    email: "raisa.akter@iub.edu.bd",
    name: "Raisa Akter",
    student_id: "2321045",
    department: "CSE",
    role: "student",
  },
  {
    id: "user_7",
    email: "tanvir.hasan@iub.edu.bd",
    name: "Tanvir Hasan",
    student_id: "2320812",
    department: "EEE",
    role: "student",
  },
  {
    id: "user_8",
    email: "fatema.begum@iub.edu.bd",
    name: "Fatema Begum",
    student_id: "2321300",
    department: "BBA",
    role: "student",
  },
  {
    id: "user_9",
    email: "coordinator@iub.edu.bd",
    name: "Rifat Chowdhury",
    student_id: "2320777",
    department: "CSE",
    role: "coordinator",
    bio: "Event Coordinator for IUB Computer Science Society.",
  },
];

const SYNTHETIC_FIRST_NAMES = [
  "Ayaan",
  "Nabila",
  "Farhan",
  "Tasnina",
  "Rahim",
  "Mahi",
  "Nafisa",
  "Imran",
  "Sadia",
  "Tanim",
  "Nusrat",
  "Rafi",
  "Areeba",
  "Shihab",
  "Meher",
  "Rahat",
  "Mim",
  "Samin",
  "Afsana",
  "Hasib",
];
const SYNTHETIC_LAST_NAMES = [
  "Hossain",
  "Ahmed",
  "Rahman",
  "Chowdhury",
  "Sarkar",
  "Khan",
  "Islam",
  "Akter",
  "Azad",
  "Mahmud",
  "Begum",
  "Amin",
  "Tasnim",
  "Jahan",
  "Nahar",
  "Khatun",
  "Kabir",
  "Araf",
  "Molla",
  "Parvez",
];
const SYNTHETIC_DEPARTMENTS = [
  "CSE",
  "EEE",
  "BBA",
  "ENG",
  "Economics",
  "Architecture",
];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function buildSyntheticUsers(targetCount: number): User[] {
  const users: User[] = [];
  for (let i = CORE_USERS.length + 1; i <= targetCount; i += 1) {
    const first =
      SYNTHETIC_FIRST_NAMES[(i - 1) % SYNTHETIC_FIRST_NAMES.length];
    const last =
      SYNTHETIC_LAST_NAMES[
        Math.floor((i - 1) / SYNTHETIC_FIRST_NAMES.length) %
          SYNTHETIC_LAST_NAMES.length
      ];
    const department =
      SYNTHETIC_DEPARTMENTS[
        (i - 1) % SYNTHETIC_DEPARTMENTS.length
      ];
    users.push({
      id: `user_${i}`,
      email: `${slugify(first)}.${slugify(last)}.${String(i).padStart(3, "0")}@iub.edu.bd`,
      name: `${first} ${last}`,
      student_id: `24${String(i).padStart(5, "0")}`,
      department,
      role: "student",
      bio: `${department} student at IUB.`,
    });
  }
  return users;
}

const USERS: User[] = [...CORE_USERS, ...buildSyntheticUsers(200)];

const CLUBS: Club[] = [
  {
    id: "club_1",
    name: "IUB Computer Science Society",
    short_name: "CSS",
    description:
      "The largest technical club at IUB, fostering innovation through hackathons, workshops, and tech talks. We connect students with industry leaders and prepare them for the digital economy.",
    category: "Technology",
    admin_user_id: "user_2",
    coordinator_ids: ["user_9"],
    member_count: 259,
    cover_url:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop&auto=format",
    founded: "2015",
    contact_email: "css@iub.edu.bd",
  },
  {
    id: "club_2",
    name: "IUB Debate & Oratory Club",
    short_name: "DOC",
    description:
      "Sharpening critical thinking and public speaking skills through competitive debate, Model UN, and oratory competitions at national and international levels.",
    category: "Academic",
    admin_user_id: "user_4",
    member_count: 118,
    cover_url:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop&auto=format",
    founded: "2012",
    contact_email: "doc@iub.edu.bd",
  },
  {
    id: "club_3",
    name: "IUB Photography Society",
    short_name: "PS",
    description:
      "Capturing life through lenses — we run photo walks, darkroom workshops, and an annual exhibition. Open to all skill levels, from phone photographers to DSLR enthusiasts.",
    category: "Arts & Culture",
    admin_user_id: "user_5",
    member_count: 85,
    cover_url:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=400&fit=crop&auto=format",
    founded: "2018",
    contact_email: "ps@iub.edu.bd",
  },
  {
    id: "club_4",
    name: "IUB Cultural Club",
    short_name: "CC",
    description:
      "Celebrating the rich cultural diversity of Bangladesh through music, dance, drama, and seasonal festivals. The heart of campus life.",
    category: "Arts & Culture",
    admin_user_id: "user_6",
    member_count: 312,
    cover_url:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop&auto=format",
    founded: "2010",
    contact_email: "cc@iub.edu.bd",
  },
  {
    id: "club_5",
    name: "IUB Green Campus Initiative",
    short_name: "GCI",
    description:
      "Driving sustainability on campus through tree plantations, recycling drives, awareness campaigns, and eco-friendly project funding.",
    category: "Social",
    admin_user_id: "user_7",
    member_count: 64,
    cover_url:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=400&fit=crop&auto=format",
    founded: "2020",
    contact_email: "gci@iub.edu.bd",
  },
];

const EVENTS: Event[] = [
  {
    id: "event_1",
    title: "IUB Hackathon 2026",
    description:
      "A 36-hour intensive hackathon where teams of up to 4 students compete to build innovative solutions to real-world problems. Featuring mentorship from industry professionals, prize money of ৳1,50,000, and networking opportunities with tech companies.",
    date: "2026-09-01",
    start_time: "10:00",
    end_time: "22:00",
    venue: "IUB Main Auditorium, Block A",
    capacity: 150,
    registered_count: 61,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_1",
    created_by: "user_2",
    tags: ["Hackathon", "Tech", "Competition"],
  },
  {
    id: "event_2",
    title: "Intro to Machine Learning Workshop",
    description:
      "A hands-on workshop covering the fundamentals of machine learning using Python and scikit-learn. Participants will build and evaluate their first ML model. Laptops are required. Pre-registration is mandatory as seats are very limited.",
    date: "2026-09-25",
    start_time: "15:00",
    end_time: "17:00",
    venue: "Computer Lab 3, Block C",
    capacity: 30,
    registered_count: 34,
    waitlisted_count: 7,
    poster_url:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_1",
    created_by: "user_2",
    tags: ["Workshop", "AI/ML", "Python"],
  },
  {
    id: "event_3",
    title: "National Debate Championship Qualifier",
    description:
      "IUB's internal qualifier round for the National University Debate Championship. British Parliamentary format. Open to all IUB students. Winners represent IUB at the nationals.",
    date: "2026-09-10",
    start_time: "11:00",
    end_time: "18:00",
    venue: "Seminar Hall, Block B",
    capacity: 80,
    registered_count: 56,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_2",
    created_by: "user_4",
    tags: ["Debate", "Competition", "National"],
  },
  {
    id: "event_4",
    title: "Photo Walk: Old Dhaka Streets",
    description:
      "An early morning photography expedition through the historic lanes of Old Dhaka — Sadarghat, Ahsan Manzil, and Shankhari Bazar. Capture the soul of the city at golden hour. All skill levels welcome.",
    date: "2026-09-22",
    start_time: "07:00",
    end_time: "11:00",
    venue: "Meet at IUB Main Gate",
    capacity: 20,
    registered_count: 8,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_3",
    created_by: "user_5",
    tags: ["Photography", "Cultural", "Outdoor"],
    recurrence: "weekly",
    recurrence_count: 4,
    exception_dates: ["2026-09-29"],
  },
  {
    id: "event_5",
    title: "Monsoon Cultural Fest 2026",
    description:
      "The biggest event of the year! A full-day celebration of Bangladeshi arts, music, food, and heritage. Featuring live performances by student bands, traditional dance, folk music, and art installations. Free entry for all IUB students.",
    date: "2026-09-15",
    start_time: "14:00",
    end_time: "21:00",
    venue: "IUB Open Grounds",
    capacity: 500,
    registered_count: 312,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_4",
    created_by: "user_6",
    tags: ["Cultural", "Festival", "Music"],
  },
  {
    id: "event_6",
    title: "Guest Lecture: AI in Healthcare",
    description:
      "Dr. Mahbub Hossain from BRAC University will discuss how artificial intelligence is transforming diagnostics, drug discovery, and patient care in Bangladesh. Q&A session to follow.",
    date: "2026-09-30",
    start_time: "16:00",
    end_time: "17:00",
    venue: "Lecture Hall 1, Block A",
    capacity: 100,
    registered_count: 94,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_1",
    created_by: "user_2",
    tags: ["Lecture", "AI", "Healthcare"],
  },
  {
    id: "event_7",
    title: "Monsoon Tree Plantation Drive",
    description:
      "Join us to plant 200 saplings across the IUB campus as part of our commitment to a greener future. Gloves and tools provided. Refreshments included.",
    date: "2026-09-19",
    start_time: "08:30",
    end_time: "11:30",
    venue: "IUB East Campus Garden",
    capacity: 50,
    registered_count: 12,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_5",
    created_by: "user_7",
    tags: ["Volunteering", "Environment", "Outdoor"],
  },
  {
    id: "event_8",
    title: "Annual Photography Exhibition",
    description:
      "The Photography Society's flagship annual showcase — 80+ prints from student photographers displayed in a gallery format. Opening night features live acoustic music and light refreshments.",
    date: "2026-09-05",
    start_time: "17:30",
    end_time: "20:30",
    venue: "IUB Gallery Space, Block D",
    capacity: 200,
    registered_count: 67,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_3",
    created_by: "user_5",
    tags: ["Photography", "Exhibition", "Arts"],
  },
];

const CLUB_1_EXTRA_REGISTRATIONS: Registration[] = [
  ...Array.from({ length: 16 }, (_, i) => ({
    id: `reg_${9 + i}`,
    user_id: `user_${9 + i}`,
    event_id: "event_1",
    status: "registered" as const,
    registered_at: `2026-07-${String(17 + i).padStart(2, "0")}T08:00:00Z`,
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `reg_${25 + i}`,
    user_id: `user_${25 + i}`,
    event_id: "event_2",
    status: i < 4 ? ("registered" as const) : ("waitlisted" as const),
    registered_at: `2026-07-${String(21 + i).padStart(2, "0")}T09:00:00Z`,
  })),
];

const REGISTRATIONS: Registration[] = [
  // user_1 (Anika) registrations
  {
    id: "reg_1",
    user_id: "user_1",
    event_id: "event_1",
    status: "registered",
    registered_at: "2026-07-10T09:15:00Z",
  },
  {
    id: "reg_2",
    user_id: "user_1",
    event_id: "event_2",
    status: "waitlisted",
    registered_at: "2026-07-12T14:30:00Z",
  },
  {
    id: "reg_3",
    user_id: "user_1",
    event_id: "event_4",
    status: "registered",
    registered_at: "2026-07-15T11:00:00Z",
  },
  // Other users registered for event_1 (for admin roster)
  {
    id: "reg_4",
    user_id: "user_4",
    event_id: "event_1",
    status: "registered",
    registered_at: "2026-07-09T08:00:00Z",
  },
  {
    id: "reg_5",
    user_id: "user_5",
    event_id: "event_1",
    status: "registered",
    registered_at: "2026-07-09T10:00:00Z",
  },
  {
    id: "reg_6",
    user_id: "user_6",
    event_id: "event_1",
    status: "registered",
    registered_at: "2026-07-10T07:00:00Z",
  },
  {
    id: "reg_7",
    user_id: "user_7",
    event_id: "event_2",
    status: "registered",
    registered_at: "2026-07-08T12:00:00Z",
  },
  {
    id: "reg_8",
    user_id: "user_8",
    event_id: "event_2",
    status: "waitlisted",
    registered_at: "2026-07-13T09:00:00Z",
  },
  ...CLUB_1_EXTRA_REGISTRATIONS,
];

const CLUB_1_EXTRA_MEMBERSHIPS: Membership[] = [
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `mem_${10 + i}`,
    user_id: `user_${9 + i}`,
    club_id: "club_1",
    status: "approved" as const,
    applied_at: `2026-02-${String(10 + i).padStart(2, "0")}T09:00:00Z`,
    role: "Member",
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `mem_${22 + i}`,
    user_id: `user_${21 + i}`,
    club_id: "club_1",
    status: "pending" as const,
    applied_at: `2026-07-${String(10 + i).padStart(2, "0")}T10:30:00Z`,
  })),
];

const MEMBERSHIPS: Membership[] = [
  // user_1 (Anika) memberships
  {
    id: "mem_1",
    user_id: "user_1",
    club_id: "club_1",
    status: "approved",
    applied_at: "2026-01-10T09:00:00Z",
    role: "Member",
  },
  {
    id: "mem_2",
    user_id: "user_1",
    club_id: "club_2",
    status: "pending",
    applied_at: "2026-07-14T14:00:00Z",
  },
  // user_2 (Shawon) — admin of club_1
  {
    id: "mem_3",
    user_id: "user_2",
    club_id: "club_1",
    status: "approved",
    applied_at: "2025-09-01T09:00:00Z",
    role: "President",
  },
  // Pending requests for club_1 (for admin to review)
  {
    id: "mem_4",
    user_id: "user_4",
    club_id: "club_1",
    status: "pending",
    applied_at: "2026-07-15T11:30:00Z",
  },
  {
    id: "mem_5",
    user_id: "user_5",
    club_id: "club_1",
    status: "pending",
    applied_at: "2026-07-16T08:45:00Z",
  },
  {
    id: "mem_6",
    user_id: "user_6",
    club_id: "club_1",
    status: "approved",
    applied_at: "2026-02-01T10:00:00Z",
    role: "Member",
  },
  {
    id: "mem_7",
    user_id: "user_7",
    club_id: "club_1",
    status: "approved",
    applied_at: "2026-02-05T10:00:00Z",
    role: "Member",
  },
  // user_4 memberships
  {
    id: "mem_8",
    user_id: "user_4",
    club_id: "club_2",
    status: "approved",
    applied_at: "2026-01-15T10:00:00Z",
    role: "President",
  },
  // user_5 memberships
  {
    id: "mem_9",
    user_id: "user_5",
    club_id: "club_3",
    status: "approved",
    applied_at: "2026-01-20T10:00:00Z",
    role: "President",
  },
  ...CLUB_1_EXTRA_MEMBERSHIPS,
];

const CLUB_1_MEMBERSHIP_REQUEST_NOTIFICATIONS: Notification[] =
  CLUB_1_EXTRA_MEMBERSHIPS.filter(
    (membership) => membership.status === "pending",
  ).map((membership, index) => ({
    id: `notif_${7 + index}`,
    user_id: "user_2",
    type: "membership",
    message: `${membership.user_id} has requested to join IUB Computer Science Society.`,
    is_read: false,
    created_at: membership.applied_at,
    club_id: "club_1",
  }));

const NOTIFICATIONS: Notification[] = [
  {
    id: "notif_1",
    user_id: "user_1",
    type: "registration",
    message: "You have successfully registered for IUB Hackathon 2026.",
    is_read: true,
    created_at: "2026-07-10T09:15:00Z",
    event_id: "event_1",
  },
  {
    id: "notif_2",
    user_id: "user_1",
    type: "waitlist",
    message:
      "You joined the waitlist for 'Intro to Machine Learning Workshop'. Your position: #1.",
    is_read: false,
    created_at: "2026-07-12T14:30:00Z",
    event_id: "event_2",
  },
  {
    id: "notif_3",
    user_id: "user_1",
    type: "registration",
    message: "You have successfully registered for 'Photo Walk: Old Dhaka Streets'.",
    is_read: false,
    created_at: "2026-07-15T11:00:00Z",
    event_id: "event_4",
  },
  {
    id: "notif_4",
    user_id: "user_1",
    type: "event_update",
    message:
      "Heads up: 'Guest Lecture: AI in Healthcare' is almost at capacity (94/100 spots filled).",
    is_read: false,
    created_at: "2026-07-16T10:00:00Z",
    event_id: "event_6",
  },
  // Admin notifications
  {
    id: "notif_5",
    user_id: "user_2",
    type: "membership",
    message: "Nishe Akther Nipa has requested to join IUB Computer Science Society.",
    is_read: false,
    created_at: "2026-07-15T11:30:00Z",
    club_id: "club_1",
  },
  {
    id: "notif_6",
    user_id: "user_2",
    type: "membership",
    message: "Ahnaf Pushon has requested to join IUB Computer Science Society.",
    is_read: false,
    created_at: "2026-07-16T08:45:00Z",
    club_id: "club_1",
  },
  ...CLUB_1_MEMBERSHIP_REQUEST_NOTIFICATIONS,
];

const ROLE_REQUESTS: RoleRequest[] = [
  {
    id: "rr_1",
    user_id: "user_8",
    kind: "create_club",
    requested_role: "President",
    club_name: "IUB Robotics Club",
    club_category: "Technology",
    club_description:
      "A hands-on club for building robots, competing in national robotics challenges, and running Arduino & embedded-systems workshops.",
    message: "We already have 15 interested students and a faculty advisor from EEE.",
    status: "pending",
    created_at: "2026-07-16T10:20:00Z",
  },
  {
    id: "rr_2",
    user_id: "user_6",
    kind: "lead_existing",
    requested_role: "General Secretary",
    club_id: "club_4",
    message: "I've been an active member for two years and would like to take on an officer role.",
    status: "pending",
    created_at: "2026-07-15T16:05:00Z",
  },
];

// ─── Initial State ────────────────────────────────────────────────────────────

export const initialState: StoreState = {
  users: USERS,
  clubs: CLUBS,
  events: EVENTS,
  registrations: REGISTRATIONS,
  memberships: MEMBERSHIPS,
  notifications: NOTIFICATIONS,
  roleRequests: ROLE_REQUESTS,
  currentUserId: "user_1",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _notifCounter = 100;
function newNotifId() {
  return `notif_${++_notifCounter}`;
}
let _regCounter = 100;
function newRegId() {
  return `reg_${++_regCounter}`;
}
let _memCounter = 100;
function newMemId() {
  return `mem_${++_memCounter}`;
}
let _evtCounter = 100;
function newEvtId() {
  return `event_${++_evtCounter}`;
}
let _userCounter = 100;
function newUserId() {
  return `user_${++_userCounter}`;
}
let _rrCounter = 100;
function newRoleReqId() {
  return `rr_${++_rrCounter}`;
}
let _clubCounter = 100;
function newClubId() {
  return `club_${++_clubCounter}`;
}

function superAdminIds(state: StoreState): string[] {
  return state.users.filter((u) => u.role === "super_admin").map((u) => u.id);
}

// When rehydrating persisted state, advance the ID counters past any IDs already
// present so newly-created records never collide with rehydrated ones.
export function seedCounters(state: StoreState): void {
  const maxNum = (ids: string[], prefix: string): number =>
    ids.reduce((max, id) => {
      const n = parseInt(id.slice(prefix.length), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 100);

  _notifCounter = Math.max(_notifCounter, maxNum(state.notifications.map((n) => n.id), "notif_"));
  _regCounter = Math.max(_regCounter, maxNum(state.registrations.map((r) => r.id), "reg_"));
  _memCounter = Math.max(_memCounter, maxNum(state.memberships.map((m) => m.id), "mem_"));
  _evtCounter = Math.max(_evtCounter, maxNum(state.events.map((e) => e.id), "event_"));
  _userCounter = Math.max(_userCounter, maxNum(state.users.map((u) => u.id), "user_"));
  _rrCounter = Math.max(_rrCounter, maxNum(state.roleRequests.map((r) => r.id), "rr_"));
  _clubCounter = Math.max(_clubCounter, maxNum(state.clubs.map((c) => c.id), "club_"));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Recalculates club.member_count from actual approved memberships so the
 * dashboard stat always reflects the real database count.
 */
export function syncMemberCounts(state: StoreState): StoreState {
  const counts = new Map<string, number>();
  for (const m of state.memberships) {
    if (m.status === "approved") {
      counts.set(m.club_id, (counts.get(m.club_id) ?? 0) + 1);
    }
  }
  return {
    ...state,
    clubs: state.clubs.map((c) => ({
      ...c,
      member_count: counts.get(c.id) ?? 0,
    })),
  };
}

/**
 * Randomly assigns executive and sub-committee roles to all approved members
 * of the given club, strictly enforcing EXEC_ROLE_LIMITS.
 *
 * Algorithm:
 *  1. Shuffle the approved member list (Fisher-Yates).
 *  2. Assign limited exec roles in order until each quota is filled.
 *  3. The club admin (admin_user_id) is always assigned President if they
 *     don't already hold an exec role.
 *  4. Remaining members receive "Event Manager" (sub_committee) or "Member"
 *     (sub_committee) alternately to keep the roster varied.
 */
export function assignClubRoles(state: StoreState, clubId: string): StoreState {
  const club = state.clubs.find((c) => c.id === clubId);
  if (!club) return state;

  const approved = state.memberships.filter(
    (m) => m.club_id === clubId && m.status === "approved",
  );
  if (approved.length === 0) return state;

  // Fisher-Yates shuffle (non-mutating)
  const shuffled = [...approved];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Ensure club admin is first so they get President
  const adminIdx = shuffled.findIndex((m) => m.user_id === club.admin_user_id);
  if (adminIdx > 0) {
    const [admin] = shuffled.splice(adminIdx, 1);
    shuffled.unshift(admin);
  }

  const execRoleQueue: ClubRole[] = [
    "President",
    "Vice President",
    "Vice President",
    "General Secretary",
    "Treasurer",
    "Organizing Secretary",
  ];
  let execIdx = 0;
  const updatedMemberships = state.memberships.map((m) => {
    if (m.club_id !== clubId || m.status !== "approved") return m;

    const pos = shuffled.findIndex((s) => s.id === m.id);
    if (pos === -1) return m;

    if (execIdx < execRoleQueue.length) {
      const role = execRoleQueue[execIdx++];
      return {
        ...m,
        role,
        committee_type: "executive" as CommitteeType,
        permissions: ["manage_events", "manage_members", "view_reports"],
      };
    }

    // Sub-committee: alternate Event Manager / Member
    const isEventManager = pos % 2 === 0;
    return {
      ...m,
      role: isEventManager ? ("Event Manager" as ClubRole) : ("Member" as ClubRole),
      committee_type: "sub_committee" as CommitteeType,
      permissions: isEventManager
        ? ["manage_events", "view_reports"]
        : ["view_reports"],
    };
  });

  return { ...state, memberships: updatedMemberships };
}

/**
 * Updates a member's club role, re-classifying their committee_type and
 * permissions. Enforces EXEC_ROLE_LIMITS — throws if the target exec role is
 * already at its maximum for the club.
 */
export function updateMemberRole(
  state: StoreState,
  membershipId: string,
  newRole: ClubRole,
): StoreState {
  const mem = state.memberships.find((m) => m.id === membershipId);
  if (!mem || mem.status !== "approved") return state;

  const limit = EXEC_ROLE_LIMITS[newRole];
  if (limit !== undefined) {
    const currentCount = state.memberships.filter(
      (m) =>
        m.club_id === mem.club_id &&
        m.status === "approved" &&
        m.role === newRole &&
        m.id !== membershipId,
    ).length;
    if (currentCount >= limit) {
      throw new Error(
        `Role "${newRole}" is already at its maximum (${limit}) for this club.`,
      );
    }
  }

  const isExec = EXEC_ROLES.includes(newRole);
  return {
    ...state,
    memberships: state.memberships.map((m) =>
      m.id === membershipId
        ? {
            ...m,
            role: newRole,
            committee_type: isExec
              ? ("executive" as CommitteeType)
              : ("sub_committee" as CommitteeType),
            permissions: isExec
              ? ["manage_events", "manage_members", "view_reports"]
              : newRole === "Event Manager"
                ? ["manage_events", "view_reports"]
                : ["view_reports"],
          }
        : m,
    ),
  };
}

export interface RegistrationContact {
  full_name?: string;
  contact_email?: string;
  phone?: string;
}

/**
 * Clubs a user manages: a `club_admin` owns a club via `admin_user_id`, while a
 * `coordinator` manages any club listing their id in `coordinator_ids`.
 */
export function clubsManagedBy(
  state: StoreState,
  user: User | null | undefined
): Club[] {
  if (!user) return [];
  if (user.role === "coordinator")
    return state.clubs.filter((c) =>
      (c.coordinator_ids ?? []).includes(user.id)
    );
  return state.clubs.filter((c) => c.admin_user_id === user.id);
}

export function registerForEvent(
  state: StoreState,
  userId: string,
  eventId: string,
  contact?: RegistrationContact
): StoreState {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return state;

  const existing = state.registrations.find(
    (r) => r.user_id === userId && r.event_id === eventId
  );
  if (existing) return state;

  // Hard capacity enforcement — no waitlist. Registration is blocked when full.
  const isFull = event.registered_count >= event.capacity;
  if (isFull) return state;

  const newReg: Registration = {
    id: newRegId(),
    user_id: userId,
    event_id: eventId,
    status: "registered",
    registered_at: new Date().toISOString(),
    full_name: contact?.full_name,
    contact_email: contact?.contact_email,
    phone: contact?.phone,
  };

  const newNotif: Notification = {
    id: newNotifId(),
    user_id: userId,
    type: "registration",
    message: `You have successfully registered for "${event.title}".`,
    is_read: false,
    created_at: new Date().toISOString(),
    event_id: eventId,
  };

  const updatedEvents = state.events.map((e) =>
    e.id !== eventId
      ? e
      : { ...e, registered_count: e.registered_count + 1 }
  );

  return {
    ...state,
    events: updatedEvents,
    registrations: [...state.registrations, newReg],
    notifications: [...state.notifications, newNotif],
  };
}

export function cancelRegistration(state: StoreState, userId: string, eventId: string): StoreState {
  const reg = state.registrations.find(
    (r) => r.user_id === userId && r.event_id === eventId
  );
  if (!reg) return state;

  // Waitlist removed: simply free the seat. No auto-promotion.
  return {
    ...state,
    registrations: state.registrations.filter((r) => r.id !== reg.id),
    events: state.events.map((e) => {
      if (e.id !== eventId) return e;
      return reg.status === "registered"
        ? { ...e, registered_count: Math.max(0, e.registered_count - 1) }
        : { ...e, waitlisted_count: Math.max(0, e.waitlisted_count - 1) };
    }),
  };
}

// QR check-in: mark a registration as attended (or undo it).
export function setCheckIn(
  state: StoreState,
  registrationId: string,
  value: boolean
): StoreState {
  const reg = state.registrations.find((r) => r.id === registrationId);
  if (!reg) return state;

  const nextRegistrations = state.registrations.map((r) =>
    r.id === registrationId
      ? {
          ...r,
          checked_in: value,
          checked_in_at: value ? new Date().toISOString() : undefined,
        }
      : r
  );

  return {
    ...state,
    registrations: nextRegistrations,
  };
}

export interface ClubApplication {
  contact_email?: string;
  phone?: string;
  motivation?: string;
}

export function applyToClub(
  state: StoreState,
  userId: string,
  clubId: string,
  application?: ClubApplication
): StoreState {
  const existing = state.memberships.find(
    (m) => m.user_id === userId && m.club_id === clubId
  );
  if (existing) return state;

  const club = state.clubs.find((c) => c.id === clubId);
  if (!club) return state;

  const newMem: Membership = {
    id: newMemId(),
    user_id: userId,
    club_id: clubId,
    status: "pending",
    applied_at: new Date().toISOString(),
    contact_email: application?.contact_email,
    phone: application?.phone,
    motivation: application?.motivation,
  };

  const user = state.users.find((u) => u.id === userId);
  const adminNotif: Notification = {
    id: newNotifId(),
    user_id: club.admin_user_id,
    type: "membership",
    message: `${user?.name ?? "A student"} has requested to join ${club.name}.`,
    is_read: false,
    created_at: new Date().toISOString(),
    club_id: clubId,
  };

  return {
    ...state,
    memberships: [...state.memberships, newMem],
    notifications: [...state.notifications, adminNotif],
  };
}

export function reviewMembership(
  state: StoreState,
  membershipId: string,
  action: "approved" | "rejected"
): StoreState {
  const mem = state.memberships.find((m) => m.id === membershipId);
  if (!mem) return state;

  const club = state.clubs.find((c) => c.id === mem.club_id);

  const userNotif: Notification = {
    id: newNotifId(),
    user_id: mem.user_id,
    type: "membership",
    message:
      action === "approved"
        ? `Your membership request for ${club?.name} has been approved! Welcome aboard.`
        : `Your membership request for ${club?.name} has been declined.`,
    is_read: false,
    created_at: new Date().toISOString(),
    club_id: mem.club_id,
  };

  const withUpdatedMembership: StoreState = {
    ...state,
    memberships: state.memberships.map((m) =>
      m.id === membershipId
        ? {
            ...m,
            status: action,
            role: action === "approved" ? (m.role ?? "Member") : m.role,
            committee_type:
              action === "approved"
                ? ("sub_committee" as CommitteeType)
                : m.committee_type,
            permissions:
              action === "approved" ? (m.permissions ?? ["view_reports"]) : m.permissions,
          }
        : m
    ),
    notifications: [...state.notifications, userNotif],
  };

  // Re-compute member_count from actual approved records (fixes the sync bug).
  return syncMemberCounts(withUpdatedMembership);
}

export function removeMember(state: StoreState, membershipId: string): StoreState {
  const mem = state.memberships.find((m) => m.id === membershipId);
  if (!mem) return state;

  const withRemoved: StoreState = {
    ...state,
    memberships: state.memberships.filter((m) => m.id !== membershipId),
  };

  // Re-compute member_count from actual approved records.
  return syncMemberCounts(withRemoved);
}

export function createEvent(state: StoreState, eventData: Omit<Event, "id" | "registered_count" | "waitlisted_count">): StoreState {
  const newEvent: Event = {
    ...eventData,
    id: newEvtId(),
    registered_count: 0,
    waitlisted_count: 0,
  };
  return { ...state, events: [...state.events, newEvent] };
}

export function updateEvent(state: StoreState, eventId: string, updates: Partial<Event>): StoreState {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return state;

  const changed =
    (updates.date && updates.date !== event.date) ||
    (updates.start_time && updates.start_time !== event.start_time) ||
    (updates.venue && updates.venue !== event.venue);

  // Notify registered attendees of changes
  const attendeeNotifs: Notification[] = changed
    ? state.registrations
        .filter((r) => r.event_id === eventId && r.status === "registered")
        .map((r) => ({
          id: newNotifId(),
          user_id: r.user_id,
          type: "event_update" as const,
          message: `"${event.title}" has been updated. Please check the new details.`,
          is_read: false,
          created_at: new Date().toISOString(),
          event_id: eventId,
        }))
    : [];

  return {
    ...state,
    events: state.events.map((e) =>
      e.id === eventId ? { ...e, ...updates } : e
    ),
    notifications: [...state.notifications, ...attendeeNotifs],
  };
}

export function cancelEvent(state: StoreState, eventId: string): StoreState {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return state;

  const attendeeNotifs: Notification[] = state.registrations
    .filter((r) => r.event_id === eventId)
    .map((r) => ({
      id: newNotifId(),
      user_id: r.user_id,
      type: "event_update" as const,
      message: `"${event.title}" has been cancelled. We're sorry for the inconvenience.`,
      is_read: false,
      created_at: new Date().toISOString(),
      event_id: eventId,
    }));

  return {
    ...state,
    events: state.events.map((e) =>
      e.id === eventId ? { ...e, status: "cancelled" } : e
    ),
    notifications: [...state.notifications, ...attendeeNotifs],
  };
}

export function deleteEventAdmin(state: StoreState, eventId: string): StoreState {
  return {
    ...state,
    events: state.events.filter((e) => e.id !== eventId),
    registrations: state.registrations.filter((r) => r.event_id !== eventId),
  };
}

export function deleteClubAdmin(state: StoreState, clubId: string): StoreState {
  return {
    ...state,
    clubs: state.clubs.filter((c) => c.id !== clubId),
    memberships: state.memberships.filter((m) => m.club_id !== clubId),
    events: state.events.filter((e) => e.club_id !== clubId),
  };
}

// Recurring events: add/remove a single date from an event's exception list,
// letting an organiser cancel just one occurrence of a repeating series.
export function toggleEventException(
  state: StoreState,
  eventId: string,
  date: string
): StoreState {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return state;
  const current = event.exception_dates ?? [];
  const next = current.includes(date)
    ? current.filter((d) => d !== date)
    : [...current, date];
  return {
    ...state,
    events: state.events.map((e) =>
      e.id === eventId ? { ...e, exception_dates: next } : e
    ),
  };
}

// Daily digest / reminder: compile the user's upcoming registered events into a
// single notification, simulating the push/email digest the backend would send.
export function sendDigest(state: StoreState, userId: string): StoreState {
  const todayIso = new Date().toISOString().slice(0, 10);
  const myEventIds = new Set(
    state.registrations
      .filter((r) => r.user_id === userId && r.status === "registered")
      .map((r) => r.event_id)
  );
  const upcoming = state.events
    .filter(
      (e) =>
        myEventIds.has(e.id) && e.status !== "cancelled" && e.date >= todayIso
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const message =
    upcoming.length === 0
      ? "Your daily digest: you have no upcoming events registered. Browse events to find something to join!"
      : `Your daily digest: ${upcoming.length} upcoming event${
          upcoming.length > 1 ? "s" : ""
        } — ${upcoming
          .slice(0, 3)
          .map((e) => `${e.title} (${e.date})`)
          .join(", ")}${upcoming.length > 3 ? ", and more." : "."}`;

  const digest: Notification = {
    id: newNotifId(),
    user_id: userId,
    type: "general",
    message,
    is_read: false,
    created_at: new Date().toISOString(),
    event_id: upcoming[0]?.id,
  };

  return { ...state, notifications: [...state.notifications, digest] };
}

export function markNotificationsRead(state: StoreState, userId: string): StoreState {
  return {
    ...state,
    notifications: state.notifications.map((n) =>
      n.user_id === userId ? { ...n, is_read: true } : n
    ),
  };
}

export function updateProfile(
  state: StoreState,
  userId: string,
  updates: Partial<Pick<User, "name" | "student_id" | "department" | "bio">>
): StoreState {
  return {
    ...state,
    users: state.users.map((u) =>
      u.id === userId ? { ...u, ...updates } : u
    ),
  };
}

// ─── Account creation ─────────────────────────────────────────────────────────

// Registers a new account. New accounts always default to the "student" role.
export function registerUser(
  state: StoreState,
  data: { name: string; email: string; student_id: string; department: string }
): { state: StoreState; userId: string } {
  const id = newUserId();
  const newUser: User = {
    id,
    email: data.email,
    name: data.name,
    student_id: data.student_id,
    department: data.department,
    role: "student",
  };
  const welcome: Notification = {
    id: newNotifId(),
    user_id: id,
    type: "general",
    message: "Welcome to IUB Campus Hub! Explore events and join clubs to get started.",
    is_read: false,
    created_at: new Date().toISOString(),
  };
  return {
    state: {
      ...state,
      users: [...state.users, newUser],
      notifications: [...state.notifications, welcome],
    },
    userId: id,
  };
}

// ─── Role requests (student → super admin) ────────────────────────────────────

export function submitRoleRequest(
  state: StoreState,
  userId: string,
  payload: Omit<RoleRequest, "id" | "user_id" | "status" | "created_at">
): StoreState {
  const user = state.users.find((u) => u.id === userId);
  const req: RoleRequest = {
    id: newRoleReqId(),
    user_id: userId,
    status: "pending",
    created_at: new Date().toISOString(),
    ...payload,
  };

  const target =
    payload.kind === "create_club"
      ? `to create "${payload.club_name}"`
      : `to become ${payload.requested_role} of ${
          state.clubs.find((c) => c.id === payload.club_id)?.name ?? "a club"
        }`;

  const adminNotifs: Notification[] = superAdminIds(state).map((adminId) => ({
    id: newNotifId(),
    user_id: adminId,
    type: "role_request" as const,
    message: `${user?.name ?? "A student"} has requested ${target}.`,
    is_read: false,
    created_at: new Date().toISOString(),
    club_id: payload.club_id,
  }));

  return {
    ...state,
    roleRequests: [...state.roleRequests, req],
    notifications: [...state.notifications, ...adminNotifs],
  };
}

export function reviewRoleRequest(
  state: StoreState,
  requestId: string,
  action: "approved" | "rejected"
): StoreState {
  const req = state.roleRequests.find((r) => r.id === requestId);
  if (!req) return state;

  let newState: StoreState = {
    ...state,
    roleRequests: state.roleRequests.map((r) =>
      r.id === requestId ? { ...r, status: action } : r
    ),
  };

  let userMessage: string;

  if (action === "approved") {
    // Promote requester to club_admin.
    newState = {
      ...newState,
      users: newState.users.map((u) =>
        u.id === req.user_id ? { ...u, role: "club_admin" } : u
      ),
    };

    if (req.kind === "create_club") {
      const clubId = newClubId();
      const newClub: Club = {
        id: clubId,
        name: req.club_name ?? "New Club",
        short_name: (req.club_name ?? "NC")
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 4),
        description: req.club_description ?? "",
        category: req.club_category ?? "General",
        admin_user_id: req.user_id,
        member_count: 1,
        cover_url:
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop&auto=format",
        founded: String(new Date().getFullYear()),
        contact_email: state.users.find((u) => u.id === req.user_id)?.email ?? "",
      };
      const founderMem: Membership = {
        id: newMemId(),
        user_id: req.user_id,
        club_id: clubId,
        status: "approved",
        applied_at: new Date().toISOString(),
        role: req.requested_role,
      };
      newState = {
        ...newState,
        clubs: [...newState.clubs, newClub],
        memberships: [...newState.memberships, founderMem],
      };
      userMessage = `Your request to create "${req.club_name}" has been approved! You are now its ${req.requested_role}.`;
    } else {
      // lead_existing: make them the club admin/officer.
      const existingMem = newState.memberships.find(
        (m) => m.user_id === req.user_id && m.club_id === req.club_id
      );
      newState = {
        ...newState,
        clubs: newState.clubs.map((c) =>
          c.id === req.club_id ? { ...c, admin_user_id: req.user_id } : c
        ),
        memberships: existingMem
          ? newState.memberships.map((m) =>
              m.id === existingMem.id
                ? { ...m, status: "approved", role: req.requested_role }
                : m
            )
          : [
              ...newState.memberships,
              {
                id: newMemId(),
                user_id: req.user_id,
                club_id: req.club_id!,
                status: "approved",
                applied_at: new Date().toISOString(),
                role: req.requested_role,
              },
            ],
      };
      const clubName = newState.clubs.find((c) => c.id === req.club_id)?.name ?? "the club";
      userMessage = `Your request to become ${req.requested_role} of ${clubName} has been approved!`;
    }
  } else {
    userMessage =
      req.kind === "create_club"
        ? `Your request to create "${req.club_name}" has been declined.`
        : `Your request for an officer role has been declined.`;
  }

  const userNotif: Notification = {
    id: newNotifId(),
    user_id: req.user_id,
    type: "role_request",
    message: userMessage,
    is_read: false,
    created_at: new Date().toISOString(),
    club_id: req.club_id,
  };

  return { ...newState, notifications: [...newState.notifications, userNotif] };
}

// Super admin directly changes a user's role.
export function changeUserRole(
  state: StoreState,
  userId: string,
  newRole: UserRole
): StoreState {
  const user = state.users.find((u) => u.id === userId);
  if (!user || user.role === newRole) return state;

  const label: Record<UserRole, string> = {
    student: "Student",
    coordinator: "Co-ordinator",
    club_admin: "Club Admin",
    super_admin: "Super Admin",
  };

  const notif: Notification = {
    id: newNotifId(),
    user_id: userId,
    type: "role_request",
    message: `An administrator has changed your account role to ${label[newRole]}.`,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  return {
    ...state,
    users: state.users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
    notifications: [...state.notifications, notif],
  };
}
