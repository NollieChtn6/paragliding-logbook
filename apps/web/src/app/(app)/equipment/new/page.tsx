import { createEquipmentAction } from "@/actions/create-equipment";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { EquipmentForm } from "@/features/equipment/equipment-form";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";

// La liste des catégories de matériel doit toujours refléter l'état actuel
// de la base, pas un instantané figé au build.
export const dynamic = "force-dynamic";

export default async function NewEquipmentPage() {
  await requireCurrentUser();
  const locale = await getLocale();
  const t = getDictionary(locale);

  const equipmentTypes = await prisma.equipmentType.findMany({ select: { id: true, code: true } });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t.equipment.newEquipment}
        actions={<LeaveFormButton href="/equipment" />}
      />
      <EquipmentForm
        equipmentTypes={equipmentTypes}
        action={createEquipmentAction}
        submitLabel={t.equipment.createEquipment}
      />
    </div>
  );
}
