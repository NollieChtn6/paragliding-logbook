import { Plus } from "lucide-react";
import Link from "next/link";
import { deleteQualificationAction } from "@/actions/delete-qualification";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listQualifications } from "@/features/qualifications";
import { QualificationCard } from "@/features/qualifications/qualification-card";
import { requireCurrentUser } from "@/lib/current-user";
import { formatDate } from "@/lib/format-date";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

// La liste doit toujours refléter l'état actuel de la base, pas un
// instantané figé au build (même principe que /activities, /progression).
export const dynamic = "force-dynamic";

export default async function QualificationsPage() {
  const user = await requireCurrentUser();
  const qualifications = await listQualifications(user.id);
  const locale = await getLocale();
  const t = getDictionary(locale);
  const tq = t.qualifications;

  function formatQualificationType(qualificationType: { code: string }): string {
    return t.referenceLabels.qualificationType[qualificationType.code] ?? qualificationType.code;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tq.pageTitle}
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/qualifications/new">
                <Plus className="size-4" aria-hidden />
                {tq.newQualification}
              </Link>
            }
          />
        }
      />

      {qualifications.length === 0 ? (
        <EmptyState
          title={tq.emptyTitle}
          description={tq.emptyDescription}
          action={
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/qualifications/new">{tq.newQualification}</Link>}
            />
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {qualifications.map((qualification) => {
            const typeLabel = formatQualificationType(qualification.qualificationType);
            return (
              <QualificationCard
                key={qualification.id}
                href={`/qualifications/${qualification.id}/edit`}
                typeLabel={typeLabel}
                school={qualification.school?.name ?? null}
                obtainedDateLabel={formatDate(qualification.obtainedDate, locale)}
                deleteAction={deleteQualificationAction.bind(null, qualification.id)}
                deleteEntityLabel={tq.entityLabel(typeLabel)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
