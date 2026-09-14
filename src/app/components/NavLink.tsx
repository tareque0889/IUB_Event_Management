import React from "react";
import {
  Link, useLocation
} from "react-router";



export function NavLink({
  to,
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  onClick?: () => void;
}) {
  const location = useLocation();
  const isActive =
    location.pathname === to ||
    (to !== "/" && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 relative ${
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
      {badge != null && badge > 0 && (
        <span className="ml-auto size-5 flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      {isActive && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sidebar-primary rounded-l" />
      )}
    </Link>
  );
}

