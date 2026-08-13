import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Clock3,
  GraduationCap,
  Plane,
  Tag,
  Wind,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ACTIVITY_TYPE_STYLE, getActivityCardType } from "@/components/activity-card";
import { DeleteActivityButton } from "@/components/delete-activity-button";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatFlightLocation, getActivityById } from "@/features/activities";
import { requireCurrentUser } from "@/lib/current-user";
import { formatDate } from "@/lib/format-date";
import { formatDurationMinutes } from "@/lib/format-duration";
import { getLocale } from "@/lib/i18n/get-locale";
import type { Locale } from "@/lib/i18n/locale-cookie";
import { pluralize } from "@/lib/pluralize";
import { cn } from "@/lib/utils";
import { getDictionary, type Messages } from "@/messages";

// Message affiché dans la boîte de confirmation quand le stage supprimé a
// des vols/séances rattachés : trainingCampId est en onDelete: SetNull
// (voir delete-activity.service.ts), ils sont dissociés, pas supprimés.
function trainingCampDeletionWarning(
  activity: {
    trainingCamp: { flights: unknown[]; groundHandlingSessions: unknown[] } | null;
  },
  t: Messages["activities"],
): string | undefined {
  if (!activity.trainingCamp) {
    return undefined;
  }

  const parts: string[] = [];
  const flightCount = activity.trainingCamp.flights.length;
  const sessionCount = activity.trainingCamp.groundHandlingSessions.length;

  if (flightCount > 0) {
    parts.push(pluralize(flightCount, t.flightsCount));
  }
  if (sessionCount > 0) {
    parts.push(pluralize(sessionCount, t.groundHandlingSessionsCount));
  }
  if (parts.length === 0) {
    return undefined;
  }

  const verb = flightCount + sessionCount > 1 ? t.remainPlural : t.remainSingular;
  return `${parts.join(` ${t.and} `)} ${verb} ${t.deletionWarningSuffix}`;
}

export const dynamic = "force-dynamic";

