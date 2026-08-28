import { cn } from "@/lib/utils";

type ColumnChartProps = {
  points: { value: number }[];
  tone?: "primary" | "accent";
};

const CHART_HEIGHT = 96;

// Bâtons pour une série mensuelle (nombre de vols/temps de vol cumulé)
// plutôt qu'une ligne — remplace l'ancien TrendChart (courbe SVG) sur ces
// deux cartes : retour utilisateur, une courbe se lisait mal, des colonnes
// une par mois sont plus parlantes. CSS plutôt que SVG (même raisonnement
// que BarChart) : une hauteur en pourcentage dans un conteneur flex suffit,
// pas besoin de calculer des rectangles à la main. flex-1 sur chaque
// colonne : la largeur s'adapte automatiquement au nombre de mois, y
// compris sur mobile.
export function ColumnChart({ points, tone = "primary" }: ColumnChartProps) {
  if (points.length < 2) return null;

  const maxValue = Math.max(...points.map((point) => point.value), 0);

  return (
    <div className="flex items-end gap-1" style={{ height: CHART_HEIGHT }}>
      {points.map((point, index) => {
        const heightPercent = maxValue === 0 ? 0 : (point.value / maxValue) * 100;
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: points n'ont pas d'identifiant stable (dérivés en mémoire), l'ordre ne change jamais une fois rendu.
            key={index}
            className={cn(
              "min-h-0.5 flex-1 rounded-t-sm",
              tone === "accent" ? "bg-accent" : "bg-primary",
            )}
            style={{ height: `${heightPercent}%` }}
          />
        );
      })}
    </div>
  );
}
