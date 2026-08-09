import type { LucideIcon } from "lucide-react";
import { GraduationCap, Plane, Wind } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ActivityCardType = "FLIGHT" | "TRAINING_CAMP" | "GROUND_HANDLING";

// Même logique de discrimination que getActivitySummary
// (features/activities/activity-summary.ts), côté présentation : évite de
// faire dépendre ce composant UI du champ activityType.code (string brute
// côté Prisma) pour choisir un glyphe.
export function getActivityCardType(activity: {
  flight: unknown;
  trainingCamp: unknown;
  groundHandlingSession: unknown;
}): ActivityCardType {
  if (activity.flight) return "FLIGHT";
  if (activity.trainingCamp) return "TRAINING_CAMP";
  return "GROUND_HANDLING";
}

export const ACTIVITY_TYPE_STYLE: Record<
  ActivityCardType,
  { icon: LucideIcon; className: string }
> = {
  FLIGHT: { icon: Plane, className: "bg-primary/10 text-primary" },
  TRAINING_CAMP: { icon: GraduationCap, className: "bg-accent/15 text-accent" },
  GROUND_HANDLING: { icon: Wind, className: "bg-muted text-muted-foreground" },
};

type ActivityCardProps = {
  href: string;
  type: ActivityCardType;
  title: string;
  // 2 lignes distinctes plutôt qu'un sous-titre combiné (voir
  // getActivitySummary, features/activities/activity-summary.ts) : avec le
  // titre, 3 lignes au total — lisible sur mobile sans tout tronquer sur une
  // seule ligne de sous-titre.
  location: string;
  dateInfo: string;
};

// Ligne de liste réutilisée par /activities et le dashboard (activités
// récentes). Le glyphe par type vient de activity.activityType.code — pas
// de dépendance à getActivitySummary (qui ne renvoie que du texte),
// l'appelant a toujours l'Activity complète sous la main.
export function ActivityCard({ href, type, title, location, dateInfo }: ActivityCardProps) {
  const { icon: Icon, className } = ACTIVITY_TYPE_STYLE[type];

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5"
    >
      <span
        className={cn("flex size-9 flex-none items-center justify-center rounded-xl", className)}
        aria-hidden
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{title}</span>
        <span className="block truncate text-sm text-muted-foreground">{location}</span>
        <span className="block truncate text-sm text-muted-foreground">{dateInfo}</span>
      </span>
    </Link>
  );
}
