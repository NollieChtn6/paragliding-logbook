"use client";

import { useActionState, useEffect, useState } from "react";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";

type EquipmentFormActionState = { success: true } | { success: false; error: string };

type EquipmentFormDefaultValues = {
  equipmentTypeId?: string;
  brand?: string;
  model?: string;
  size?: string;
  purchaseDate?: Date;
  condition?: "NEW" | "USED";
  initialUsageMin?: number;
  status?: "ACTIVE" | "SOLD" | "RETIRED";
};

type EquipmentTypeOption = { id: string; code: string };

type EquipmentFormProps = {
  equipmentTypes: EquipmentTypeOption[];
  action: (
    prevState: EquipmentFormActionState | null,
    formData: FormData,
  ) => Promise<EquipmentFormActionState>;
  defaultValues?: EquipmentFormDefaultValues;
  submitLabel?: string;
  // Le statut (ACTIVE/SOLD/RETIRED) ne se modifie qu'à l'édition : toujours
  // ACTIVE par défaut à la création (voir lib/validations/equipment.ts), pas
  // de champ à afficher sur /equipment/new.
  showStatus?: boolean;
};

// Format attendu par <Input type="date">, même principe que
// qualification-form.tsx/training-camp-form.tsx.
function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Formulaire simple (pas d'assistant multi-étapes) : peu de champs, tous
// visibles d'un coup, même principe que QualificationForm/SchoolForm.
// Utilisé en création (/equipment/new) et en modification
// (/equipment/[id]/edit).
export function EquipmentForm({
  equipmentTypes,
  action,
  defaultValues,
  submitLabel,
  showStatus = false,
}: EquipmentFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [equipmentTypeId, setEquipmentTypeId] = useState(defaultValues?.equipmentTypeId ?? "");
  // condition affiché en state (pas seulement défaut non contrôlé) : affiche/
  // masque initialUsageMin selon la valeur choisie, sans aller-retour serveur.
  const [condition, setCondition] = useState<"NEW" | "USED">(defaultValues?.condition ?? "NEW");
  // Contrôlé (pas defaultValue) : le champ est démonté/remonté selon
  // condition ci-dessous (voir bloc initialUsageMin), un <Input
  // defaultValue> non contrôlé perdrait une saisie en cours si l'utilisateur
  // repasse temporairement sur "Neuf" avant de revenir sur "Occasion".
  const [initialUsageMin, setInitialUsageMin] = useState(
    defaultValues?.initialUsageMin?.toString() ?? "",
  );
  const [status, setStatus] = useState<"ACTIVE" | "SOLD" | "RETIRED">(
    defaultValues?.status ?? "ACTIVE",
  );
  const t = useT();
  const te = t.equipment;

  function formatEquipmentTypeOption(equipmentType: EquipmentTypeOption): string {
    return t.referenceLabels.equipmentType[equipmentType.code] ?? equipmentType.code;
  }

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, description: t.common.retryReassurance, type: "error" });
    }
  }, [state, t]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="equipmentTypeId">{te.typeLabel}</Label>
        <Select
          name="equipmentTypeId"
          value={equipmentTypeId}
          onValueChange={(value) => setEquipmentTypeId(value ?? "")}
          required
        >
          <SelectTrigger id="equipmentTypeId" className="w-full">
            <SelectValue placeholder={te.chooseType}>
              {(value: string | null) => {
                const equipmentType = equipmentTypes.find((option) => option.id === value);
                return equipmentType ? formatEquipmentTypeOption(equipmentType) : te.chooseType;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {equipmentTypes.map((equipmentType) => (
              <SelectItem key={equipmentType.id} value={equipmentType.id}>
                {formatEquipmentTypeOption(equipmentType)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="brand">{te.brandLabel}</Label>
        <Input id="brand" name="brand" defaultValue={defaultValues?.brand} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="model">{te.modelLabel}</Label>
        <Input id="model" name="model" defaultValue={defaultValues?.model} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="size">{te.sizeLabel}</Label>
        <Input id="size" name="size" defaultValue={defaultValues?.size} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="purchaseDate">{te.purchaseDateLabel}</Label>
        <Input
          id="purchaseDate"
          name="purchaseDate"
          type="date"
          defaultValue={
            defaultValues?.purchaseDate ? toDateInputValue(defaultValues.purchaseDate) : undefined
          }
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="condition">{te.conditionLabel}</Label>
        <Select
          name="condition"
          value={condition}
          onValueChange={(value) => setCondition(value === "USED" ? "USED" : "NEW")}
          required
        >
          <SelectTrigger id="condition" className="w-full">
            <SelectValue placeholder={te.conditionLabel}>
              {(value: string | null) => (value === "USED" ? te.conditionUsed : te.conditionNew)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NEW">{te.conditionNew}</SelectItem>
            <SelectItem value="USED">{te.conditionUsed}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {condition === "USED" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="initialUsageMin">{te.initialUsageLabel}</Label>
          <Input
            id="initialUsageMin"
            name="initialUsageMin"
            type="number"
            min={0}
            step={1}
            value={initialUsageMin}
            onChange={(event) => setInitialUsageMin(event.target.value)}
          />
        </div>
      )}

      {showStatus && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">{te.statusLabel}</Label>
          <Select
            name="status"
            value={status}
            onValueChange={(value) => {
              if (value === "SOLD" || value === "RETIRED" || value === "ACTIVE") {
                setStatus(value);
              }
            }}
            required
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder={te.statusLabel}>
                {(value: string | null) => {
                  if (value === "SOLD") return te.statusSold;
                  if (value === "RETIRED") return te.statusRetired;
                  return te.statusActive;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">{te.statusActive}</SelectItem>
              <SelectItem value="SOLD">{te.statusSold}</SelectItem>
              <SelectItem value="RETIRED">{te.statusRetired}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="mt-2" disabled={isPending}>
        {isPending ? t.common.saving : (submitLabel ?? te.createEquipment)}
      </Button>

      {state?.success === false && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
