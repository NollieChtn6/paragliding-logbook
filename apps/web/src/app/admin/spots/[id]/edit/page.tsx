import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSpotAction } from "@/actions/delete-spot";
import { updateSpotAction } from "@/actions/update-spot";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSpot } from "@/features/spots";
import { SpotForm } from "@/features/spots/spot-form";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

export const dynamic = "force-dynamic";

export default async function EditSpotPage(props: PageProps<"/admin/spots/[id]/edit">) {
  const { id } = await props.params;
  const spot = await getSpot(id);

  if (!spot) {
    notFound();
  }

  const t = getDictionary(await getLocale());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t.spots.modifyTitle(spot.name)}
        actions={
          <>
            <LeaveFormButton
              href="/admin/spots"
              title={t.common.discardChangesTitle}
              description={t.common.discardChangesDescription}
            />
            <AdminDeleteButton
              action={deleteSpotAction.bind(null, spot.id)}
              entityLabel={t.spots.entityLabel(spot.name)}
            />
          </>
        }
      />

      <SpotForm
        action={updateSpotAction.bind(null, spot.id)}
        submitLabel={t.spots.editSpot}
        defaultValues={{
          name: spot.name,
          region: spot.region ?? undefined,
          countryCode: spot.countryCode ?? undefined,
          latitude: spot.latitude ?? undefined,
          longitude: spot.longitude ?? undefined,
        }}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight text-foreground">
            {t.sites.sitesCountTitle(spot.sites.length)}
          </h2>
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            render={
              <Link href={`/admin/sites/new?spotId=${spot.id}`}>
                <Plus className="size-4" aria-hidden />
                {t.sites.addSite}
              </Link>
            }
          />
        </div>

        {spot.sites.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.sites.noSitesForSpot}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {spot.sites.map((site) => (
              <Card key={site.id}>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{site.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.referenceLabels.siteType[site.siteType.code] ?? site.siteType.code} ·{" "}
                      {site.altitudeM} m
                    </p>
                  </div>
                  <Button
                    nativeButton={false}
                    variant="ghost"
                    size="sm"
                    render={<Link href={`/admin/sites/${site.id}/edit`}>{t.common.edit}</Link>}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
