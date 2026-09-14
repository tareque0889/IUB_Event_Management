import React, { memo } from "react";

/** Pure presentational card; memoised so dashboards re-render cheaply. */
export const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: "primary" | "accent" | "green" | "purple";
}) {
  const bg = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent-foreground",
    green: "bg-quaternary/15 text-foreground",
    purple: "bg-secondary/15 text-secondary-foreground",
  }[color];

  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-start gap-4">
      <div className={`rounded-md p-2.5 ${bg}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-bold font-mono text-foreground">
          {value}
        </p>
        <p className="text-sm font-medium text-foreground mt-0.5">
          {label}
        </p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
});

