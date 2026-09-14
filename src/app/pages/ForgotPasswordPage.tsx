import React, {
  useState
} from "react";
import {
  useNavigate
} from "react-router";

import { toast } from "sonner";
import {
  CheckCircle2, ArrowLeft
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ComicButton } from "../components/ComicButton";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.endsWith("@iub.edu.bd")) {
      toast.error("Invalid email", {
        description: "Please enter your @iub.edu.bd email.",
      });
      return;
    }
    setSent(true);
    toast.success("OTP sent", {
      description: "Check your IUB inbox for the reset code.",
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to login
        </button>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-xl sm:text-2xl font-semibold mb-1"
        >
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your IUB email and we'll send a reset OTP.
        </p>
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="yourname@iub.edu.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="flex justify-center">
              <ComicButton type="submit" ariaLabel="Send reset OTP">
                Send reset OTP
              </ComicButton>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-quaternary/10 border border-quaternary/30 p-4 flex gap-3">
              <CheckCircle2 className="size-5 text-quaternary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  OTP sent!
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  We sent a 6-digit code to{" "}
                  <strong>{email}</strong>. Expires in 10
                  minutes.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/login")}
            >
              Back to login
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Student Dashboard ────────────────────────────────────────────────────────
