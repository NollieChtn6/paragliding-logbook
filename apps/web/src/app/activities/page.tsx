import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { getActivitySummary, listActivities } from "@/features/activities";
import { requireCurrentUser } from "@/lib/current-user";

// La liste doit toujours refléter l'état actuel de la base, pas un
// instantané figé au build.
export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const user = await requireCurrentUser();
  const activities = await listActivities(user.id);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Activités</h1>
        <div className="flex items-center gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/activities/new">Nouvelle activité</Link>}
          />
          <SignOutButton />
        </div>
      </div>

      {activities.length === 0 && (
        <p className="text-muted-foreground">Aucune activité enregistrée pour l&apos;instant.</p>
      )}

      <ul className="flex flex-col gap-2">
        {activities.map((activity) => {
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
  );
}
