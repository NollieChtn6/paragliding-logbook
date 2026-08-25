import { createQualificationAction } from "@/actions/create-qualification";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { QualificationForm } from "@/features/qualifications/qualification-form";
import { listTrainingCamps } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";
import { formatDate } from "@/lib/format-date";
import { getLocale } from "@/lib/i18n/get-locale";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";

// La liste des types de brevet, écoles et stages doit toujours refléter
// l'état actuel de la base, pas un instantané figé au build.
export const dynamic = "force-dynamic";

export default async function NewQualificationPage() {
  const user = await requireCurrentUser();
  const locale = await getLocale();
  const t = getDictionary(locale);

  const [qualificationTypes, schools, trainingCamps] = await Promise.all([
    prisma.qualificationType.findMany({ select: { id: true, code: true } }),
    prisma.school.findMany({ select: { id: true, name: true } }),
    listTrainingCamps(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t.qualifications.newQualification}
        actions={<LeaveFormButton href="/qualifications" />}
      />
      <QualificationForm
        qualificationTypes={qualificationTypes}
        schools={schools}
        trainingCamps={trainingCamps.map((trainingCamp) => ({
          id: trainingCamp.id,
          // Même format que formatTrainingCampOption (features/flights/flight-form.tsx).
          label: `${t.referenceLabels.trainingCampType[trainingCamp.trainingCampType.code] ?? trainingCamp.trainingCampType.code} — ${trainingCamp.school.name} (${formatDate(trainingCamp.startDate, locale)} → ${formatDate(trainingCamp.endDate, locale)})`,
        }))}
        action={createQualificationAction}
        submitLabel={t.qualifications.createQualification}
      />
    </div>
  );
}
