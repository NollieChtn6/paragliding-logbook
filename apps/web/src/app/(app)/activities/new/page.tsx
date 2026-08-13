import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { listTrainingCamps } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { NewActivityForm } from "./new-activity-form";

// La liste des types d'activité, sites et écoles doit toujours refléter
// l'état actuel de la base, pas un instantané figé au build.
export const dynamic = "force-dynamic";

export default async function NewActivityPage() {
  const user = await requireCurrentUser();
  const [activityTypes, flightTypes, trainingCampTypes, schools, trainingCamps] = await Promise.all(
    [
      prisma.activityType.findMany({ select: { code: true } }),
      prisma.flightType.findMany({ select: { id: true, code: true } }),
      prisma.trainingCampType.findMany({ select: { id: true, code: true } }),
      prisma.school.findMany({ select: { id: true, name: true } }),
      listTrainingCamps(user.id),
    ],
  );

  const t = getDictionary(await getLocale());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.activities.newActivity} actions={<LeaveFormButton />} />
      <NewActivityForm
        activityTypes={activityTypes}
        flightTypes={flightTypes}
        trainingCampTypes={trainingCampTypes}
        schools={schools}
        trainingCamps={trainingCamps}
      />
    </div>
  );
}
