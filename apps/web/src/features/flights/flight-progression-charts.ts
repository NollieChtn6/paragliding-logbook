export type FlightTypeBreakdownEntry = { code: string; count: number };

// allFlightTypeCodes vient du référentiel FlightType (pas déduit des vols) :
// un type jamais volé doit quand même apparaître, avec un compte à 0 — sinon
// le graphique en barres (ADR 012) ne montrerait que les types déjà
// pratiqués, ce qui ne dit rien sur ceux qui manquent encore.
export function getFlightTypeBreakdown(
  flights: { flightTypeCode: string }[],
  allFlightTypeCodes: string[],
): FlightTypeBreakdownEntry[] {
  const counts = new Map<string, number>();
  for (const flight of flights) {
    counts.set(flight.flightTypeCode, (counts.get(flight.flightTypeCode) ?? 0) + 1);
  }

  return allFlightTypeCodes.map((code) => ({ code, count: counts.get(code) ?? 0 }));
}

// Un site compte dès sa première apparition, décollage OU atterrissage,
// n'importe où dans l'historique — un site revisité (y compris vu d'abord
// comme atterrissage puis comme décollage un autre jour) ne compte qu'une
// fois. Chiffre unique plutôt qu'une courbe mensuelle : l'évolution mois par
// mois n'apporte rien ici, seul le total de sites déjà découverts est utile
// (retour utilisateur — une courbe supplémentaire rendait la carte confuse).
export function getDistinctSitesCount(
  flights: { takeoffSiteId: string; landingSiteId: string }[],
): number {
  const sites = new Set<string>();
  for (const flight of flights) {
    sites.add(flight.takeoffSiteId);
    sites.add(flight.landingSiteId);
  }
  return sites.size;
}

export type AverageDurationPoint = { month: string; averageMinutes: number };

// Contrairement à getFlightProgressionTrend, PAS cumulatif : chaque point ne
// résume que les vols de son propre mois. Un mois sans vol n'apparaît pas du
// tout (ni 0, ni valeur interpolée) : un pilote qui n'a pas volé un mois
// donné n'a pas de "durée moyenne" ce mois-là, l'absence de point est le
// signal correct, pas une chute artificielle à 0.
export function getAverageDurationTrend(
  flights: { date: Date; durationMin: number }[],
): AverageDurationPoint[] {
  const chronological = [...flights].sort((a, b) => a.date.getTime() - b.date.getTime());
  const totalsByMonth = new Map<string, { totalMinutes: number; count: number }>();

  for (const flight of chronological) {
    const month = flight.date.toISOString().slice(0, 7);
    const existing = totalsByMonth.get(month) ?? { totalMinutes: 0, count: 0 };
    existing.totalMinutes += flight.durationMin;
    existing.count += 1;
    totalsByMonth.set(month, existing);
  }

  // L'ordre d'insertion du Map suit déjà l'ordre chronologique (chaque mois
  // n'est ajouté qu'à sa première rencontre, flights étant déjà trié) : pas
  // besoin d'un tri supplémentaire par clé.
  return [...totalsByMonth.entries()].map(([month, { totalMinutes, count }]) => ({
    month,
    averageMinutes: totalMinutes / count,
  }));
}

// Delta signé entre les deux derniers points d'une série cumulative
// (nombre de vols, heures de vol...) — pas de delta pour une série de moins
// de deux points, il n'y a alors rien à comparer au mois précédent.
export function getLatestMonthDelta(cumulativeValues: number[]): number | undefined {
  if (cumulativeValues.length < 2) return undefined;
  const last = cumulativeValues.at(-1) as number;
  const previous = cumulativeValues.at(-2) as number;
  return last - previous;
}

// Convertit une série cumulative en valeurs mensuelles (diff avec le point
// précédent, premier point inchangé) : un graphique en bâtons sur du
// cumulé ne fait que monter d'un mois à l'autre, ce qui n'est pas parlant
// (retour utilisateur) — la valeur "de ce mois-ci" l'est davantage, quitte
// à monter ou descendre d'un mois sur l'autre.
export function toMonthlyValues(cumulativeValues: number[]): number[] {
  return cumulativeValues.map((value, index) =>
    index === 0 ? value : value - (cumulativeValues[index - 1] as number),
  );
}

export type FavoriteSite = { id: string; label: string; count: number };

// Le site qui revient le plus souvent, décollage OU atterrissage confondus
// (même granularité que getDistinctSitesCount). En cas d'égalité, le site
// rencontré en premier dans l'historique chronologique l'emporte (ordre
// d'insertion du Map) : déterministe, ne varie pas d'un appel à l'autre.
export function getFavoriteSite(
  flights: {
    takeoffSite: { id: string; label: string };
    landingSite: { id: string; label: string };
  }[],
): FavoriteSite | undefined {
  const counts = new Map<string, { label: string; count: number }>();

  for (const flight of flights) {
    for (const site of [flight.takeoffSite, flight.landingSite]) {
      const existing = counts.get(site.id);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(site.id, { label: site.label, count: 1 });
      }
    }
  }

  let favorite: FavoriteSite | undefined;
  for (const [id, { label, count }] of counts) {
    if (!favorite || count > favorite.count) {
      favorite = { id, label, count };
    }
  }
  return favorite;
}

// La plus longue durée jamais enregistrée, tous vols confondus.
export function getLongestFlightDuration(flights: { durationMin: number }[]): number | undefined {
  if (flights.length === 0) return undefined;
  return Math.max(...flights.map((flight) => flight.durationMin));
}
