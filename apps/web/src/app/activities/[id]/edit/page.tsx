import { notFound } from "next/navigation";
import { updateFlightAction } from "@/actions/update-flight";
import { updateGroundHandlingSessionAction } from "@/actions/update-ground-handling-session";
import { updateTrainingCampAction } from "@/actions/update-training-camp";
import { getActivityById } from "@/features/activities";
import { FlightForm } from "@/features/flights/flight-form";
import { GroundHandlingSessionForm } from "@/features/ground-handling-sessions/ground-handling-session-form";
import { listTrainingCamps } from "@/features/training-camps";
import { TrainingCampForm } from "@/features/training-camps/training-camp-form";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

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

  if (activity.flight) {
    const [sites, trainingCamps] = await Promise.all([
      prisma.site.findMany({ select: { id: true, name: true } }),
      listTrainingCamps(user.id),
    ]);

    return (
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Modifier le vol</h1>
        <FlightForm
          sites={sites}
          trainingCamps={trainingCamps}
          action={updateFlightAction.bind(null, activity.id)}
          defaultValues={{
            date: activity.flight.date,
            siteId: activity.flight.siteId,
            trainingCampId: activity.flight.trainingCampId ?? undefined,
            takeoffAltitudeM: activity.flight.takeoffAltitudeM,
            landingAltitudeM: activity.flight.landingAltitudeM,
            durationMin: activity.flight.durationMin,
            flightType: activity.flight.flightType,
            observations: activity.flight.observations,
            improvementPoints: activity.flight.improvementPoints,
          }}
          submitLabel="Modifier le vol"
        />
      </div>
    );
  }

  if (activity.trainingCamp) {
    const schools = await prisma.school.findMany({ select: { id: true, name: true } });

    return (
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Modifier le stage</h1>
        <TrainingCampForm
          schools={schools}
          action={updateTrainingCampAction.bind(null, activity.id)}
          defaultValues={{
            startDate: activity.trainingCamp.startDate,
            endDate: activity.trainingCamp.endDate,
            schoolId: activity.trainingCamp.schoolId,
            campType: activity.trainingCamp.campType,
            summary: activity.trainingCamp.summary ?? undefined,
            certification: activity.trainingCamp.certification ?? undefined,
          }}
          submitLabel="Modifier le stage"
        />
      </div>
    );
  }

  if (activity.groundHandlingSession) {
    const [sites, trainingCamps] = await Promise.all([
      prisma.site.findMany({ select: { id: true, name: true } }),
      listTrainingCamps(user.id),
    ]);

    return (
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Modifier la séance
        </h1>
        <GroundHandlingSessionForm
          sites={sites}
          trainingCamps={trainingCamps}
          action={updateGroundHandlingSessionAction.bind(null, activity.id)}
          defaultValues={{
            date: activity.groundHandlingSession.date,
            siteId: activity.groundHandlingSession.siteId,
            trainingCampId: activity.groundHandlingSession.trainingCampId ?? undefined,
            durationMin: activity.groundHandlingSession.durationMin,
            exercises: activity.groundHandlingSession.exercises,
            difficulties: activity.groundHandlingSession.difficulties ?? undefined,
            feeling: activity.groundHandlingSession.feeling ?? undefined,
          }}
          submitLabel="Modifier la séance"
        />
      </div>
    );
  }

  notFound();
}
