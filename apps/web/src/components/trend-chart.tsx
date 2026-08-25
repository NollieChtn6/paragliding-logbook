import { cn } from "@/lib/utils";

type TrendChartProps = {
  points: { value: number }[];
  tone?: "primary" | "accent";
};

const CHART_WIDTH = 300;
const CHART_HEIGHT = 96;
const CHART_PADDING = 8;

// Line chart minimal fait main (pas de dépendance de graphique — DESIGN.md
// note qu'aucune bibliothèque de charts n'est encore utilisée dans le
// produit) : une polyline SVG plus une zone teintée sous la courbe, cohérent
// avec la Soft Status Rule (teinte 10-15%, jamais un aplat).
export function TrendChart({ points, tone = "primary" }: TrendChartProps) {
  if (points.length < 2) return null;

  const maxValue = Math.max(...points.map((point) => point.value));
  const usableHeight = CHART_HEIGHT - CHART_PADDING * 2;
  const usableWidth = CHART_WIDTH - CHART_PADDING * 2;

  const coords = points.map((point, index) => ({
    x: CHART_PADDING + (index / (points.length - 1)) * usableWidth,
    y:
      CHART_PADDING + usableHeight - (maxValue === 0 ? 0 : (point.value / maxValue) * usableHeight),
  }));

  const firstCoord = coords[0];
  const lastCoord = coords[coords.length - 1];
  const baseline = CHART_HEIGHT - CHART_PADDING;
  const linePath = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x},${coord.y}`)
    .join(" ");
  const areaPath = `${linePath} L${lastCoord.x},${baseline} L${firstCoord.x},${baseline} Z`;

  return (
    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full" aria-hidden="true">
      <path
        d={areaPath}
        className={tone === "accent" ? "fill-accent/10" : "fill-primary/10"}
        stroke="none"
      />
      <path
        d={linePath}
        className={cn("fill-none", tone === "accent" ? "stroke-accent" : "stroke-primary")}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
