import Link from "next/link";
import { getActivityCardType } from "@/components/activity-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getActivityEventDate, getActivitySummary, listActivities } from "@/features/activities";
import { requireCurrentUser } from "@/lib/current-user";
import { ActivitiesFilter } from "./activities-filter";

// La liste doit toujours refléter l'état actuel de la base, pas un
// instantané figé au build.
export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const user = await requireCurrentUser();
  const activities = await listActivities(user.id);

  if (activities.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Activités"
          description="0 activité"
          actions={
            <Button
              nativeButton={false}
              render={<Link href="/activities/new">Nouvelle activité</Link>}
            />
          }
        />
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
      </div>
    );
  }

  // Titre + sous-titre (nombre d'activités) déplacés dans ActivitiesFilter :
  // le compte doit refléter le filtre actif, pas le total brut, et doit
  // rester fixe (ne pas défiler) avec les filtres eux-mêmes — les trois
  // vivent donc dans le même composant client.
  return (
    <ActivitiesFilter
      activities={activities.map((activity) => {
        const summary = getActivitySummary(activity);
        return {
          id: activity.id,
          type: getActivityCardType(activity),
          title: summary.title,
          location: summary.location,
          dateInfo: summary.dateInfo,
          date: getActivityEventDate(activity),
        };
      })}
    />
  );
}
