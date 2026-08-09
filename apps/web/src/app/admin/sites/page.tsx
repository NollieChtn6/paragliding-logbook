import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { deleteSiteAction } from "@/actions/delete-site";
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
import { listSites } from "@/features/sites";

export const dynamic = "force-dynamic";

function formatLocation(site: { region: string | null; countryCode: string | null }): string {
  if (site.region && site.countryCode) return `${site.region} · ${site.countryCode}`;
  return site.region ?? site.countryCode ?? "—";
}

export default async function AdminSitesPage(props: PageProps<"/admin/sites">) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const sites = await listSites(query);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sites"
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/sites/new">
                <Plus className="size-4" aria-hidden />
                Nouveau site
              </Link>
            }
          />
        }
      />

      <form className="flex gap-2">
        <Input name="q" defaultValue={query} placeholder="Rechercher un site..." />
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>

      {sites.length === 0 ? (
        <EmptyState
          title={query ? "Aucun site ne correspond à cette recherche" : "Aucun site enregistré"}
          description={
            query ? "Essayez un autre terme de recherche." : "Créez le premier site de référence."
          }
          action={
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/admin/sites/new">Créer un site</Link>}
            />
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Région / Pays</TableHead>
                <TableHead>Points</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>
                    <Link
                      href={`/admin/sites/${site.id}/edit`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {site.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatLocation(site)}</TableCell>
                  <TableCell className="text-muted-foreground">{site._count.points}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        nativeButton={false}
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Modifier ${site.name}`}
                        title={`Modifier ${site.name}`}
                        render={
                          <Link href={`/admin/sites/${site.id}/edit`}>
                            <Pencil className="size-4" aria-hidden />
                          </Link>
                        }
                      />
                      <AdminDeleteButton
                        action={deleteSiteAction.bind(null, site.id)}
                        entityLabel={`le site « ${site.name} »`}
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
