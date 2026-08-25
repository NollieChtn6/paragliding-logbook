import { Award } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { TrendChart } from "@/components/trend-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFlightProgression } from "@/features/flights";
import { requireCurrentUser } from "@/lib/current-user";
import { formatDate } from "@/lib/format-date";
import { getLocale } from "@/lib/i18n/get-locale";
import { getMilestoneToastMessage } from "@/lib/milestone-message";
import { getDictionary } from "@/messages";

// Les tendances et paliers doivent toujours refléter l'état actuel de la
// base, pas un instantané figé au build.
export const dynamic = "force-dynamic";

export default async function ProgressionPage() {
  const user = await requireCurrentUser();
  const progression = await getFlightProgression(user.id);
  const locale = await getLocale();
  const t = getDictionary(locale);
  const tp = t.progression;

  // Paliers les plus récents en premier : cohérent avec la liste "Activités
  // récentes" du dashboard (get-dashboard-data.service.ts), qui lit aussi du
  // plus récent au plus ancien.
  const milestonesByRecency = [...progression.milestoneHistory].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tp.pageTitle}
        description={tp.subtitle}
        actions={
          <Button
            nativeButton={false}
            variant="outline"
            render={
              <Link href="/qualifications">
                <Award className="size-4" aria-hidden />
                {t.shell.qualificationsLink}
              </Link>
            }
          />
        }
      />

      {progression.flightCount === 0 ? (
        <EmptyState title={tp.emptyTitle} description={tp.emptyDescription} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle>{tp.flightCountTrendTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                {progression.trend.length < 2 ? (
                  <p className="text-sm text-muted-foreground">{tp.notEnoughDataForTrend}</p>
                ) : (
                  <TrendChart
                    points={progression.trend.map((point) => ({ value: point.cumulativeCount }))}
                  />
                )}
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>{tp.flightHoursTrendTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                {progression.trend.length < 2 ? (
                  <p className="text-sm text-muted-foreground">{tp.notEnoughDataForTrend}</p>
                ) : (
                  <TrendChart
                    points={progression.trend.map((point) => ({ value: point.cumulativeHours }))}
                    tone="accent"
                  />
                )}
              </CardContent>
            </Card>
          </div>

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
        </>
      )}
    </div>
  );
}