// Extraction directe des composantes UTC, voir activity-summary.ts.
function formatTime(date: Date): string {
  return date.toISOString().slice(11, 16);
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
// École + dates en plus du type : un utilisateur peut avoir plusieurs
// stages du même type (ex. plusieurs "Perfectionnement"), le type seul ne
// suffit pas à distinguer duquel il s'agit.
function TrainingCampBadge({
  trainingCamp,
  locale,
  t,
}: {
  trainingCamp: {
    activityId: string;
    trainingCampType: { code: string };
    school: { name: string };
    startDate: Date;
    endDate: Date;
  };
  locale: Locale;
  t: Messages;
}) {
  const typeLabel =
    t.referenceLabels.trainingCampType[trainingCamp.trainingCampType.code] ??
    trainingCamp.trainingCampType.code;

  return (
    <Link
      href={`/activities/${trainingCamp.activityId}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5"
    >
      <GraduationCap className="size-4 flex-none text-accent" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium text-foreground">
          {t.activities.associatedTrainingCamp(typeLabel)}
        </span>
        <span className="text-sm text-muted-foreground">
          {trainingCamp.school.name} · {formatDate(trainingCamp.startDate, locale)} →{" "}
          {formatDate(trainingCamp.endDate, locale)}
        </span>
      </span>
      <ChevronRight className="size-4 flex-none text-muted-foreground" aria-hidden />
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

  const locale = await getLocale();
  const t = getDictionary(locale);
  const ta = t.activities;

  const type = getActivityCardType(activity);
  const { icon: TypeIcon, className: typeIconClassName } = ACTIVITY_TYPE_STYLE[type];
  const title = activity.flight
    ? ta.titleFlight
    : activity.trainingCamp
      ? ta.titleTrainingCamp
      : ta.titleGroundHandling;
  const entityLabel = activity.flight
    ? ta.entityLabelFlight
    : activity.trainingCamp
      ? ta.entityLabelTrainingCamp
      : ta.entityLabelGroundHandling;

  // Titre/sous-titre du bandeau hero : le nom le plus significatif de
  // l'activité (trajet, école, site) plutôt que de répéter "Vol"/"Stage"/
  // "Gonflage", déjà affiché par PageHeader.
  const heroTitle = activity.flight
    ? formatFlightLocation(activity.flight)
    : (activity.trainingCamp?.school.name ?? activity.groundHandlingSession?.spot.name ?? title);
  const heroSubtitle = activity.flight
    ? `${formatDate(activity.flight.date, locale)} ${t.common.at} ${formatTime(activity.flight.date)}`
    : activity.trainingCamp
      ? `${formatDate(activity.trainingCamp.startDate, locale)} → ${formatDate(activity.trainingCamp.endDate, locale)}`
      : activity.groundHandlingSession
        ? `${formatDate(activity.groundHandlingSession.date, locale)} ${t.common.at} ${formatTime(activity.groundHandlingSession.date)}`
        : "";

  return (
    // Page en flux normal (pas de zone fixe/défilante) : Observations/Bilan
    // doit toujours rester pleinement visible, jamais coupé par un
    // conteneur en overflow-hidden. Le problème de scroll pour un stage
    // avec beaucoup de vols/séances associés est réglé par l'Accordion
    // ci-dessous (replié par défaut), pas par un découpage de la page.
    <div className="flex flex-col gap-6">
      <Link
        href="/activities"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {ta.backToActivities}
      </Link>

      <PageHeader
        title={title}
        actions={
          <div className="flex items-center gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={`/activities/${activity.id}/edit`}>{ta.edit}</Link>}
            />
            <DeleteActivityButton
              activityId={activity.id}
              entityLabel={entityLabel}
              warning={trainingCampDeletionWarning(activity, ta)}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            icon={Clock3}
            label={ta.durationLabel}
            value={formatDurationMinutes(activity.flight.durationMin)}
          />
          <StatCard
            icon={Tag}
            label={ta.flightTypeLabel}
            value={
              t.referenceLabels.flightType[activity.flight.flightType.code] ??
              activity.flight.flightType.code
            }
          />
        </div>
      )}

      {activity.trainingCamp && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            icon={Tag}
            label={ta.trainingCampTypeLabel}
            value={
              t.referenceLabels.trainingCampType[activity.trainingCamp.trainingCampType.code] ??
              activity.trainingCamp.trainingCampType.code
            }
            tone="accent"
          />
          <StatCard
            icon={Clock3}
            label={ta.durationLabel}
            value={ta.daysUnit(
              countStageDays(activity.trainingCamp.startDate, activity.trainingCamp.endDate),
            )}
            tone="accent"
          />
        </div>
      )}

      {activity.groundHandlingSession && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            icon={Clock3}
            label={ta.durationLabel}
            value={formatDurationMinutes(activity.groundHandlingSession.durationMin)}
          />
        </div>
      )}

      {activity.flight && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="size-4 flex-none text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium uppercase text-foreground">
                    {activity.flight.takeoffPoint.spot.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {activity.flight.takeoffPoint.label} · {activity.flight.takeoffPoint.altitudeM}{" "}
                    m
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="size-4 flex-none text-accent" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium uppercase text-foreground">
                    {activity.flight.landingPoint.spot.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {activity.flight.landingPoint.label} · {activity.flight.landingPoint.altitudeM}{" "}
                    m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <NoteSection title={ta.observationsTitle} text={activity.flight.observations} />
              <NoteSection
                title={ta.improvementPointsTitle}
                text={activity.flight.improvementPoints}
              />
            </CardContent>
          </Card>

          {activity.flight.trainingCamp && (
            <TrainingCampBadge trainingCamp={activity.flight.trainingCamp} locale={locale} t={t} />
          )}
        </>
      )}

      {activity.trainingCamp && (
        <>
          {(activity.trainingCamp.observations ||
            activity.trainingCamp.summary ||
            activity.trainingCamp.certification) && (
            <Card>
              <CardContent className="flex flex-col gap-4">
                {activity.trainingCamp.observations && (
                  <NoteSection
                    title={ta.observationsTitle}
                    text={activity.trainingCamp.observations}
                  />
                )}
                {activity.trainingCamp.summary && (
                  <NoteSection title={ta.summaryTitle} text={activity.trainingCamp.summary} />
                )}
                {activity.trainingCamp.certification && (
                  <NoteSection
                    title={ta.certificationTitle}
                    text={activity.trainingCamp.certification}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {(activity.trainingCamp.flights.length > 0 ||
            activity.trainingCamp.groundHandlingSessions.length > 0) && (
            // Repliés par défaut : un stage avec beaucoup de vols/séances
            // n'impose plus une liste entièrement dépliée d'entrée —
            // multiple (pas exclusif) pour pouvoir ouvrir les deux
            // sections en même temps si besoin.
            <Accordion multiple>
              {activity.trainingCamp.flights.length > 0 && (
                <AccordionItem value="flights">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Plane className="size-4 text-primary" aria-hidden />
                      {ta.associatedFlightsHeading(activity.trainingCamp.flights.length)}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="flex flex-col gap-2">
                      {activity.trainingCamp.flights.map((flight) => (
                        <li key={flight.id}>
                          <Link
                            href={`/activities/${flight.activityId}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5"
                          >
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="font-medium text-foreground">
                                {formatFlightLocation(flight)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(flight.date, locale)} {t.common.at}{" "}
                                {formatTime(flight.date)} ·{" "}
                                {formatDurationMinutes(flight.durationMin)}
                              </span>
                            </span>
                            <ChevronRight
                              className="size-4 flex-none text-muted-foreground"
                              aria-hidden
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}

              {activity.trainingCamp.groundHandlingSessions.length > 0 && (
                <AccordionItem value="ground-handling-sessions">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Wind className="size-4 text-muted-foreground" aria-hidden />
                      {ta.associatedSessionsHeading(
                        activity.trainingCamp.groundHandlingSessions.length,
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="flex flex-col gap-2">
                      {activity.trainingCamp.groundHandlingSessions.map((groundHandlingSession) => (
                        <li key={groundHandlingSession.id}>
                          <Link
                            href={`/activities/${groundHandlingSession.activityId}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5"
                          >
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="font-medium text-foreground">
                                {groundHandlingSession.spot.name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(groundHandlingSession.date, locale)} {t.common.at}{" "}
                                {formatTime(groundHandlingSession.date)} ·{" "}
                                {formatDurationMinutes(groundHandlingSession.durationMin)}
                              </span>
                            </span>
                            <ChevronRight
                              className="size-4 flex-none text-muted-foreground"
                              aria-hidden
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </>
      )}

      {activity.groundHandlingSession && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <NoteSection
                title={ta.exercisesTitle}
                text={activity.groundHandlingSession.exercises}
              />
              {activity.groundHandlingSession.difficulties && (
                <NoteSection
                  title={ta.difficultiesTitle}
                  text={activity.groundHandlingSession.difficulties}
                />
              )}
              {activity.groundHandlingSession.feeling && (
                <NoteSection
                  title={ta.feelingTitle}
                  text={activity.groundHandlingSession.feeling}
                />
              )}
            </CardContent>
          </Card>

          {activity.groundHandlingSession.trainingCamp && (
            <TrainingCampBadge
              trainingCamp={activity.groundHandlingSession.trainingCamp}
              locale={locale}
              t={t}
            />
          )}
        </>
      )}
    </div>
  );
}
