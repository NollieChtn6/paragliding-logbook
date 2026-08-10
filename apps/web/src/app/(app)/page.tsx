import { Clock3, GraduationCap, Hourglass, Plane, Wind } from "lucide-react";
import Link from "next/link";
import { ActivityCard, getActivityCardType } from "@/components/activity-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { getActivitySummary } from "@/features/activities";
import { getDashboardData } from "@/features/dashboard";
import { requireCurrentUser } from "@/lib/current-user";
import { formatDurationMinutes } from "@/lib/format-duration";
import { getGreeting } from "@/lib/greeting";

// Les statistiques et activités récentes doivent toujours refléter l'état
// actuel de la base, pas un instantané figé au build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireCurrentUser();
  const { stats, recentActivities } = await getDashboardData(user.id);

  return (
    // md:h-full/overflow-hidden : sur desktop, seule la liste d'activités
    // récentes (plus bas, md:overflow-y-auto) doit défiler — pas le header
    // ni les stats. <main> (AppShell) reste le filet de sécurité générique
    // pour les autres pages, mais ne défile jamais réellement ici puisque ce
    // conteneur absorbe toute la hauteur disponible lui-même.
    <div className="flex flex-col gap-6 md:h-full md:overflow-hidden">
      <PageHeader
        title={getGreeting(user.name)}
        description="Votre progression en un coup d'œil"
        actions={
          <Button nativeButton={false} render={<Link href="/activities/new">Ajouter</Link>} />
        }
      />

      {/* Masquée tant qu'il n'y a aucune activité (audit UX, item U4) :
      une grille de 6 stats à zéro/tirets avant la moindre saisie n'apporte
      rien, l'EmptyState ci-dessous suffit à guider un nouvel utilisateur. */}
      {stats.totalActivityCount > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard icon={Plane} label="Vols" value={stats.flightCount} />
          <StatCard
            icon={Hourglass}
            label="Temps de vol cumulé"
            value={formatDurationMinutes(stats.totalFlightMinutes)}
          />
          <StatCard
            icon={Clock3}
            label="Temps moyen par vol"
            value={stats.averageFlightMinutes === null ? "—" : `${stats.averageFlightMinutes} min`}
          />
          <StatCard
            icon={Wind}
            label="Séances de gonflage"
            value={stats.groundHandlingSessionCount}
            tone="accent"
          />
          <StatCard
            icon={Hourglass}
            label="Temps de gonflage cumulé"
            value={formatDurationMinutes(stats.totalGroundHandlingMinutes)}
            tone="accent"
          />
          <StatCard
            icon={GraduationCap}
            label="Formations suivies"
            value={stats.trainingCampCount}
            tone="accent"
          />
        </div>
      )}

      <div className="flex flex-col gap-3 md:min-h-0 md:flex-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight text-foreground">
            Activités récentes
            <span className="text-muted-foreground"> · {stats.totalActivityCount} au total</span>
          </h2>
          <Link href="/activities" className="text-sm font-medium text-primary hover:underline">
            Voir tout
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <EmptyState
            title="Aucune activité enregistrée pour l'instant"
            description="Vos vols, stages et séances de gonflage apparaîtront ici."
            action={
              <Button
                nativeButton={false}
                variant="outline"
                render={<Link href="/activities/new">Ajouter une activité</Link>}
              />
            }
          />
        ) : (
          <div className="flex flex-col gap-2 md:overflow-y-auto">
            {recentActivities.map((activity) => {
              const summary = getActivitySummary(activity);
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
