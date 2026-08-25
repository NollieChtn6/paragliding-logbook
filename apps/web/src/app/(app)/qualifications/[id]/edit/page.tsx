import { notFound } from "next/navigation";
import { deleteQualificationAction } from "@/actions/delete-qualification";
import { updateQualificationAction } from "@/actions/update-qualification";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { getQualification } from "@/features/qualifications";
import { QualificationDeleteButton } from "@/features/qualifications/qualification-delete-button";
import { QualificationForm } from "@/features/qualifications/qualification-form";
import { listTrainingCamps } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";
import { formatDate } from "@/lib/format-date";
import { getLocale } from "@/lib/i18n/get-locale";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";

export const dynamic = "force-dynamic";

export default async function EditQualificationPage(props: PageProps<"/qualifications/[id]/edit">) {
  const { id } = await props.params;
  const user = await requireCurrentUser();
  const qualification = await getQualification(user.id, id);

  if (!qualification) {
    notFound();
  }

  const locale = await getLocale();
  const t = getDictionary(locale);
  const tq = t.qualifications;

  const [qualificationTypes, schools, trainingCamps] = await Promise.all([
    prisma.qualificationType.findMany({ select: { id: true, code: true } }),
    prisma.school.findMany({ select: { id: true, name: true } }),
    listTrainingCamps(user.id),
  ]);

  const typeLabel =
    t.referenceLabels.qualificationType[
      qualificationTypes.find((qt) => qt.id === qualification.qualificationTypeId)?.code ?? ""
    ] ?? "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tq.editQualification}
        actions={
          <>
            <LeaveFormButton
              href="/qualifications"
              title={t.common.discardChangesTitle}
              description={t.common.discardChangesDescription}
            />
            <QualificationDeleteButton
              action={deleteQualificationAction.bind(null, qualification.id)}
              entityLabel={tq.entityLabel(typeLabel)}
            />
          </>
        }
      />

      <QualificationForm
        qualificationTypes={qualificationTypes}
        schools={schools}
        trainingCamps={trainingCamps.map((trainingCamp) => ({
          id: trainingCamp.id,
          label: `${t.referenceLabels.trainingCampType[trainingCamp.trainingCampType.code] ?? trainingCamp.trainingCampType.code} — ${trainingCamp.school.name} (${formatDate(trainingCamp.startDate, locale)} → ${formatDate(trainingCamp.endDate, locale)})`,
        }))}
        action={updateQualificationAction.bind(null, qualification.id)}
        submitLabel={tq.editQualification}
        defaultValues={{
          qualificationTypeId: qualification.qualificationTypeId,
          obtainedDate: qualification.obtainedDate,
          schoolId: qualification.schoolId ?? undefined,
          trainingCampId: qualification.trainingCampId ?? undefined,
          notes: qualification.notes ?? undefined,
        }}
      />
    </div>
  );
}
