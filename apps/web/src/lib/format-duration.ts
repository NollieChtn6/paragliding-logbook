const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

// Utilisé pour les temps cumulés (Dashboard) : au-delà d'une heure, les
// minutes brutes deviennent difficiles à lire (ex. "1500 min"). Pas utilisé
// pour un temps moyen par vol (features/dashboard/dashboard-stats.ts,
// averageFlightMinutes), qui reste toujours court et se lit bien en minutes.
export function formatDurationMinutes(totalMinutes: number): string {
  if (totalMinutes < MINUTES_PER_HOUR) {
    return `${totalMinutes} min`;
  }

  const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const remainingAfterDays = totalMinutes % MINUTES_PER_DAY;
  const hours = Math.floor(remainingAfterDays / MINUTES_PER_HOUR);
  const minutes = remainingAfterDays % MINUTES_PER_HOUR;

  if (days > 0) {
    return `${days}j ${hours}h`;
  }
  return minutes > 0 ? `${hours}h${String(minutes).padStart(2, "0")}` : `${hours}h`;
}
