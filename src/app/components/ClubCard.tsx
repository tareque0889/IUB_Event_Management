import { memo, useCallback } from "react";
import {
  useNavigate
} from "react-router";

import {
  Users, BadgeCheck
} from "lucide-react";
import {
  Card,
  CardContent, CardHeader,
  CardTitle
} from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type {
  Club
} from "../lib/store";
import { categoryColor } from "../lib/uiHelpers";
import { useAuth } from "../context/AuthContext";
import { useStoreSelector } from "../context/DataContext";
import { membershipFor } from "../lib/selectors";

/** Memoised; re-renders only when this club or the viewer's membership changes. */
export const ClubCard = memo(function ClubCard({ club }: { club: Club }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const membership = useStoreSelector(
    (s) => membershipFor(s, currentUser?.id, club.id),
    [currentUser?.id, club.id],
  );
  const open = useCallback(
    () => navigate(`/clubs/${club.id}`),
    [navigate, club.id],
  );

  return (
    <Card
      className="group overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 border-border"
      onClick={open}
    >
      <div className="h-32 overflow-hidden bg-muted">
        <ImageWithFallback
          src={club.cover_url}
          alt={club.name}
          displayWidth={640}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span
              className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${categoryColor(club.category)}`}
            >
              {club.category}
            </span>
            <CardTitle className="text-base mt-2 group-hover:text-primary transition-colors line-clamp-1">
              {club.name}
            </CardTitle>
          </div>
          {membership && (
            <BadgeCheck
              className={`size-5 shrink-0 mt-1 ${
                membership.status === "approved"
                  ? "text-quaternary"
                  : "text-accent"
              }`}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-2">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {club.description}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <Users className="size-3" />
          <span>
            {club.member_count.toLocaleString()} members
          </span>
        </div>
      </CardContent>
    </Card>
  );
});
