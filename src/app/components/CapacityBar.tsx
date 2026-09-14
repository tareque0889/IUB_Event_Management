
import { capacityColor } from "../lib/uiHelpers";

export function CapacityBar({
  registered,
  capacity,
}: {
  registered: number;
  capacity: number;
}) {
  const pct = Math.min(
    100,
    Math.round((registered / capacity) * 100),
  );
  return (
    <div className="space-y-1 w-full">
      <div className="flex justify-between items-center gap-2">
        <span className="text-xs text-muted-foreground font-mono">
          {registered}/{capacity} seats
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${capacityColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

