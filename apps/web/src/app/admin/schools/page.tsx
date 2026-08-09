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

export const dynamic = "force-dynamic";

function formatLocation(school: { city: string | null; countryCode: string | null }): string {
  if (school.city && school.countryCode) return `${school.city} · ${school.countryCode}`;
  return school.city ?? school.countryCode ?? "—";
}

export default async function AdminSchoolsPage(props: PageProps<"/admin/schools">) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const schools = await listSchools(query);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Écoles"
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/schools/new">
                <Plus className="size-4" aria-hidden />
                Nouvelle école
              </Link>
            }
          />
        }
      />

      <form className="flex gap-2">
        <Input name="q" defaultValue={query} placeholder="Rechercher une école..." />
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>

      {schools.length === 0 ? (
        <EmptyState
          title={
            query ? "Aucune école ne correspond à cette recherche" : "Aucune école enregistrée"
          }
          description={
            query ? "Essayez un autre terme de recherche." : "Créez la première école de référence."
          }
          action={
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/admin/schools/new">Créer une école</Link>}
            />
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Ville / Pays</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                        aria-label={`Modifier ${school.name}`}
                        title={`Modifier ${school.name}`}
                        render={
                          <Link href={`/admin/schools/${school.id}/edit`}>
                            <Pencil className="size-4" aria-hidden />
                          </Link>
                        }
                      />
                      <AdminDeleteButton
                        action={deleteSchoolAction.bind(null, school.id)}
                        entityLabel={`l'école « ${school.name} »`}
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
