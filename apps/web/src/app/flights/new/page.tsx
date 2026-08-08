import { createFlightAction } from "@/actions/create-flight";
import { FlightForm } from "@/features/flights/flight-form";
import { listTrainingCamps } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

// La liste des sites doit toujours refléter l'état actuel de la base, pas un
// instantané figé au build.
export const dynamic = "force-dynamic";

export default async function NewFlightPage() {
  const user = await requireCurrentUser();
  const [sites, trainingCamps] = await Promise.all([
    prisma.site.findMany({ select: { id: true, name: true } }),
    listTrainingCamps(user.id),
  ]);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nouveau vol</h1>
      <FlightForm sites={sites} trainingCamps={trainingCamps} action={createFlightAction} />
    </div>
  );
}
