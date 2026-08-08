import { prisma } from "@/lib/prisma";
import { NewActivityForm } from "./new-activity-form";

// La liste des types d'activité, sites et écoles doit toujours refléter
// l'état actuel de la base, pas un instantané figé au build.
export const dynamic = "force-dynamic";

export default async function NewActivityPage() {
  const [activityTypes, sites, schools] = await Promise.all([
    prisma.activityType.findMany({ select: { code: true, label: true } }),
    prisma.site.findMany({ select: { id: true, name: true } }),
    prisma.school.findMany({ select: { id: true, name: true } }),
  ]);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nouvelle activité</h1>
      <NewActivityForm activityTypes={activityTypes} sites={sites} schools={schools} />
    </div>
  );
}
