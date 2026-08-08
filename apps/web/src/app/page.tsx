import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActivitySummary } from "@/features/activities";
import { getDashboardData } from "@/features/dashboard";
import { requireCurrentUser } from "@/lib/current-user";

// Les statistiques et activités récentes doivent toujours refléter l'état
// actuel de la base, pas un instantané figé au build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireCurrentUser();
  const { stats, recentActivities } = await getDashboardData(user.id);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8 sm:max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Carnet de vol parapente
        </h1>
        <SignOutButton />
      </div>

      <Button
        nativeButton={false}
        render={<Link href="/activities/new">Ajouter une activité</Link>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Vols</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <StatRow label="Nombre de vols" value={stats.flightCount} />
            <StatRow label="Temps cumulé" value={`${stats.totalFlightMinutes} min`} />
            <StatRow
              label="Temps moyen"
              value={
                stats.averageFlightMinutes === null ? "—" : `${stats.averageFlightMinutes} min`
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gonflage</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <StatRow label="Nombre de séances" value={stats.groundHandlingSessionCount} />
            <StatRow label="Temps cumulé" value={`${stats.totalGroundHandlingMinutes} min`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <StatRow label="Activités enregistrées" value={stats.totalActivityCount} />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Activités récentes
          </h2>
          <Link href="/activities" className="text-sm text-muted-foreground hover:underline">
            Voir tout
          </Link>
        </div>

        {recentActivities.length === 0 && (
          <p className="text-muted-foreground">Aucune activité enregistrée pour l&apos;instant.</p>
        )}

        <ul className="flex flex-col gap-2">
          {recentActivities.map((activity) => {
            const summary = getActivitySummary(activity);
            return (
              <li key={activity.id}>
                <Link
                  href={`/activities/${activity.id}`}
                  className="flex flex-col gap-0.5 rounded-lg border border-input px-3 py-2 transition-colors hover:bg-accent"
                >
                  <span className="font-medium text-foreground">{summary.title}</span>
                  <span className="text-sm text-muted-foreground">{summary.subtitle}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
