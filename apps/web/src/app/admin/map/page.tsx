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
import { listSitePoints } from "@/features/site-points";

export const dynamic = "force-dynamic";

export default async function AdminMapPage() {
  const [sitePoints, schools] = await Promise.all([listSitePoints(), listSchools()]);
  const markers = buildMapMarkers(sitePoints, schools);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Carte"
        description="Sites, points et écoles du référentiel"
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
              Nouveau
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href="/admin/sites/new">Site</Link>} />
              <DropdownMenuItem render={<Link href="/admin/site-points/new">Point</Link>} />
              <DropdownMenuItem render={<Link href="/admin/schools/new">École</Link>} />
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {markers.length === 0 ? (
        <EmptyState
          title="Aucun lieu géolocalisé"
          description="Les points de site sont toujours géolocalisés ; les écoles apparaissent une fois leur adresse renseignée via la recherche BAN."
        />
      ) : (
        <AdminMapLoader markers={markers} />
      )}
    </div>
  );
}
