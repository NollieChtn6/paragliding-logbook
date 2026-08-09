import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { deleteSitePointAction } from "@/actions/delete-site-point";
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
import { listSitePoints } from "@/features/site-points";
import { SitePointsFilters } from "@/features/site-points/site-points-filters";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

export default async function AdminSitePointsPage(props: PageProps<"/admin/site-points">) {
  const searchParams = await props.searchParams;
  const query = firstParam(searchParams.q);
  const siteId = firstParam(searchParams.siteId);
  const typeCodeParam = firstParam(searchParams.typeCode);
  const typeCode =
    typeCodeParam === "TAKEOFF" || typeCodeParam === "LANDING" ? typeCodeParam : undefined;

  const [points, sites] = await Promise.all([
    listSitePoints({ query, siteId, typeCode }),
    prisma.site.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const hasFilters = Boolean(query || siteId || typeCode);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Points de site"
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/site-points/new">
                <Plus className="size-4" aria-hidden />
                Nouveau point
              </Link>
            }
          />
        }
      />

      <SitePointsFilters sites={sites} query={query} siteId={siteId} typeCode={typeCode} />

      {points.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Aucun point ne correspond à ces filtres" : "Aucun point enregistré"}
          description={
            hasFilters
              ? "Essayez d'autres critères de recherche."
              : "Créez le premier point de décollage ou d'atterrissage."
          }
          action={
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/admin/site-points/new">Créer un point</Link>}
            />
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Altitude</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map((point) => {
                const isTakeoff = point.sitePointType.code === "TAKEOFF";
                const Icon = isTakeoff ? ArrowUpRight : ArrowDownLeft;
                return (
                  <TableRow key={point.id}>
                    <TableCell>
                      <Link
                        href={`/admin/site-points/${point.id}/edit`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {point.label}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{point.site.name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 ${isTakeoff ? "text-primary" : "text-accent"}`}
                      >
                        <Icon className="size-4" aria-hidden />
                        {isTakeoff ? "Décollage" : "Atterrissage"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{point.altitudeM} m</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          nativeButton={false}
                          variant="ghost"
                          size="sm"
                          render={
                            <Link href={`/admin/site-points/${point.id}/edit`}>Modifier</Link>
                          }
                        />
                        <AdminDeleteButton
                          action={deleteSitePointAction.bind(null, point.id)}
                          entityLabel={`le point « ${point.label} »`}
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
