import { Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listEquipment } from "@/features/equipment";
import { EquipmentCard } from "@/features/equipment/equipment-card";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

// La liste doit toujours refléter l'état actuel de la base, pas un
// instantané figé au build (même principe que /qualifications).
export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const user = await requireCurrentUser();
  const equipment = await listEquipment(user.id);
  const locale = await getLocale();
  const t = getDictionary(locale);
  const te = t.equipment;

  function formatEquipmentType(equipmentType: { code: string }): string {
    return t.referenceLabels.equipmentType[equipmentType.code] ?? equipmentType.code;
  }

  function formatStatus(status: "ACTIVE" | "SOLD" | "RETIRED"): string | undefined {
    if (status === "SOLD") return te.statusSold;
    if (status === "RETIRED") return te.statusRetired;
    return undefined;
  }

  // Regroupé par catégorie (voile/sellette/secours) plutôt qu'une seule
  // liste triée par date de création : un pilote pense son équipement par
  // catégorie, pas par ordre d'ajout. Ordre fixe (même ordre que les
  // sélecteurs de FlightForm) ; une catégorie sans matériel n'affiche pas de
  // section vide.
  const EQUIPMENT_TYPE_ORDER = ["WING", "HARNESS", "RESERVE"] as const;
  const equipmentByType = EQUIPMENT_TYPE_ORDER.map((code) => ({
    code,
    label: t.referenceLabels.equipmentType[code] ?? code,
    items: equipment.filter((item) => item.equipmentType.code === code),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={te.pageTitle}
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/equipment/new">
                <Plus className="size-4" aria-hidden />
                {te.newEquipment}
              </Link>
            }
          />
        }
      />

      {equipment.length === 0 ? (
        <EmptyState
          title={te.emptyTitle}
          description={te.emptyDescription}
          action={
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/equipment/new">{te.addEquipmentButton}</Link>}
            />
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {equipmentByType.map((group) => (
            <div key={group.code} className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">{group.label}</h2>
              {group.items.map((item) => (
                <EquipmentCard
                  key={item.id}
                  href={`/equipment/${item.id}`}
                  brand={item.brand}
                  model={item.model}
                  typeCode={group.code}
                  typeLabel={formatEquipmentType(item.equipmentType)}
                  statusLabel={formatStatus(item.status)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
