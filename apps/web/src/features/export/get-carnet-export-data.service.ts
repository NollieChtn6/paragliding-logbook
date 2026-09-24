import {
  type ActivityWithDetails,
  getActivityEventDate,
  listActivities,
} from "@/features/activities";
import {
  type FavoriteSite,
  getFlightProgression,
  type MilestoneHistoryEntry,
} from "@/features/flights";
import { listQualifications, type QualificationListItem } from "@/features/qualifications";

// Bornes en "yyyy-MM-dd" (comparaison au jour près, même principe que
// activities-filter.tsx/toDayString) : évite tout souci de fuseau horaire,
// se compare directement à la valeur d'un <Input type="date"> transmise
// telle quelle par la route d'export (#228). Range absente = historique
// complet ; borne absente au sein d'une range = non bornée de ce côté.
export type CarnetDateRangeFilter = {
  from?: string;
  to?: string;
};

// Sous-ensemble de FlightProgression pertinent pour l'export (nombre de
// vols, temps cumulé, paliers, site préféré, vol le plus long) : pas de
// nouveau calcul, simple lecture de champs déjà produits par
// getFlightProgression (voir ticket #227).
export type CarnetStats = {
  flightCount: number;
  cumulativeFlightHours: number;
  milestoneHistory: MilestoneHistoryEntry[];
  favoriteSite: FavoriteSite | undefined;
  longestFlightDuration: number | undefined;
};

export type CarnetExportData = {
  // Propriété de l'export dans son ensemble (pas par activité) : compact
  // sans filtre de dates, complet (observations/points d'amélioration
  // inclus, seul Flight en a) dès qu'un filtre est appliqué.
  detailLevel: "compact" | "full";
  // Chronologique, du plus ancien au plus récent (inverse de listActivities
  // et de /activities) : raconte la progression comme une histoire.
  activities: ActivityWithDetails[];
  stats: CarnetStats;
  qualifications: QualificationListItem[];
};

function toDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Assemble tout ce dont l'export PDF du carnet a besoin, en composant trois
// lectures déjà testées (listActivities, getFlightProgression,
// listQualifications) — même principe que getDashboardData
// (features/dashboard/get-dashboard-data.service.ts), aucune nouvelle
// requête Prisma. Stats et Qualifications restent toujours calculées sur
// l'historique complet, indépendamment du filtre de dates : seule la liste
// d'activités est bornée par dateRange.
export async function getCarnetExportData(
  userId: string,
  dateRange?: CarnetDateRangeFilter,
): Promise<CarnetExportData> {
  const [activities, progression, qualifications] = await Promise.all([
    listActivities(userId),
    getFlightProgression(userId),
    listQualifications(userId),
  ]);

  const chronological = [...activities].reverse();
  const filteredActivities = dateRange
    ? chronological.filter((activity) => {
        const day = toDayString(getActivityEventDate(activity));
        if (dateRange.from && day < dateRange.from) return false;
        if (dateRange.to && day > dateRange.to) return false;
        return true;
      })
    : chronological;

  return {
    detailLevel: dateRange ? "full" : "compact",
    activities: filteredActivities,
    stats: {
      flightCount: progression.flightCount,
      cumulativeFlightHours: progression.trend.at(-1)?.cumulativeHours ?? 0,
      milestoneHistory: progression.milestoneHistory,
      favoriteSite: progression.favoriteSite,
      longestFlightDuration: progression.longestFlightDuration,
    },
    qualifications,
  };
}
