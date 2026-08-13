import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { deleteSpotAction } from "@/actions/delete-spot";
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
import { listSpots } from "@/features/spots";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

export const dynamic = "force-dynamic";

export default async function AdminSpotsPage(props: PageProps<"/admin/spots">) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const spots = await listSpots(query);
  const t = getDictionary(await getLocale());
  const ts = t.spots;

  function formatLocation(spot: { region: string | null; countryCode: string | null }): string {
    if (spot.region && spot.countryCode) return `${spot.region} · ${spot.countryCode}`;
    return spot.region ?? spot.countryCode ?? ts.noLocation;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ts.pageTitle}
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/spots/new">
                <Plus className="size-4" aria-hidden />
                {ts.newSpot}
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

      {spots.length === 0 ? (
        <EmptyState
          title={query ? ts.emptyFilteredTitle : ts.emptyNoneTitle}
          description={query ? ts.emptyFilteredDescription : ts.emptyNoneDescription}
          action={
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/admin/spots/new">{ts.createSpotButton}</Link>}
            />
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ts.colName}</TableHead>
                <TableHead>{ts.colRegionCountry}</TableHead>
                <TableHead>{ts.colSites}</TableHead>
                <TableHead className="text-right">{ts.colActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spots.map((spot) => (
                <TableRow key={spot.id}>
                  <TableCell>
                    <Link
                      href={`/admin/spots/${spot.id}/edit`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {spot.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatLocation(spot)}</TableCell>
                  <TableCell className="text-muted-foreground">{spot._count.sites}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        nativeButton={false}
                        variant="ghost"
                        size="icon-sm"
                        aria-label={ts.modifyAriaLabel(spot.name)}
                        title={ts.modifyAriaLabel(spot.name)}
                        render={
                          <Link href={`/admin/spots/${spot.id}/edit`}>
                            <Pencil className="size-4" aria-hidden />
                          </Link>
                        }
                      />
                      <AdminDeleteButton
                        action={deleteSpotAction.bind(null, spot.id)}
                        entityLabel={ts.entityLabel(spot.name)}
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
