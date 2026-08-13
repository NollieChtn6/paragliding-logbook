import { createSiteAction } from "@/actions/create-site";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { SiteForm } from "@/features/sites/site-form";
import { getLocale } from "@/lib/i18n/get-locale";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";

export const dynamic = "force-dynamic";

export default async function NewSitePage(props: PageProps<"/admin/sites/new">) {
  const searchParams = await props.searchParams;
  const spotId = typeof searchParams.spotId === "string" ? searchParams.spotId : undefined;

  const [spots, siteTypes] = await Promise.all([
    prisma.spot.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.siteType.findMany({ select: { id: true, code: true } }),
  ]);
  const t = getDictionary(await getLocale());

  // Revient au spot d'origine quand la création vient de là (bouton
  // "Ajouter un site" sur /admin/spots/[id]/edit), sinon à la liste
  // générale des sites.
  const cancelHref = spotId ? `/admin/spots/${spotId}/edit` : "/admin/sites";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.sites.newSite} actions={<LeaveFormButton href={cancelHref} />} />
      <SiteForm
        spots={spots}
        siteTypes={siteTypes}
        action={createSiteAction}
        submitLabel={t.sites.createSite}
        defaultValues={spotId ? { spotId } : undefined}
      />
    </div>
  );
}
