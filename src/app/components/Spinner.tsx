import { Loader2 } from "lucide-react";
import { cn } from "./ui/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("size-4 animate-spin", className)}
      aria-hidden="true"
    />
  );
}

export function HamsterLoader({
  label,
  fontSize,
}: {
  label?: string;
  /** Controls overall size (the loader is sized in em). Defaults to 14px. */
  fontSize?: number | string;
}) {
  return (
    <div
      aria-label={label ?? "Loading"}
      className="wheel-and-hamster"
      role="img"
      style={fontSize ? { fontSize } : undefined}
    >
      <div className="wheel" />
      <div className="hamster">
        <div className="hamster__body">
          <div className="hamster__head">
            <div className="hamster__ear" />
            <div className="hamster__eye" />
            <div className="hamster__nose" />
          </div>
          <div className="hamster__limb hamster__limb--fr" />
          <div className="hamster__limb hamster__limb--fl" />
          <div className="hamster__limb hamster__limb--br" />
          <div className="hamster__limb hamster__limb--bl" />
          <div className="hamster__tail" />
        </div>
      </div>
      <div className="spoke" />
    </div>
  );
}

function LoadingWords({
  prefix = "loading",
  words = ["events", "clubs", "members", "dashboards", "updates"],
}: {
  prefix?: string;
  words?: string[];
}) {
  return (
    <div className="loader" aria-hidden="true">
      <p className="loader__prefix">{prefix}</p>
      <div className="words">
        {words.concat(words[0] ?? "").map((word, index) => (
          <span className="word" key={`${word}-${index}`}>
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LoadingScreen({
  label = "Loading...",
}: {
  label?: string;
}) {
  return (
    <div
      className="min-h-screen bg-background text-foreground flex items-center justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="hamster-loader-card">
        <div className="hamster-loader-content">
          <HamsterLoader label={label} fontSize={12} />
          <div className="hamster-loader-copy">
            <LoadingWords prefix="loading" />
            <p className="loading-screen-label text-sm text-muted-foreground">
              {label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
