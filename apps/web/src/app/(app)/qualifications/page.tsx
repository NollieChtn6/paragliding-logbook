import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { deleteQualificationAction } from "@/actions/delete-qualification";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listQualifications } from "@/features/qualifications";
import { QualificationDeleteButton } from "@/features/qualifications/qualification-delete-button";
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
              render={<Link href="/qualifications/new">{tq.addQualificationButton}</Link>}
            />
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tq.colType}</TableHead>
                <TableHead>{tq.colObtainedDate}</TableHead>
                <TableHead>{tq.colSchool}</TableHead>
                <TableHead className="text-right">{tq.colActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qualifications.map((qualification) => {
                const typeLabel = formatQualificationType(qualification.qualificationType);
                return (
                  <TableRow key={qualification.id}>
                    <TableCell>
                      <Link
                        href={`/qualifications/${qualification.id}/edit`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {typeLabel}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(qualification.obtainedDate, locale)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {qualification.school?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          nativeButton={false}
                          variant="ghost"
                          size="icon-sm"
                          aria-label={tq.editQualification}
                          title={tq.editQualification}
                          render={
                            <Link href={`/qualifications/${qualification.id}/edit`}>
                              <Pencil className="size-4" aria-hidden />
                            </Link>
                          }
                        />
                        <QualificationDeleteButton
                          action={deleteQualificationAction.bind(null, qualification.id)}
                          entityLabel={tq.entityLabel(typeLabel)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
