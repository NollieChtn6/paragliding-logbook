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
import { SITE_TYPE_LABELS } from "@/lib/reference-labels";

export const dynamic = "force-dynamic";

export default async function EditSpotPage(props: PageProps<"/admin/spots/[id]/edit">) {
  const { id } = await props.params;
  const spot = await getSpot(id);

  if (!spot) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Modifier ${spot.name}`}
        actions={
          <>
            <LeaveFormButton
              href="/admin/spots"
              title="Abandonner la modification ?"
              description="Les modifications ne seront pas conservées."
            />
            <AdminDeleteButton
              action={deleteSpotAction.bind(null, spot.id)}
              entityLabel={`le spot « ${spot.name} »`}
            />
          </>
        }
      />

      <SpotForm
        action={updateSpotAction.bind(null, spot.id)}
        submitLabel="Modifier le spot"
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
            Sites ({spot.sites.length})
          </h2>
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            render={
              <Link href={`/admin/sites/new?spotId=${spot.id}`}>
                <Plus className="size-4" aria-hidden />
                Ajouter un site
              </Link>
            }
          />
        </div>

        {spot.sites.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun site pour ce spot.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {spot.sites.map((site) => (
              <Card key={site.id}>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{site.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {SITE_TYPE_LABELS[site.siteType.code] ?? site.siteType.code} ·{" "}
                      {site.altitudeM} m
                    </p>
                  </div>
                  <Button
                    nativeButton={false}
                    variant="ghost"
                    size="sm"
                    render={<Link href={`/admin/sites/${site.id}/edit`}>Modifier</Link>}
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
