import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSiteAction } from "@/actions/delete-site";
import { updateSiteAction } from "@/actions/update-site";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSite } from "@/features/sites";
import { SiteForm } from "@/features/sites/site-form";
import { SITE_POINT_TYPE_LABELS } from "@/lib/reference-labels";

export const dynamic = "force-dynamic";

export default async function EditSitePage(props: PageProps<"/admin/sites/[id]/edit">) {
  const { id } = await props.params;
  const site = await getSite(id);

  if (!site) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Modifier ${site.name}`}
        actions={
          <>
            <LeaveFormButton
              href="/admin/sites"
              title="Abandonner la modification ?"
              description="Les modifications ne seront pas conservées."
            />
            <AdminDeleteButton
              action={deleteSiteAction.bind(null, site.id)}
              entityLabel={`le site « ${site.name} »`}
            />
          </>
        }
      />

      <SiteForm
        action={updateSiteAction.bind(null, site.id)}
        submitLabel="Modifier le site"
        defaultValues={{
          name: site.name,
          region: site.region ?? undefined,
          countryCode: site.countryCode ?? undefined,
          latitude: site.latitude ?? undefined,
          longitude: site.longitude ?? undefined,
        }}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight text-foreground">
            Points ({site.points.length})
          </h2>
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            render={
              <Link href={`/admin/site-points/new?siteId=${site.id}`}>
                <Plus className="size-4" aria-hidden />
                Ajouter un point
              </Link>
            }
          />
        </div>

        {site.points.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun point pour ce site.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {site.points.map((point) => (
              <Card key={point.id}>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{point.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {SITE_POINT_TYPE_LABELS[point.sitePointType.code] ?? point.sitePointType.code}{" "}
                      · {point.altitudeM} m
                    </p>
                  </div>
                  <Button
                    nativeButton={false}
                    variant="ghost"
                    size="sm"
                    render={<Link href={`/admin/site-points/${point.id}/edit`}>Modifier</Link>}
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
