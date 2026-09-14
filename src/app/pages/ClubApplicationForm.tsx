import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { toast } from "sonner";
import { AlertCircle, ArrowLeft, BadgeCheck } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { EmptyState } from "../components/EmptyState";

export function ClubApplicationForm() {
  const { id } = useParams<{ id: string }>();
  const { store, doApplyClub } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const club = store.clubs.find((c) => c.id === id);
  const existing = store.memberships.find(
    (m) => m.user_id === currentUser?.id && m.club_id === id,
  );

  const [contactEmail, setContactEmail] = useState(
    currentUser?.email ?? "",
  );
  const [phone, setPhone] = useState("");
  const [motivation, setMotivation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!club) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <EmptyState
          icon={AlertCircle}
          title="Club not found"
          description="This club may have been removed."
        />
      </div>
    );
  }

  if (existing) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <EmptyState
          icon={BadgeCheck}
          title="Application already submitted"
          description={`You already have a ${existing.status} membership record for ${club.name}.`}
          action={
            <Button
              size="sm"
              onClick={() => navigate(`/clubs/${club.id}`)}
            >
              Back to club
            </Button>
          }
        />
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !contactEmail.trim()) {
      toast.error("Missing details", {
        description: "Please provide your contact email and phone number.",
      });
      return;
    }
    setIsSubmitting(true);
    doApplyClub(club!.id, {
      contact_email: contactEmail.trim(),
      phone: phone.trim(),
      motivation: motivation.trim() || undefined,
    });
    navigate(`/clubs/${club!.id}`);
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Club Application
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-2xl sm:text-3xl font-semibold"
        >
          Apply to join {club.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit your details and the club team will review your
          application.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle style={{ fontFamily: "'Outfit', sans-serif" }}>
              Your details
            </CardTitle>
            <CardDescription>
              We only share this with the club's organisers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={currentUser?.name ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 01700000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="motivation">
                Why do you want to join? (optional)
              </Label>
              <Textarea
                id="motivation"
                placeholder="Tell the club a little about yourself and your interests."
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/clubs/${club.id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
