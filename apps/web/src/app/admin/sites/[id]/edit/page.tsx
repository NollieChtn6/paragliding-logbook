import { notFound } from "next/navigation";
import { deleteSiteAction } from "@/actions/delete-site";
import { updateSiteAction } from "@/actions/update-site";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { getSite } from "@/features/sites";
import { SiteForm } from "@/features/sites/site-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditSitePage(props: PageProps<"/admin/sites/[id]/edit">) {
  const { id } = await props.params;
  const [site, spots, siteTypes] = await Promise.all([
    getSite(id),
    prisma.spot.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.siteType.findMany({ select: { id: true, code: true } }),
  ]);

  if (!site) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Modifier ${site.label}`}
        actions={
          <>
            <LeaveFormButton
              href={`/admin/spots/${site.spotId}/edit`}
              title="Abandonner la modification ?"
              description="Les modifications ne seront pas conservées."
            />
            <AdminDeleteButton
              action={deleteSiteAction.bind(null, site.id)}
              entityLabel={`le site « ${site.label} »`}
            />
          </>
        }
      />

      <SiteForm
        spots={spots}
        siteTypes={siteTypes}
        action={updateSiteAction.bind(null, site.id)}
        submitLabel="Modifier le site"
        defaultValues={{
          label: site.label,
          spotId: site.spotId,
          siteTypeId: site.siteTypeId,
          latitude: site.latitude,
          longitude: site.longitude,
          altitudeM: site.altitudeM,
          orientationDeg: site.orientationDeg ?? undefined,
        }}
      />
    </div>
  );
}
