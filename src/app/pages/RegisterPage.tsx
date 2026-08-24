import React, {
  useState
} from "react";
import {
  Link,
  useNavigate
} from "react-router";

import { toast } from "sonner";
import {
  BookOpen
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { roleHome } from "../context/AuthContext";
import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { GoogleIcon } from "../components/GoogleIcon";
import { ComicButton } from "../components/ComicButton";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, signInWithGoogle, currentUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    studentId: "",
    department: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@iub.edu.bd")) {
      toast.error("Invalid email", {
        description:
          "Registration requires a valid @iub.edu.bd email.",
      });
      return;
    }
    if (form.password.length < 8) {
      toast.error("Weak password", {
        description: "Password must be at least 8 characters.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await register({
        name: form.name,
        email: normalizedEmail,
        student_id: form.studentId,
        department: form.department,
        password: form.password,
      });
      toast.success("Account created!", {
        description:
          "Welcome to IUB Campus Hub. You're signed in as a student.",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration failed.", error);
      toast.error("Registration failed", {
        description:
          "Could not create the account. Try a different email.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-up failed.", error);
      toast.error("Google sign-up failed", {
        description:
          "Use an @iub.edu.bd Google account to continue.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  React.useEffect(() => {
    if (currentUser) {
      navigate(roleHome(currentUser.role), { replace: true });
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen flex items-stretch">
      <AuthBrandPanel />

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <BookOpen className="size-5 text-primary" />
              <span
                style={{ fontFamily: "'Outfit', sans-serif" }}
                className="font-semibold text-primary"
              >
                Campus Event &amp; Club Management
              </span>
            </div>
            <h1
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="text-3xl font-semibold mb-1.5"
            >
              Create Account
            </h1>
            <p className="text-sm text-muted-foreground">
              Join your campus hub with your IUB email.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="e.g. Anika Rahman"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>IUB Email</Label>
              <Input
                type="email"
                placeholder="yourname@iub.edu.bd"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Student ID</Label>
                <Input
                  placeholder="e.g. 2321200"
                  value={form.studentId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      studentId: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) =>
                    setForm({ ...form, department: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "CSE",
                      "EEE",
                      "BBA",
                      "MBA",
                      "ECO",
                      "PHY",
                      "ENG",
                      "SOC",
                    ].map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
            </div>
            <div className="flex justify-center">
              <ComicButton
                type="submit"
                disabled={isSubmitting}
                ariaLabel="Create Account"
              >
                {isSubmitting
                  ? "Creating account..."
                  : "Create Account"}
              </ComicButton>
            </div>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full gap-2.5 font-normal"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            <GoogleIcon className="size-4" />
            Sign up with Google
          </Button>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
