import type { LucideIcon } from "lucide-react";
import { CloudOff } from "lucide-react";
import type * as React from "react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

// Remplace les lignes de texte "Aucune activité…" par un état plus posé,
// cohérent avec l'ambiance "ciel/altitude" (CloudOff par défaut).
export function EmptyState({ icon: Icon = CloudOff, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
      <Icon className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
