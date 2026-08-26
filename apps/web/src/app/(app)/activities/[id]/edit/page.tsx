import { notFound } from "next/navigation";
import { updateFlightAction } from "@/actions/update-flight";
import { updateGroundHandlingSessionAction } from "@/actions/update-ground-handling-session";
import { updateTrainingCampAction } from "@/actions/update-training-camp";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { getActivityById } from "@/features/activities";
import { listEquipment, selectEquipmentOptions } from "@/features/equipment";
import { FlightForm } from "@/features/flights/flight-form";
import { GroundHandlingSessionForm } from "@/features/ground-handling-sessions/ground-handling-session-form";
import { listTrainingCamps } from "@/features/training-camps";
import { TrainingCampForm } from "@/features/training-camps/training-camp-form";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";

// La liste des sites/écoles/stages doit toujours refléter l'état actuel de
// la base, pas un instantané figé au build.
export const dynamic = "force-dynamic";

// Type déterminé automatiquement à partir de la présence de
// activity.flight/.trainingCamp/.groundHandlingSession (même pattern que
// /activities/[id]/page.tsx) : une seule route pour les trois types, pas de
// duplication de formulaire (réutilise FlightForm/TrainingCampForm/
// GroundHandlingSessionForm avec action + defaultValues, cf. flight-form.tsx).
export default async function EditActivityPage(props: PageProps<"/activities/[id]/edit">) {
  const { id } = await props.params;
  const user = await requireCurrentUser();
  const activity = await getActivityById(id, user.id);

  if (!activity) {
    notFound();
  }

  const t = getDictionary(await getLocale());

  if (activity.flight) {
    const [flightTypes, trainingCamps, equipment] = await Promise.all([
      prisma.flightType.findMany({ select: { id: true, code: true } }),
      listTrainingCamps(user.id),
      listEquipment(user.id),
    ]);

    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t.flights.editFlight}
          actions={
            <LeaveFormButton
              href={`/activities/${activity.id}`}
              title={t.common.discardChangesTitle}
              description={t.common.discardChangesDescription}
            />
          }
        />
        <FlightForm
          flightTypes={flightTypes}
          trainingCamps={trainingCamps}
          wings={selectEquipmentOptions(equipment, "WING", activity.flight.wingId ?? undefined)}
          harnesses={selectEquipmentOptions(
            equipment,
            "HARNESS",
            activity.flight.harnessId ?? undefined,
          )}
          reserves={selectEquipmentOptions(
            equipment,
            "RESERVE",
            activity.flight.reserveId ?? undefined,
          )}
          action={updateFlightAction.bind(null, activity.id)}
          defaultTakeoffPoint={activity.flight.takeoffPoint}
          defaultLandingPoint={activity.flight.landingPoint}
          defaultValues={{
            date: activity.flight.date,
            trainingCampId: activity.flight.trainingCampId ?? undefined,
            durationMin: activity.flight.durationMin,
            flightTypeId: activity.flight.flightTypeId,
            wingId: activity.flight.wingId ?? undefined,
            harnessId: activity.flight.harnessId ?? undefined,
            reserveId: activity.flight.reserveId ?? undefined,
            observations: activity.flight.observations,
            improvementPoints: activity.flight.improvementPoints,
          }}
          submitLabel={t.flights.editFlight}
        />
      </div>
    );
  }

  if (activity.trainingCamp) {
    const [schools, trainingCampTypes, qualificationTypes] = await Promise.all([
      prisma.school.findMany({ select: { id: true, name: true } }),
      prisma.trainingCampType.findMany({ select: { id: true, code: true } }),
      prisma.qualificationType.findMany({ select: { id: true, code: true } }),
    ]);

    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t.trainingCamps.editCamp}
          actions={
            <LeaveFormButton
              href={`/activities/${activity.id}`}
              title={t.common.discardChangesTitle}
              description={t.common.discardChangesDescription}
            />
          }
        />
        <TrainingCampForm
          schools={schools}
          trainingCampTypes={trainingCampTypes}
          qualificationTypes={qualificationTypes}
          action={updateTrainingCampAction.bind(null, activity.id)}
          defaultValues={{
            startDate: activity.trainingCamp.startDate,
            endDate: activity.trainingCamp.endDate,
            schoolId: activity.trainingCamp.schoolId,
            trainingCampTypeId: activity.trainingCamp.trainingCampTypeId,
            qualificationTypeId: activity.trainingCamp.qualificationTypeId ?? undefined,
            observations: activity.trainingCamp.observations ?? undefined,
            summary: activity.trainingCamp.summary ?? undefined,
          }}
          submitLabel={t.trainingCamps.editCamp}
        />
      </div>
    );
  }

  if (activity.groundHandlingSession) {
    const [trainingCamps, equipment] = await Promise.all([
      listTrainingCamps(user.id),
      listEquipment(user.id),
    ]);

    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t.groundHandlingSessions.editSession}
          actions={
            <LeaveFormButton
              href={`/activities/${activity.id}`}
              title={t.common.discardChangesTitle}
              description={t.common.discardChangesDescription}
            />
          }
        />
        <GroundHandlingSessionForm
          trainingCamps={trainingCamps}
          wings={selectEquipmentOptions(
            equipment,
            "WING",
            activity.groundHandlingSession.wingId ?? undefined,
          )}
          harnesses={selectEquipmentOptions(
            equipment,
            "HARNESS",
            activity.groundHandlingSession.harnessId ?? undefined,
          )}
          defaultSpot={activity.groundHandlingSession.spot}
          action={updateGroundHandlingSessionAction.bind(null, activity.id)}
          defaultValues={{
            date: activity.groundHandlingSession.date,
            trainingCampId: activity.groundHandlingSession.trainingCampId ?? undefined,
            durationMin: activity.groundHandlingSession.durationMin,
            wingId: activity.groundHandlingSession.wingId ?? undefined,
            harnessId: activity.groundHandlingSession.harnessId ?? undefined,
            exercises: activity.groundHandlingSession.exercises,
            difficulties: activity.groundHandlingSession.difficulties ?? undefined,
            feeling: activity.groundHandlingSession.feeling ?? undefined,
          }}
          submitLabel={t.groundHandlingSessions.editSession}
        />
      </div>
    );
  }

  notFound();
}
