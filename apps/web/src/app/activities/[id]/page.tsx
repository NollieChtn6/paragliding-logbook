import { notFound } from "next/navigation";
import { getActivityById } from "@/features/activities";
import { requireCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR");
}

export default async function ActivityDetailPage(props: PageProps<"/activities/[id]">) {
  const { id } = await props.params;
  const user = await requireCurrentUser();
  const activity = await getActivityById(id, user.id);

  if (!activity) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8">
      {activity.flight && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Vol</h1>
          <dl className="flex flex-col gap-3">
            <Field label="Date" value={formatDate(activity.flight.date)} />
            <Field label="Site" value={activity.flight.site.name} />
            <Field label="Altitude décollage" value={`${activity.flight.takeoffAltitudeM} m`} />
            <Field label="Altitude atterrissage" value={`${activity.flight.landingAltitudeM} m`} />
            <Field label="Durée" value={`${activity.flight.durationMin} min`} />
            <Field label="Type de vol" value={activity.flight.flightType} />
            <Field label="Observations" value={activity.flight.observations} />
            <Field label="Points d'amélioration" value={activity.flight.improvementPoints} />
            {activity.flight.trainingCamp && (
              <Field label="Stage associé" value={activity.flight.trainingCamp.campType} />
            )}
          </dl>
        </>
      )}

      {activity.trainingCamp && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stage</h1>
          <dl className="flex flex-col gap-3">
            <Field label="École" value={activity.trainingCamp.school.name} />
            <Field label="Type" value={activity.trainingCamp.campType} />
            <Field label="Début" value={formatDate(activity.trainingCamp.startDate)} />
            <Field label="Fin" value={formatDate(activity.trainingCamp.endDate)} />
            {activity.trainingCamp.summary && (
              <Field label="Bilan" value={activity.trainingCamp.summary} />
            )}
            {activity.trainingCamp.certification && (
              <Field label="Certification" value={activity.trainingCamp.certification} />
            )}
          </dl>

          {activity.trainingCamp.flights.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Vols associés
              </h2>
              <ul className="flex flex-col gap-2">
                {activity.trainingCamp.flights.map((flight) => (
                  <li
                    key={flight.id}
                    className="flex flex-col gap-0.5 rounded-lg border border-input px-3 py-2"
                  >
                    <span className="font-medium text-foreground">{flight.site.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(flight.date)} · {flight.durationMin} min
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {activity.groundHandlingSession && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Gonflage</h1>
          <dl className="flex flex-col gap-3">
            <Field label="Date" value={formatDate(activity.groundHandlingSession.date)} />
            <Field label="Site" value={activity.groundHandlingSession.site.name} />
            <Field label="Durée" value={`${activity.groundHandlingSession.durationMin} min`} />
            <Field label="Exercices" value={activity.groundHandlingSession.exercises} />
            {activity.groundHandlingSession.difficulties && (
              <Field label="Difficultés" value={activity.groundHandlingSession.difficulties} />
            )}
            {activity.groundHandlingSession.feeling && (
              <Field label="Ressenti" value={activity.groundHandlingSession.feeling} />
            )}
          </dl>
        </>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
