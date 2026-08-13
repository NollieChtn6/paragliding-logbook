import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { deleteSiteAction } from "@/actions/delete-site";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
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
import { listSites } from "@/features/sites";
import { SitesFilters } from "@/features/sites/sites-filters";
import { getLocale } from "@/lib/i18n/get-locale";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

export default async function AdminSitesPage(props: PageProps<"/admin/sites">) {
  const searchParams = await props.searchParams;
  const query = firstParam(searchParams.q);
  const spotId = firstParam(searchParams.spotId);
  const typeCodeParam = firstParam(searchParams.typeCode);
  const typeCode =
    typeCodeParam === "TAKEOFF" || typeCodeParam === "LANDING" ? typeCodeParam : undefined;

  const [sites, spots] = await Promise.all([
    listSites({ query, spotId, typeCode }),
    prisma.spot.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const t = getDictionary(await getLocale());

  const hasFilters = Boolean(query || spotId || typeCode);
  const ts = t.sites;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ts.pageTitle}
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/sites/new">
                <Plus className="size-4" aria-hidden />
                {ts.newSite}
              </Link>
            }
          />
        }
      />

      <SitesFilters spots={spots} query={query} spotId={spotId} typeCode={typeCode} />

      {sites.length === 0 ? (
        <EmptyState
          title={hasFilters ? ts.emptyFilteredTitle : ts.emptyNoneTitle}
          description={hasFilters ? ts.emptyFilteredDescription : ts.emptyNoneDescription}
          action={
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/admin/sites/new">{ts.createSiteButton}</Link>}
            />
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ts.colName}</TableHead>
                <TableHead>{ts.colSpot}</TableHead>
                <TableHead>{ts.colType}</TableHead>
                <TableHead>{ts.colAltitude}</TableHead>
                <TableHead className="text-right">{ts.colActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => {
                const isTakeoff = site.siteType.code === "TAKEOFF";
                const Icon = isTakeoff ? ArrowUpRight : ArrowDownLeft;
                return (
                  <TableRow key={site.id}>
                    <TableCell>
                      <Link
                        href={`/admin/sites/${site.id}/edit`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {site.label}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{site.spot.name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 ${isTakeoff ? "text-primary" : "text-accent"}`}
                      >
                        <Icon className="size-4" aria-hidden />
                        {t.referenceLabels.siteType[site.siteType.code] ?? site.siteType.code}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{site.altitudeM} m</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          nativeButton={false}
                          variant="ghost"
                          size="sm"
                          render={
                            <Link href={`/admin/sites/${site.id}/edit`}>{t.common.edit}</Link>
                          }
                        />
                        <AdminDeleteButton
                          action={deleteSiteAction.bind(null, site.id)}
                          entityLabel={ts.entityLabel(site.label)}
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
