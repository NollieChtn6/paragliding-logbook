import { notFound } from "next/navigation";
import { updateEquipmentAction } from "@/actions/update-equipment";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { getEquipment } from "@/features/equipment";
import { EquipmentForm } from "@/features/equipment/equipment-form";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";

export const dynamic = "force-dynamic";

export default async function EditEquipmentPage(props: PageProps<"/equipment/[id]/edit">) {
  const { id } = await props.params;
  const user = await requireCurrentUser();
  const equipment = await getEquipment(user.id, id);

  if (!equipment) {
    notFound();
  }

  const locale = await getLocale();
  const t = getDictionary(locale);
  const te = t.equipment;

  const equipmentTypes = await prisma.equipmentType.findMany({ select: { id: true, code: true } });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={te.editEquipment}
        actions={
          <LeaveFormButton
            href={`/equipment/${equipment.id}`}
            title={t.common.discardChangesTitle}
            description={t.common.discardChangesDescription}
          />
        }
      />

      <EquipmentForm
        equipmentTypes={equipmentTypes}
        action={updateEquipmentAction.bind(null, equipment.id)}
        submitLabel={te.editEquipment}
        showStatus
        defaultValues={{
          equipmentTypeId: equipment.equipmentTypeId,
          brand: equipment.brand,
          model: equipment.model,
          size: equipment.size ?? undefined,
          purchaseDate: equipment.purchaseDate,
          condition: equipment.condition,
          initialUsageMin: equipment.initialUsageMin,
          status: equipment.status,
        }}
      />
    </div>
  );
}
