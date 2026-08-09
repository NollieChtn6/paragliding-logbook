import { createSitePointAction } from "@/actions/create-site-point";
import { PageHeader } from "@/components/layout/page-header";
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nouveau point" />
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
