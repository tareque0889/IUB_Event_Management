import * as React from "react";
import { cn } from "./utils";

/**
 * Base skeleton block. Uses the theme `muted` colour and Tailwind's
 * `animate-pulse` so it matches Radix/shadcn primitives already in use.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
