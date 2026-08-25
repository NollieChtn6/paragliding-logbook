import { Clock3, GraduationCap, Hourglass, Plane, Wind } from "lucide-react";
import Link from "next/link";
import { ActivityCard, getActivityCardType } from "@/components/activity-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { getActivitySummary } from "@/features/activities";
import { getDashboardData } from "@/features/dashboard";
import { requireCurrentUser } from "@/lib/current-user";
import { formatDurationMinutes } from "@/lib/format-duration";
import { getGreeting } from "@/lib/greeting";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

// Les statistiques et activités récentes doivent toujours refléter l'état
// actuel de la base, pas un instantané figé au build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireCurrentUser();
  const { stats, recentActivities } = await getDashboardData(user.id);
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    // md:h-full/overflow-hidden : sur desktop, seule la liste d'activités
    // récentes (plus bas, md:overflow-y-auto) doit défiler — pas le header
    // ni les stats. <main> (AppShell) reste le filet de sécurité générique
    // pour les autres pages, mais ne défile jamais réellement ici puisque ce
    // conteneur absorbe toute la hauteur disponible lui-même.
    <div className="flex flex-col gap-6 md:h-full md:overflow-hidden">
      <PageHeader
        title={getGreeting(user.name, t.dashboard)}
        description={t.dashboard.subtitle}
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/activities/new">{t.dashboard.addButton}</Link>}
          />
        }
      />

      {/* Masquée tant qu'il n'y a aucune activité (audit UX, item U4) :
      une grille de 6 stats à zéro/tirets avant la moindre saisie n'apporte
      rien, l'EmptyState ci-dessous suffit à guider un nouvel utilisateur. */}
      {stats.totalActivityCount > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard icon={Plane} label={t.dashboard.statFlights} value={stats.flightCount} />
          <StatCard
            icon={Hourglass}
            label={t.dashboard.statTotalFlightTime}
            value={formatDurationMinutes(stats.totalFlightMinutes)}
          />
          <StatCard
            icon={Clock3}
            label={t.dashboard.statAverageFlightTime}
            value={
              stats.averageFlightMinutes === null
                ? "—"
                : t.dashboard.minutesSuffix(stats.averageFlightMinutes)
            }
          />
          <StatCard
            icon={Wind}
            label={t.dashboard.statGroundHandlingSessions}
            value={stats.groundHandlingSessionCount}
            tone="accent"
          />
          <StatCard
            icon={Hourglass}
            label={t.dashboard.statTotalGroundHandlingTime}
            value={formatDurationMinutes(stats.totalGroundHandlingMinutes)}
            tone="accent"
          />
          <StatCard
            icon={GraduationCap}
            label={t.dashboard.statTrainingCamps}
            value={stats.trainingCampCount}
            tone="accent"
          />
        </div>
      )}

      {/* order-1 md:order-none (critique dashboard, item P1) : sur mobile,
      une seule colonne défilée au pouce, la carte d'installation PWA (icône
      + titre + QR + 2 lignes de texte) s'intercalait entre les stats et la
      vraie raison de la visite (confirmer que l'activité vient d'être
      enregistrée), à l'encontre de la promesse "en un coup d'œil" du
      sous-titre — repoussée après la liste. Sur desktop (>= md), la mise en
      page en deux zones (stats+prompt qui défilent naturellement, liste
      d'activités qui défile dans son propre conteneur borné) n'a pas ce
      problème : order-none y restaure l'ordre du DOM, entre les stats et la
      liste. */}
      <div className="order-1 md:order-none">
        <InstallPrompt hasActivities={stats.totalActivityCount > 0} />
      </div>

      <div className="flex flex-col gap-3 md:min-h-0 md:flex-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight text-foreground">
            {t.dashboard.recentActivities}
            <span className="text-muted-foreground">
              {" "}
              · {t.dashboard.totalCount(stats.totalActivityCount)}
            </span>
          </h2>
          <Link href="/activities" className="text-sm font-medium text-primary hover:underline">
            {t.dashboard.seeAll}
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <EmptyState
            title={t.dashboard.emptyTitle}
            description={t.dashboard.emptyDescription}
            action={
              <Button
                nativeButton={false}
                variant="outline"
                render={<Link href="/activities/new">{t.dashboard.addActivity}</Link>}
              />
            }
          />
        ) : (
          <div className="flex flex-col gap-2 md:overflow-y-auto">
            {recentActivities.map((activity) => {
              const summary = getActivitySummary(activity, locale, t);
              return (
                <ActivityCard
                  key={activity.id}
                  href={`/activities/${activity.id}`}
                  type={getActivityCardType(activity)}
                  title={summary.title}
                  location={summary.location}
                  dateInfo={summary.dateInfo}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
