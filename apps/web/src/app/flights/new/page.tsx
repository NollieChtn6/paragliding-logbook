import { prisma } from "@/lib/prisma";
import { NewFlightForm } from "./new-flight-form";

// La liste des sites doit toujours refléter l'état actuel de la base, pas un
// instantané figé au build.
export const dynamic = "force-dynamic";

export default async function NewFlightPage() {
  const sites = await prisma.site.findMany({ select: { id: true, name: true } });

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nouveau vol</h1>
      <NewFlightForm sites={sites} />
    </div>
  );
}
