import { cn } from "@/lib/utils";

type BarChartProps = {
  bars: { label: string; value: number }[];
  tone?: "primary" | "accent";
};

// Barres, jamais camembert/donut (ADR 011,
// docs/decisions/011-progression-chart-bars-not-pie.md). Contrairement à
// TrendChart (components/trend-chart.tsx), pas de SVG ici : une barre
// proportionnelle n'est qu'une largeur en pourcentage, plus simple à écrire
// qu'un rectangle SVG calculé à la main et sans le risque de troncature de
// libellés (les traductions du type de vol varient en longueur) qu'un texte
// SVG poserait. Une valeur à 0 donne juste une piste vide, jamais de barre
// cassée.
export function BarChart({ bars, tone = "primary" }: BarChartProps) {
  const maxValue = Math.max(...bars.map((bar) => bar.value), 0);

  return (
    <div className="flex flex-col gap-3">
      {bars.map((bar) => {
        const widthPercent = maxValue === 0 ? 0 : (bar.value / maxValue) * 100;
        return (
          <div key={bar.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate text-muted-foreground">{bar.label}</span>
              <span className="flex-none tabular-nums text-foreground">{bar.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  tone === "accent" ? "bg-accent" : "bg-primary",
                )}
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
