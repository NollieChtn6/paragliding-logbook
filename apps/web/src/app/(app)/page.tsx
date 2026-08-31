import { Clock3, GraduationCap, Hourglass, Plane, Plus, Wind } from "lucide-react";
import Link from "next/link";
import { ACTIVITY_TYPE_STYLE, getActivityCardType } from "@/components/activity-card";
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
            render={
              <Link href="/activities/new">
                <Plus className="size-4" aria-hidden />
                {t.dashboard.addButton}
              </Link>
            }
          />
        }
      />

      {/* Masquée tant qu'il n'y a aucune activité (audit UX, item U4) :
      une grille de 6 stats à zéro/tirets avant la moindre saisie n'apporte
      rien, l'EmptyState ci-dessous suffit à guider un nouvel utilisateur.
      Chaque groupe de tuiles (vol/gonflage/stage) est en plus masqué
      indépendamment (critique dashboard, item P2) : un utilisateur qui n'a
      par exemple encore jamais fait de vol n'a aucune raison de voir 3
      tuiles à "0"/"—" à côté de ses vraies statistiques de gonflage — même
      logique que le masquage global, appliquée par catégorie plutôt que
      tout-ou-rien. */}
      {stats.totalActivityCount > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.flightCount > 0 && (
            <>
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
            </>
          )}
          {stats.groundHandlingSessionCount > 0 && (
            <>
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
            </>
          )}
          {stats.trainingCampCount > 0 && (
            <StatCard
              icon={GraduationCap}
              label={t.dashboard.statTrainingCamps}
              value={stats.trainingCampCount}
              tone="accent"
            />
          )}
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

      <div className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-sm md:min-h-0 md:flex-1">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {t.dashboard.logbookTitle}
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
          // border-l pointillée sur la <ol> + badges rond -left-[30px] :
          // les badges (size-5, soit 20px) doivent avoir leur centre exactement
          // sur cette ligne, qui démarre au bord de la <ol> (avant son pl-5) —
          // d'où -30px = pl-5 (20px) + moitié de la largeur du badge (10px).
          <ol className="relative flex flex-col gap-5 border-l border-dashed border-border pl-5 md:overflow-y-auto">
            {recentActivities.map((activity) => {
              const summary = getActivitySummary(activity, locale, t);
              const { icon: Icon, className } = ACTIVITY_TYPE_STYLE[getActivityCardType(activity)];
              return (
                <li key={activity.id} className="relative">
                  <span
                    className={`absolute top-0.5 -left-[30px] flex size-5 items-center justify-center rounded-full border-2 border-card ${className}`}
                  >
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <Link href={`/activities/${activity.id}`} className="block">
                    <p className="text-sm font-medium text-foreground">{summary.title}</p>
                    <p className="text-sm text-muted-foreground">{summary.location}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="size-3" aria-hidden />
                      {summary.dateInfo}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
