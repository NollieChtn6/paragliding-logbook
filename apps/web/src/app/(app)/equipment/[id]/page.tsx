import { ArrowLeft, Clock3, Plane, Wind } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteEquipmentAction } from "@/actions/delete-equipment";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import {
  formatEquipmentOption,
  getEquipment,
  getEquipmentStats,
  getEquipmentUsageMinutes,
} from "@/features/equipment";
import { EQUIPMENT_TYPE_ICONS } from "@/features/equipment/equipment-card";
import { EquipmentDeleteButton } from "@/features/equipment/equipment-delete-button";
import { requireCurrentUser } from "@/lib/current-user";
import { formatDate } from "@/lib/format-date";
import { formatDurationMinutes } from "@/lib/format-duration";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

export const dynamic = "force-dynamic";

export default async function EquipmentDetailPage(props: PageProps<"/equipment/[id]">) {
  const { id } = await props.params;
  const user = await requireCurrentUser();
  const equipment = await getEquipment(user.id, id);

  if (!equipment) {
    notFound();
  }

  const locale = await getLocale();
  const t = getDictionary(locale);
  const te = t.equipment;

  const typeCode = equipment.equipmentType.code as "WING" | "HARNESS" | "RESERVE";
  const typeLabel = t.referenceLabels.equipmentType[typeCode] ?? equipment.equipmentType.code;
  const conditionLabel = equipment.condition === "USED" ? te.conditionUsed : te.conditionNew;
  const statusLabel =
    equipment.status === "SOLD"
      ? te.statusSold
      : equipment.status === "RETIRED"
        ? te.statusRetired
        : undefined;

  const [stats, usageMinutes] = await Promise.all([
    getEquipmentStats(equipment.id),
    getEquipmentUsageMinutes(equipment),
  ]);

  const entityLabel = te.entityLabel(`${equipment.brand} ${equipment.model}`);
  const TypeIcon = EQUIPMENT_TYPE_ICONS[typeCode];
  const heroSubtitle = [
    `${conditionLabel} · ${formatDate(equipment.purchaseDate, locale)}`,
    statusLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/equipment"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {te.backToEquipment}
      </Link>

      <PageHeader
        title={typeLabel}
        actions={
          <div className="flex items-center gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={`/equipment/${equipment.id}/edit`}>{te.edit}</Link>}
            />
            <EquipmentDeleteButton
              action={deleteEquipmentAction.bind(null, equipment.id)}
              entityLabel={entityLabel}
            />
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <span
          className="flex size-12 flex-none items-center justify-center rounded-2xl bg-accent/15 text-accent"
          aria-hidden
        >
          <TypeIcon className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold tracking-tight text-foreground">
            {formatEquipmentOption(equipment)}
          </p>
          <p className="text-sm text-muted-foreground">{heroSubtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Plane} label={te.flightsCountLabel} value={stats.flightCount} />
        {typeCode !== "RESERVE" && (
          <StatCard
            icon={Wind}
            label={te.groundHandlingSessionsCountLabel}
            value={stats.groundHandlingSessionCount}
          />
        )}
        <StatCard icon={Clock3} label={te.usageLabel} value={formatDurationMinutes(usageMinutes)} />
      </div>
    </div>
  );
}
