import { Package } from "lucide-react";
import Link from "next/link";
import { EquipmentDeleteButton } from "./equipment-delete-button";

type EquipmentCardProps = {
  href: string;
  brand: string;
  model: string;
  typeLabel: string;
  usageLabel: string;
  // Affiché uniquement si le matériel n'est plus ACTIVE (voir
  // list-equipment.service.ts) : un matériel actif n'a pas besoin de le
  // préciser, seul un statut "hors circulation" est une information utile
  // d'un coup d'œil dans la liste.
  statusLabel?: string;
  deleteAction: (
    prevState: { success: true } | { success: false; error: string } | null,
    formData: FormData,
  ) => Promise<{ success: true } | { success: false; error: string }>;
  deleteEntityLabel: string;
};

// Même gabarit que QualificationCard (features/qualifications) : un
// équipement est une donnée personnelle, pas une ligne de référentiel admin.
export function EquipmentCard({
  href,
  brand,
  model,
  typeLabel,
  usageLabel,
  statusLabel,
  deleteAction,
  deleteEntityLabel,
}: EquipmentCardProps) {
  const subtitle = statusLabel
    ? `${typeLabel} · ${usageLabel} · ${statusLabel}`
    : `${typeLabel} · ${usageLabel}`;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="flex size-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent"
          aria-hidden
        >
          <Package className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {brand} {model}
          </span>
          <span className="block truncate text-sm text-muted-foreground">{subtitle}</span>
        </span>
      </Link>
      <EquipmentDeleteButton action={deleteAction} entityLabel={deleteEntityLabel} />
    </div>
  );
}
