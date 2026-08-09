import { createSitePointAction } from "@/actions/create-site-point";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { SitePointForm } from "@/features/site-points/site-point-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewSitePointPage(props: PageProps<"/admin/site-points/new">) {
  const searchParams = await props.searchParams;
  const siteId = typeof searchParams.siteId === "string" ? searchParams.siteId : undefined;

  const [sites, sitePointTypes] = await Promise.all([
    prisma.site.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.sitePointType.findMany({ select: { id: true, code: true } }),
  ]);

  // Revient au site d'origine quand la création vient de là (bouton
  // "Ajouter un point" sur /admin/sites/[id]/edit), sinon à la liste
  // générale des points.
  const cancelHref = siteId ? `/admin/sites/${siteId}/edit` : "/admin/site-points";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nouveau point" actions={<LeaveFormButton href={cancelHref} />} />
      <SitePointForm
        sites={sites}
        sitePointTypes={sitePointTypes}
        action={createSitePointAction}
        submitLabel="Créer le point"
        defaultValues={siteId ? { siteId } : undefined}
      />
    </div>
  );
}
