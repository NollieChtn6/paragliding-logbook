import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "primary" | "accent";
};

// Tuile de statistique atomique (une valeur, un libellé) : le dashboard en
// affiche plusieurs côte à côte plutôt qu'une seule Card à métriques
// multiples, pour rester réutilisable ailleurs. Barème typographique de la
// valeur : docs/ui-directions.md ("Valeurs statistiques").
export function StatCard({ icon: Icon, label, value, tone = "primary" }: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            tone === "accent" ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="block truncate text-2xl font-bold tracking-tight tabular-nums text-foreground">
          {value}
        </span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}
