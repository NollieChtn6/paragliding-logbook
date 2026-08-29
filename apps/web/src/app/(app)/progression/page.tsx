import { Award, GraduationCap, MapPin, Star, Timer } from "lucide-react";
import { BarChart } from "@/components/bar-chart";
import { ColumnChart } from "@/components/column-chart";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFlightProgression, toMonthlyValues } from "@/features/flights";
import { getParcoursTimeline } from "@/features/progression";
import { requireCurrentUser } from "@/lib/current-user";
import { formatDate } from "@/lib/format-date";
import { formatDurationMinutes } from "@/lib/format-duration";
import { getLocale } from "@/lib/i18n/get-locale";
import { getMilestoneToastMessage } from "@/lib/milestone-message";
import { getDictionary } from "@/messages";

// Les tendances et paliers doivent toujours refléter l'état actuel de la
// base, pas un instantané figé au build.
export const dynamic = "force-dynamic";

export default async function ProgressionPage() {
  const user = await requireCurrentUser();
  const [progression, parcoursTimeline] = await Promise.all([
    getFlightProgression(user.id),
    getParcoursTimeline(user.id),
  ]);
  const locale = await getLocale();
  const t = getDictionary(locale);
  const tp = t.progression;

  // Paliers les plus récents en premier : cohérent avec la liste "Activités
  // récentes" du dashboard (get-dashboard-data.service.ts), qui lit aussi du
  // plus récent au plus ancien.
  const milestonesByRecency = [...progression.milestoneHistory].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  const lastTrendPoint = progression.trend.at(-1);
  const lastAverageDurationPoint = progression.averageDurationTrend.at(-1);
  const flightTypeBars = progression.flightTypeBreakdown.map((entry) => ({
    label: t.referenceLabels.flightType[entry.code] ?? entry.code,
    value: entry.count,
  }));
  // Bâtons sur les 3 derniers mois, en valeurs mensuelles (pas cumulées) :
  // un cumulé ne fait que monter d'un mois à l'autre, peu parlant en
  // bâtons (retour utilisateur) — la valeur chiffrée et le delta au-dessus
  // restent, eux, basés sur le cumulé total (inchangés).
  const RECENT_MONTHS_SHOWN = 3;
  const flightCountMonthlyBars = toMonthlyValues(progression.trend.map((p) => p.cumulativeCount))
    .slice(-RECENT_MONTHS_SHOWN)
    .map((value) => ({ value }));
  const flightHoursMonthlyBars = toMonthlyValues(progression.trend.map((p) => p.cumulativeHours))
    .slice(-RECENT_MONTHS_SHOWN)
    .map((value) => ({ value }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={tp.pageTitle} description={tp.subtitle} />

      {progression.flightCount === 0 ? (
        <EmptyState title={tp.emptyTitle} description={tp.emptyDescription} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle as="h2">{tp.flightCountTrendTitle}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {progression.trend.length < 2 || !lastTrendPoint ? (
                  <p className="text-sm text-muted-foreground">
                    {tp.notEnoughDataForTrend(Math.max(0, 2 - progression.trend.length))}
                  </p>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                        {tp.flightCountHeadline(lastTrendPoint.cumulativeCount)}
                      </span>
                      {progression.flightCountDelta !== undefined && (
                        <span className="flex-none rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                          {tp.flightCountDelta(progression.flightCountDelta)}
                        </span>
                      )}
                    </div>
                    <ColumnChart points={flightCountMonthlyBars} />
                  </>
                )}
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle as="h2">{tp.flightHoursTrendTitle}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {progression.trend.length < 2 || !lastTrendPoint ? (
                  <p className="text-sm text-muted-foreground">
                    {tp.notEnoughDataForTrend(Math.max(0, 2 - progression.trend.length))}
                  </p>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                        {formatDurationMinutes(Math.round(lastTrendPoint.cumulativeHours * 60))}
                      </span>
                      {progression.flightHoursDelta !== undefined && (
                        <span className="flex-none rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                          {tp.flightHoursDelta(progression.flightHoursDelta)}
                        </span>
                      )}
                    </div>
                    <ColumnChart points={flightHoursMonthlyBars} tone="accent" />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card size="sm">
            <CardHeader>
              <CardTitle as="h2">{tp.flightTypeBreakdownTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart bars={flightTypeBars} />
            </CardContent>
          </Card>

          <section
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            aria-label={tp.statsGroupLabel}
          >
            <StatCard icon={MapPin} label={tp.sitesVisitedLabel} value={progression.sitesCount} />
            {progression.longestFlightDuration !== undefined && (
              <StatCard
                icon={Timer}
                label={tp.longestFlightLabel}
                value={formatDurationMinutes(progression.longestFlightDuration)}
                tone="accent"
              />
            )}
            {progression.favoriteSite && (
              <StatCard
                icon={Star}
                label={tp.favoriteSiteLabel}
                value={progression.favoriteSite.label}
              />
            )}
          </section>

          {lastAverageDurationPoint && (
            <Card size="sm">
              <CardHeader>
                <CardTitle as="h2">{tp.averageDurationTrendTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                    {formatDurationMinutes(Math.round(lastAverageDurationPoint.averageMinutes))}
                  </span>
                  {progression.averageDurationDelta !== undefined && (
                    <span className="flex-none rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {tp.averageDurationDelta(progression.averageDurationDelta)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium tracking-tight text-foreground">
              {tp.milestonesTitle}
            </h2>
            {milestonesByRecency.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tp.noMilestonesYet}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {milestonesByRecency.map((entry) => (
                  <div
                    // Pas d'identifiant stable côté paliers (dérivés en
                    // mémoire, jamais persistés) : kind+valeur est déjà
                    // unique par construction, un palier donné n'est franchi
                    // qu'une fois dans tout le carnet.
                    key={`${entry.milestone.kind}-${"count" in entry.milestone ? entry.milestone.count : entry.milestone.hours}`}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <span
                      className="flex size-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent"
                      aria-hidden
                    >
                      <Award className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {getMilestoneToastMessage(entry.milestone, t.toast)}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {formatDate(entry.date, locale)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {parcoursTimeline.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-medium tracking-tight text-foreground">
                {tp.parcoursTitle}
              </h2>
              <div className="flex flex-col gap-2">
                {parcoursTimeline.map((entry) => {
                  const typeLabel =
                    entry.kind === "training-camp"
                      ? (t.referenceLabels.trainingCampType[entry.trainingCampTypeCode] ??
                        entry.trainingCampTypeCode)
                      : (t.referenceLabels.qualificationType[entry.qualificationTypeCode] ??
                        entry.qualificationTypeCode);
                  const dateLabel = formatDate(entry.date, locale);
                  const subtitle = entry.schoolName
                    ? `${dateLabel} · ${entry.schoolName}`
                    : dateLabel;

                  return (
                    <div
                      key={`${entry.kind}-${typeLabel}-${entry.date.getTime()}`}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
                    >
                      <span
                        className="flex size-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent"
                        aria-hidden
                      >
                        {entry.kind === "training-camp" ? (
                          <GraduationCap className="size-4" />
                        ) : (
                          <Award className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {typeLabel}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {subtitle}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
