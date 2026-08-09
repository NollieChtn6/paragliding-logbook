import { notFound } from "next/navigation";
import { deleteSitePointAction } from "@/actions/delete-site-point";
import { updateSitePointAction } from "@/actions/update-site-point";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { getSitePoint } from "@/features/site-points";
import { SitePointForm } from "@/features/site-points/site-point-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditSitePointPage(props: PageProps<"/admin/site-points/[id]/edit">) {
  const { id } = await props.params;
  const [point, sites, sitePointTypes] = await Promise.all([
    getSitePoint(id),
    prisma.site.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.sitePointType.findMany({ select: { id: true, code: true } }),
  ]);

  if (!point) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Modifier ${point.label}`}
        actions={
          <>
            <LeaveFormButton
              href={`/admin/sites/${point.siteId}/edit`}
              title="Abandonner la modification ?"
              description="Les modifications ne seront pas conservées."
            />
            <AdminDeleteButton
              action={deleteSitePointAction.bind(null, point.id)}
              entityLabel={`le point « ${point.label} »`}
            />
          </>
        }
      />

      <SitePointForm
        sites={sites}
        sitePointTypes={sitePointTypes}
        action={updateSitePointAction.bind(null, point.id)}
        submitLabel="Modifier le point"
        defaultValues={{
          label: point.label,
          siteId: point.siteId,
          sitePointTypeId: point.sitePointTypeId,
          latitude: point.latitude,
          longitude: point.longitude,
          altitudeM: point.altitudeM,
          orientationDeg: point.orientationDeg ?? undefined,
        }}
      />
    </div>
  );
}
