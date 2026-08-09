import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Clock3, Tag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ACTIVITY_TYPE_STYLE, getActivityCardType } from "@/components/activity-card";
import { DeleteActivityButton } from "@/components/delete-activity-button";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatFlightLocation, getActivityById } from "@/features/activities";
import { requireCurrentUser } from "@/lib/current-user";
import { FLIGHT_TYPE_LABELS, TRAINING_CAMP_TYPE_LABELS } from "@/lib/reference-labels";
import { cn } from "@/lib/utils";

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

function formatTrainingCampType(trainingCampType: { code: string }): string {
  return TRAINING_CAMP_TYPE_LABELS[trainingCampType.code] ?? trainingCampType.code;
}

// Nombre de jours inclusif entre le début et la fin d'un stage (ex. 1 → 5
// juillet = 5 jours) : lecture plus parlante que deux dates séparées dans
// la ligne de statistiques.
function countStageDays(startDate: Date, endDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
}

// Petit badge cliquable vers le stage associé (Vol/Gonflage) : même
// composant pour les deux, activityId du TrainingCamp toujours déjà chargé
// (scalaire, ACTIVITY_WITH_DETAILS_INCLUDE), pas de requête supplémentaire.
function TrainingCampBadge({
  trainingCamp,
}: {
  trainingCamp: { activityId: string; trainingCampType: { code: string } };
}) {
  return (
    <Link
      href={`/activities/${trainingCamp.activityId}`}
      className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground shadow-sm transition-colors hover:bg-accent/5"
    >
      Stage associé : {formatTrainingCampType(trainingCamp.trainingCampType)}
    </Link>
  );
}

function NoteSection({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-medium tracking-tight text-foreground">{title}</h2>
      <p className="text-sm leading-6 text-foreground">{text}</p>
    </div>
  );
}

export default async function ActivityDetailPage(props: PageProps<"/activities/[id]">) {
  const { id } = await props.params;
  const user = await requireCurrentUser();
  const activity = await getActivityById(id, user.id);

  if (!activity) {
    notFound();
  }

  const type = getActivityCardType(activity);
  const { icon: TypeIcon, className: typeIconClassName } = ACTIVITY_TYPE_STYLE[type];
  const title = activity.flight ? "Vol" : activity.trainingCamp ? "Stage" : "Gonflage";
  const entityLabel = activity.flight
    ? "ce vol"
    : activity.trainingCamp
      ? "ce stage"
      : "cette séance";

  // Titre/sous-titre du bandeau hero : le nom le plus significatif de
  // l'activité (trajet, école, site) plutôt que de répéter "Vol"/"Stage"/
  // "Gonflage", déjà affiché par PageHeader.
  const heroTitle = activity.flight
    ? formatFlightLocation(activity.flight)
    : (activity.trainingCamp?.school.name ?? activity.groundHandlingSession?.site.name ?? title);
  const heroSubtitle = activity.flight
    ? formatDate(activity.flight.date)
    : activity.trainingCamp
      ? `${formatDate(activity.trainingCamp.startDate)} → ${formatDate(activity.trainingCamp.endDate)}`
      : activity.groundHandlingSession
        ? formatDate(activity.groundHandlingSession.date)
        : "";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/activities"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour aux activités
      </Link>

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

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-12 flex-none items-center justify-center rounded-2xl",
            typeIconClassName,
          )}
          aria-hidden
        >
          <TypeIcon className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold tracking-tight text-foreground">
            {heroTitle}
          </p>
          <p className="text-sm text-muted-foreground">{heroSubtitle}</p>
        </div>
      </div>

      {activity.flight && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard icon={Clock3} label="Durée" value={`${activity.flight.durationMin} min`} />
            <StatCard
              icon={Tag}
              label="Type de vol"
              value={
                FLIGHT_TYPE_LABELS[activity.flight.flightType.code] ??
                activity.flight.flightType.code
              }
            />
          </div>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="size-4 flex-none text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {activity.flight.takeoffPoint.label}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {activity.flight.takeoffPoint.site.name} ·{" "}
                    {activity.flight.takeoffPoint.altitudeM} m
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="size-4 flex-none text-accent" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {activity.flight.landingPoint.label}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {activity.flight.landingPoint.site.name} ·{" "}
                    {activity.flight.landingPoint.altitudeM} m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <NoteSection title="Observations" text={activity.flight.observations} />
              <NoteSection title="Points d'amélioration" text={activity.flight.improvementPoints} />
            </CardContent>
          </Card>

          {activity.flight.trainingCamp && (
            <TrainingCampBadge trainingCamp={activity.flight.trainingCamp} />
          )}
        </>
      )}

      {activity.trainingCamp && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              icon={Tag}
              label="Type de stage"
              value={formatTrainingCampType(activity.trainingCamp.trainingCampType)}
              tone="accent"
            />
            <StatCard
              icon={Clock3}
              label="Durée"
              value={`${countStageDays(activity.trainingCamp.startDate, activity.trainingCamp.endDate)} j`}
              tone="accent"
            />
          </div>

          {(activity.trainingCamp.summary || activity.trainingCamp.certification) && (
            <Card>
              <CardContent className="flex flex-col gap-4">
                {activity.trainingCamp.summary && (
                  <NoteSection title="Bilan" text={activity.trainingCamp.summary} />
                )}
                {activity.trainingCamp.certification && (
                  <NoteSection title="Certification" text={activity.trainingCamp.certification} />
                )}
              </CardContent>
            </Card>
          )}

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
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              icon={Clock3}
              label="Durée"
              value={`${activity.groundHandlingSession.durationMin} min`}
            />
          </div>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <NoteSection
                title="Exercices travaillés"
                text={activity.groundHandlingSession.exercises}
              />
              {activity.groundHandlingSession.difficulties && (
                <NoteSection
                  title="Difficultés rencontrées"
                  text={activity.groundHandlingSession.difficulties}
                />
              )}
              {activity.groundHandlingSession.feeling && (
                <NoteSection title="Ressenti" text={activity.groundHandlingSession.feeling} />
              )}
            </CardContent>
          </Card>

          {activity.groundHandlingSession.trainingCamp && (
            <TrainingCampBadge trainingCamp={activity.groundHandlingSession.trainingCamp} />
          )}
        </>
      )}
    </div>
  );
}
