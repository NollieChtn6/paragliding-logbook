"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
import { getFieldErrors } from "@/lib/form-validation";

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

// condition/status ont toujours une valeur (state contrôlé avec défaut, pas
// de placeholder vide) : pas besoin de les inclure ici. size est optionnel,
// initialUsageMin n'a pas l'attribut required (voir plus bas).
const REQUIRED_FIELDS = ["equipmentTypeId", "brand", "model", "purchaseDate"];

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
  const formRef = useRef<HTMLFormElement>(null);
  // Erreurs de validation affichées en ligne sous chaque champ : voir
  // flight-form.tsx/training-camp-form.tsx pour la justification (toasts
  // réservés à la soumission/succès).
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
  // "Taille" recouvre trois formats différents selon la catégorie (voir
  // lib/validations/equipment.ts) : surface en m² pour une voile, S/M/L pour
  // une sellette, plage de poids pour un secours. Le champ reste un texte
  // libre unique (pas de sous-schéma par catégorie), mais le libellé/
  // placeholder s'adapte pour lever l'ambiguïté au moment de la saisie.
  const equipmentTypeCode = equipmentTypes.find((option) => option.id === equipmentTypeId)?.code;

  function sizeLabel(typeCode: string | undefined): string {
    if (typeCode === "WING") return te.sizeLabelWing;
    if (typeCode === "HARNESS") return te.sizeLabelHarness;
    if (typeCode === "RESERVE") return te.sizeLabelReserve;
    return te.sizeLabel;
  }

  function sizePlaceholder(typeCode: string | undefined): string | undefined {
    if (typeCode === "WING") return te.sizePlaceholderWing;
    if (typeCode === "HARNESS") return te.sizePlaceholderHarness;
    if (typeCode === "RESERVE") return te.sizePlaceholderReserve;
    return undefined;
  }

  function formatEquipmentTypeOption(equipmentType: EquipmentTypeOption): string {
    return t.referenceLabels.equipmentType[equipmentType.code] ?? equipmentType.code;
  }

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, description: t.common.retryReassurance, type: "error" });
    }
  }, [state, t]);

  // Voir flight-form.tsx pour le détail du raisonnement (bulle de validation
  // navigateur non localisée sans noValidate + handleSubmit).
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const errors = getFieldErrors(event.currentTarget, REQUIRED_FIELDS, t.common);
    if (Object.keys(errors).length > 0) {
      event.preventDefault();
      setFieldErrors(errors);
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6"
    >
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-sm font-medium text-muted-foreground">
          {te.identificationSectionLabel}
        </legend>

        <div className="flex flex-col gap-2">
          <Label htmlFor="equipmentTypeId">{te.typeLabel}</Label>
          <Select
            name="equipmentTypeId"
            value={equipmentTypeId}
            onValueChange={(value) => setEquipmentTypeId(value ?? "")}
            required
          >
            <SelectTrigger
              id="equipmentTypeId"
              className="w-full"
              aria-invalid={!!fieldErrors.equipmentTypeId}
            >
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
          {fieldErrors.equipmentTypeId && (
            <p className="text-sm text-destructive">{fieldErrors.equipmentTypeId}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="brand">{te.brandLabel}</Label>
          <Input
            id="brand"
            name="brand"
            defaultValue={defaultValues?.brand}
            required
            aria-invalid={!!fieldErrors.brand}
          />
          {fieldErrors.brand && <p className="text-sm text-destructive">{fieldErrors.brand}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="model">{te.modelLabel}</Label>
          <Input
            id="model"
            name="model"
            defaultValue={defaultValues?.model}
            required
            aria-invalid={!!fieldErrors.model}
          />
          {fieldErrors.model && <p className="text-sm text-destructive">{fieldErrors.model}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="size">{sizeLabel(equipmentTypeCode)}</Label>
          <Input
            id="size"
            name="size"
            placeholder={sizePlaceholder(equipmentTypeCode)}
            defaultValue={defaultValues?.size}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-sm font-medium text-muted-foreground">
          {te.historySectionLabel}
        </legend>

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
            aria-invalid={!!fieldErrors.purchaseDate}
          />
          {fieldErrors.purchaseDate && (
            <p className="text-sm text-destructive">{fieldErrors.purchaseDate}</p>
          )}
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

        {/* aria-live sur le conteneur (jamais démonté) plutôt que sur le champ
            lui-même : un lecteur d'écran doit être notifié quand ce champ
            apparaît/disparaît suite au choix de "condition" ci-dessus, pas
            seulement voir un div supplémentaire surgir silencieusement. */}
        <div aria-live="polite">
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
        </div>

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
      </fieldset>

      <Button type="submit" disabled={isPending}>
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
