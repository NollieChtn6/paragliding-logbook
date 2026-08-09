import { createFlightAction } from "@/actions/create-flight";
import { PageHeader } from "@/components/layout/page-header";
import { FlightForm } from "@/features/flights/flight-form";
import { listTrainingCamps } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

// Les stages proposés doivent toujours refléter l'état actuel de la base,
// pas un instantané figé au build.
export const dynamic = "force-dynamic";

export default async function NewFlightPage() {
  const user = await requireCurrentUser();
  const [flightTypes, trainingCamps] = await Promise.all([
    prisma.flightType.findMany({ select: { id: true, code: true } }),
    listTrainingCamps(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nouveau vol" />
      <FlightForm
        flightTypes={flightTypes}
        trainingCamps={trainingCamps}
        action={createFlightAction}
      />
    </div>
  );
}
