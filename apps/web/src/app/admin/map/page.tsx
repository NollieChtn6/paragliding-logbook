import { Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildMapMarkers } from "@/features/map";
import { AdminMapLoader } from "@/features/map/admin-map-loader";
import { listSchools } from "@/features/schools";
import { listSites } from "@/features/sites";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

export const dynamic = "force-dynamic";

export default async function AdminMapPage() {
  const [sites, schools] = await Promise.all([listSites(), listSchools()]);
  const t = getDictionary(await getLocale());
  const markers = buildMapMarkers(sites, schools, t.admin);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t.admin.navMap}
        description={t.admin.mapPageDescription}
        actions={
          <DropdownMenu>
            {/* buttonVariants() directement sur le trigger plutôt que
            render={<Button>} : DropdownMenuTrigger et Button posent chacun
            leur propre data-slot sur le même élément, dont l'ordre de
            fusion diverge entre le rendu serveur et l'hydratation client
            (avertissement d'hydratation React). Trigger a déjà le
            comportement d'un <button> natif, seul le style manquait. */}
            <DropdownMenuTrigger className={buttonVariants()}>
              <Plus className="size-4" aria-hidden />
              {t.admin.newButton}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href="/admin/spots/new">{t.admin.menuSpot}</Link>} />
              <DropdownMenuItem render={<Link href="/admin/sites/new">{t.admin.menuSite}</Link>} />
              <DropdownMenuItem
                render={<Link href="/admin/schools/new">{t.admin.menuSchool}</Link>}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {markers.length === 0 ? (
        <EmptyState title={t.admin.mapEmptyTitle} description={t.admin.mapEmptyDescription} />
      ) : (
        <AdminMapLoader markers={markers} />
      )}
    </div>
  );
}
