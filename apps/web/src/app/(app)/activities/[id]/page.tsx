import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteActivityButton } from "@/components/delete-activity-button";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { formatFlightLocation, getActivityById } from "@/features/activities";
import { requireCurrentUser } from "@/lib/current-user";
import { FLIGHT_TYPE_LABELS } from "@/lib/reference-labels";

// Message affiché dans la boîte de confirmation quand le stage supprimé a
// des vols/séances rattachés : trainingCampId est en onDelete: SetNull
// (voir delete-activity.service.ts), ils sont dissociés, pas supprimés.
function trainingCampDeletionWarning(activity: {
  trainingCamp: { flights: unknown[]; groundHandlingSessions: unknown[] } | null;
}): string | undefined {
  if (!activity.trainingCamp) {
    return undefined;
  }

  const parts: string[] = [];
  const flightCount = activity.trainingCamp.flights.length;
  const sessionCount = activity.trainingCamp.groundHandlingSessions.length;

  if (flightCount > 0) {
    parts.push(`${flightCount} vol${flightCount > 1 ? "s" : ""}`);
  }
  if (sessionCount > 0) {
    parts.push(`${sessionCount} séance${sessionCount > 1 ? "s" : ""} de gonflage`);
  }
  if (parts.length === 0) {
    return undefined;
  }

  const verb = flightCount + sessionCount > 1 ? "resteront" : "restera";
  return `${parts.join(" et ")} ${verb} dans votre carnet mais ne seront plus rattachés à ce stage.`;
}

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR");
}

function formatSitePoint(point: {
  label: string;
  altitudeM: number;
  site: { name: string };
}): string {
  return `${point.site.name} — ${point.label} (${point.altitudeM} m)`;
}

export default async function ActivityDetailPage(props: PageProps<"/activities/[id]">) {
  const { id } = await props.params;
  const user = await requireCurrentUser();
  const activity = await getActivityById(id, user.id);

  if (!activity) {
    notFound();
  }

  const title = activity.flight ? "Vol" : activity.trainingCamp ? "Stage" : "Gonflage";
  const entityLabel = activity.flight
    ? "ce vol"
    : activity.trainingCamp
      ? "ce stage"
      : "cette séance";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        actions={
          <div className="flex items-center gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={`/activities/${activity.id}/edit`}>Modifier</Link>}
            />
            <DeleteActivityButton
              activityId={activity.id}
              entityLabel={entityLabel}
              warning={trainingCampDeletionWarning(activity)}
            />
          </div>
        }
      />

      {activity.flight && (
        <dl className="flex flex-col gap-3">
          <Field label="Date" value={formatDate(activity.flight.date)} />
          <Field label="Décollage" value={formatSitePoint(activity.flight.takeoffPoint)} />
          <Field label="Atterrissage" value={formatSitePoint(activity.flight.landingPoint)} />
          <Field label="Durée" value={`${activity.flight.durationMin} min`} />
          <Field
            label="Type de vol"
            value={
              FLIGHT_TYPE_LABELS[activity.flight.flightType.code] ?? activity.flight.flightType.code
            }
          />
          <Field label="Observations" value={activity.flight.observations} />
          <Field label="Points d'amélioration" value={activity.flight.improvementPoints} />
          {activity.flight.trainingCamp && (
            <Field label="Stage associé" value={activity.flight.trainingCamp.campType} />
          )}
        </dl>
      )}

      {activity.trainingCamp && (
        <>
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
              <h2 className="text-lg font-medium tracking-tight text-foreground">Vols associés</h2>
              <ul className="flex flex-col gap-2">
                {activity.trainingCamp.flights.map((flight) => (
                  <li
                    key={flight.id}
                    className="flex flex-col gap-0.5 rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <span className="font-medium text-foreground">
                      {formatFlightLocation(flight)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(flight.date)} · {flight.durationMin} min
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activity.trainingCamp.groundHandlingSessions.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-medium tracking-tight text-foreground">
                Séances associées
              </h2>
              <ul className="flex flex-col gap-2">
                {activity.trainingCamp.groundHandlingSessions.map((groundHandlingSession) => (
                  <li
                    key={groundHandlingSession.id}
                    className="flex flex-col gap-0.5 rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <span className="font-medium text-foreground">
                      {groundHandlingSession.site.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(groundHandlingSession.date)} · {groundHandlingSession.durationMin}{" "}
                      min
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {activity.groundHandlingSession && (
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
          {activity.groundHandlingSession.trainingCamp && (
            <Field
              label="Stage associé"
              value={activity.groundHandlingSession.trainingCamp.campType}
            />
          )}
        </dl>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}
