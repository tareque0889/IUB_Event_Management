import {
  CalendarDays,
  Users, BookOpen, BadgeCheck
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import {
  Card, CardDescription, CardHeader,
  CardTitle
} from "../components/ui/card";
import { useAuth } from "../context/AuthContext";
import { ComicButton } from "../components/ComicButton";
import { ThemeToggle } from "../components/ThemeToggle";

export function LandingPage() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-5 text-primary" />
            <span
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="font-semibold"
            >
              IUB Campus Hub
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle size={15} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <section className="max-w-3xl">
          <Badge className="mb-5">Built for IUB students and clubs</Badge>
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-4xl md:text-5xl font-semibold leading-tight"
          >
            Manage campus events and club activities in one place.
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl">
            Discover events, join clubs, track registrations, and coordinate
            organizers through a single campus platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <ComicButton
              to={currentUser ? "/dashboard" : "/register"}
              ariaLabel={currentUser ? "Go to Dashboard" : "Create Account"}
            >
              {currentUser ? "Go to Dashboard" : "Create Account"}
            </ComicButton>
            <ComicButton to="/login" innerColor="#ffffff" ariaLabel="Sign in">
              Sign in
            </ComicButton>
          </div>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: CalendarDays,
              title: "Event Discovery",
              description:
                "Browse upcoming events, venue details, and schedules in one feed.",
            },
            {
              icon: Users,
              title: "Club Management",
              description:
                "Handle memberships, requests, and member rosters with role controls.",
            },
            {
              icon: BadgeCheck,
              title: "Attendance & Tracking",
              description:
                "Check in attendees, monitor capacity, and view activity summaries.",
            },
          ].map((feature) => (
            <Card key={feature.title} className="h-full">
              <CardHeader>
                <feature.icon className="size-5 text-primary mb-1" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
