import Link from "next/link";
import { getActivityCardType } from "@/components/activity-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getActivitySummary, listActivities } from "@/features/activities";
import { requireCurrentUser } from "@/lib/current-user";
import { ActivitiesFilter } from "./activities-filter";

// La liste doit toujours refléter l'état actuel de la base, pas un
// instantané figé au build.
export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const user = await requireCurrentUser();
  const activities = await listActivities(user.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Activités"
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/activities/new">Nouvelle activité</Link>}
          />
        }
      />

      {activities.length === 0 ? (
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
        <ActivitiesFilter
          activities={activities.map((activity) => {
            const summary = getActivitySummary(activity);
            return {
              id: activity.id,
              type: getActivityCardType(activity),
              title: summary.title,
              location: summary.location,
              dateInfo: summary.dateInfo,
            };
          })}
        />
      )}
    </div>
  );
}
