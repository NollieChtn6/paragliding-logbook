import { PageHeader } from "@/components/layout/page-header";
import { listTrainingCamps } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { NewActivityForm } from "./new-activity-form";

// La liste des types d'activité, sites et écoles doit toujours refléter
// l'état actuel de la base, pas un instantané figé au build.
export const dynamic = "force-dynamic";

export default async function NewActivityPage() {
  const user = await requireCurrentUser();
  const [activityTypes, sites, points, flightTypes, schools, trainingCamps] = await Promise.all([
    prisma.activityType.findMany({ select: { code: true } }),
    prisma.site.findMany({ select: { id: true, name: true } }),
    prisma.sitePoint.findMany({
      select: {
        id: true,
        label: true,
        altitudeM: true,
        site: { select: { id: true, name: true } },
        sitePointType: { select: { code: true } },
      },
    }),
    prisma.flightType.findMany({ select: { id: true, code: true } }),
    prisma.school.findMany({ select: { id: true, name: true } }),
    listTrainingCamps(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nouvelle activité" />
      <NewActivityForm
        activityTypes={activityTypes}
        sites={sites}
        points={points}
        flightTypes={flightTypes}
        schools={schools}
        trainingCamps={trainingCamps}
      />
    </div>
  );
}
