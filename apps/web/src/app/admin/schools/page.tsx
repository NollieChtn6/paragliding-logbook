import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { deleteSchoolAction } from "@/actions/delete-school";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSchools } from "@/features/schools";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

export const dynamic = "force-dynamic";

export default async function AdminSchoolsPage(props: PageProps<"/admin/schools">) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const schools = await listSchools(query);
  const t = getDictionary(await getLocale());
  const ts = t.schools;

  function formatLocation(school: { city: string | null; countryCode: string | null }): string {
    if (school.city && school.countryCode) return `${school.city} · ${school.countryCode}`;
    return school.city ?? school.countryCode ?? ts.noLocation;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ts.pageTitle}
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/schools/new">
                <Plus className="size-4" aria-hidden />
                {ts.newSchool}
              </Link>
            }
          />
        }
      />

      <form className="flex gap-2">
        <Input name="q" defaultValue={query} placeholder={ts.searchPlaceholder} />
        <Button type="submit" variant="outline">
          {t.common.search}
        </Button>
      </form>

      {schools.length === 0 ? (
        <EmptyState
          title={query ? ts.emptyFilteredTitle : ts.emptyNoneTitle}
          description={query ? ts.emptyFilteredDescription : ts.emptyNoneDescription}
          action={
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/admin/schools/new">{ts.createSchoolButton}</Link>}
            />
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ts.colName}</TableHead>
                <TableHead>{ts.colLocation}</TableHead>
                <TableHead className="text-right">{ts.colActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell>
                    <Link
                      href={`/admin/schools/${school.id}/edit`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {school.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatLocation(school)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        nativeButton={false}
                        variant="ghost"
                        size="icon-sm"
                        aria-label={ts.modifyAriaLabel(school.name)}
                        title={ts.modifyAriaLabel(school.name)}
                        render={
                          <Link href={`/admin/schools/${school.id}/edit`}>
                            <Pencil className="size-4" aria-hidden />
                          </Link>
                        }
                      />
                      <AdminDeleteButton
                        action={deleteSchoolAction.bind(null, school.id)}
                        entityLabel={ts.entityLabel(school.name)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
