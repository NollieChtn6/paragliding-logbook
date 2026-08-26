import { Feather, LifeBuoy, type LucideIcon, PersonStanding } from "lucide-react";
import Link from "next/link";

// Une icône par type plutôt qu'un pictogramme générique unique : une voile,
// une sellette et un secours sont trois objets différents, et le secours en
// particulier porte un enjeu de sécurité qui mérite d'être identifiable au
// coup d'œil dans la liste, pas seulement au libellé. Exporté : réutilisé par
// /equipment/[id] pour la même icône dans le bandeau hero (voir
// activity-card.tsx > ACTIVITY_TYPE_STYLE pour le même principe côté
// activités).
export const EQUIPMENT_TYPE_ICONS: Record<"WING" | "HARNESS" | "RESERVE", LucideIcon> = {
  WING: Feather,
  HARNESS: PersonStanding,
  RESERVE: LifeBuoy,
};

type EquipmentCardProps = {
  href: string;
  brand: string;
  model: string;
  typeCode: "WING" | "HARNESS" | "RESERVE";
  typeLabel: string;
  // Affiché uniquement si le matériel n'est plus ACTIVE (voir
  // list-equipment.service.ts) : un matériel actif n'a pas besoin de le
  // préciser, seul un statut "hors circulation" est une information utile
  // d'un coup d'œil dans la liste.
  statusLabel?: string;
};

// Même gabarit que QualificationCard (features/qualifications) : un
// équipement est une donnée personnelle, pas une ligne de référentiel admin.
// Pure navigation vers /equipment/[id] (même convention que ActivityCard) :
// la suppression vit sur la page de détail, pas ici (voir
// equipment/[id]/page.tsx).
export function EquipmentCard({
  href,
  brand,
  model,
  typeCode,
  typeLabel,
  statusLabel,
}: EquipmentCardProps) {
  const subtitle = statusLabel ? `${typeLabel} · ${statusLabel}` : typeLabel;
  const TypeIcon = EQUIPMENT_TYPE_ICONS[typeCode];

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5"
    >
      <span
        className="flex size-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent"
        aria-hidden
      >
        <TypeIcon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {brand} {model}
        </span>
        <span className="block truncate text-sm text-muted-foreground">{subtitle}</span>
      </span>
    </Link>
  );
}
