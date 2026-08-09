"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { SelectClearButton } from "@/components/select-clear-button";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { getFieldErrors } from "@/lib/form-validation";
import { TRAINING_CAMP_TYPE_LABELS } from "@/lib/reference-labels";
import { cn } from "@/lib/utils";

type TrainingCampFormActionState = { success: true } | { success: false; error: string };

type TrainingCampFormDefaultValues = {
  startDate?: Date;
  endDate?: Date;
  schoolId?: string;
  trainingCampTypeId?: string;
  summary?: string;
  certification?: string;
};

type TrainingCampTypeOption = { id: string; code: string };

type TrainingCampFormProps = {
  schools: { id: string; name: string }[];
  trainingCampTypes: TrainingCampTypeOption[];
  action: (
    prevState: TrainingCampFormActionState | null,
    formData: FormData,
  ) => Promise<TrainingCampFormActionState>;
  defaultValues?: TrainingCampFormDefaultValues;
  submitLabel?: string;
  // Mode assistant en 3 étapes : voir flight-form.tsx pour le détail.
  wizardStep?: 2 | 3;
  onWizardBack?: () => void;
  onWizardNext?: () => void;
};

const WIZARD_STEP_2_REQUIRED_FIELDS = ["startDate", "endDate", "schoolId", "trainingCampTypeId"];

function formatTrainingCampTypeOption(trainingCampType: TrainingCampTypeOption): string {
  return TRAINING_CAMP_TYPE_LABELS[trainingCampType.code] ?? trainingCampType.code;
}

// Format attendu par <Input type="date">, voir flight-form.tsx.
function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Même principe que FlightForm : utilisé en création (/activities/new) et en
// modification (/activities/[id]/edit), action et defaultValues varient
// selon l'appelant. Les actions redirigent en cas de succès, pas d'état
// "succès" à afficher ici.
export function TrainingCampForm({
  schools,
  trainingCampTypes,
  action,
  defaultValues,
  submitLabel = "Créer le stage",
  wizardStep,
  onWizardBack,
  onWizardNext,
}: TrainingCampFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  // Select contrôlé : voir flight-form.tsx pour la justification (bouton
  // croix de réinitialisation).
  const [schoolId, setSchoolId] = useState(defaultValues?.schoolId ?? "");
  const [trainingCampTypeId, setTrainingCampTypeId] = useState(
    defaultValues?.trainingCampTypeId ?? "",
  );
  // Erreurs de validation affichées en ligne sous chaque champ : voir
  // flight-form.tsx pour la justification (toasts réservés à la
  // soumission/succès).
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, type: "error" });
    }
  }, [state]);

  function handleWizardNext() {
    const form = formRef.current;
    if (!form) return;

    const errors = getFieldErrors(form, WIZARD_STEP_2_REQUIRED_FIELDS);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Règle métier docs/domain-model.md (Stage) : startDate <= endDate — voir
    // lib/validations/training-camp.ts (même message), pas exprimable par
    // une contrainte HTML statique puisqu'elle compare deux champs entre
    // eux. Vérifiée ici pour bloquer le passage à l'étape 3.
    const startDateInput = form.elements.namedItem("startDate");
    const endDateInput = form.elements.namedItem("endDate");
    const startDateValue =
      startDateInput instanceof HTMLInputElement ? startDateInput.value : undefined;
    const endDateValue = endDateInput instanceof HTMLInputElement ? endDateInput.value : undefined;
    if (startDateValue && endDateValue && new Date(startDateValue) > new Date(endDateValue)) {
      setFieldErrors({
        startDate: "Doit être antérieure ou égale à la date de fin.",
      });
      return;
    }

    setFieldErrors({});
    onWizardNext?.();
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {!wizardStep && (
        <h2 className="text-lg font-medium tracking-tight text-foreground">Détails</h2>
      )}
      <div className={cn(wizardStep === 3 ? "hidden" : "flex flex-col gap-4")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">Date de début</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={
              defaultValues?.startDate ? toDateInputValue(defaultValues.startDate) : undefined
            }
            required
            aria-invalid={!!fieldErrors.startDate}
          />
          {fieldErrors.startDate && (
            <p className="text-sm text-destructive">{fieldErrors.startDate}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="endDate">Date de fin</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={
              defaultValues?.endDate ? toDateInputValue(defaultValues.endDate) : undefined
            }
            required
            aria-invalid={!!fieldErrors.endDate}
          />
          {fieldErrors.endDate && <p className="text-sm text-destructive">{fieldErrors.endDate}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="schoolId">École</Label>
          <div className="flex items-center gap-1.5">
            <Select
              name="schoolId"
              value={schoolId}
              onValueChange={(value) => setSchoolId(value ?? "")}
              required
            >
              <SelectTrigger
                id="schoolId"
                className="w-full flex-1"
                aria-invalid={!!fieldErrors.schoolId}
              >
                <SelectValue placeholder="Choisir une école">
                  {(value: string | null) =>
                    schools.find((school) => school.id === value)?.name ?? "Choisir une école"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {schoolId && (
              <SelectClearButton onClear={() => setSchoolId("")} label="Effacer l'école" />
            )}
          </div>
          {fieldErrors.schoolId && (
            <p className="text-sm text-destructive">{fieldErrors.schoolId}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="trainingCampTypeId">Type de stage</Label>
          <div className="flex items-center gap-1.5">
            <Select
              name="trainingCampTypeId"
              value={trainingCampTypeId}
              onValueChange={(value) => setTrainingCampTypeId(value ?? "")}
              required
            >
              <SelectTrigger
                id="trainingCampTypeId"
                className="w-full flex-1"
                aria-invalid={!!fieldErrors.trainingCampTypeId}
              >
                <SelectValue placeholder="Choisir un type de stage">
                  {(value: string | null) => {
                    const trainingCampType = trainingCampTypes.find((tct) => tct.id === value);
                    return trainingCampType
                      ? formatTrainingCampTypeOption(trainingCampType)
                      : "Choisir un type de stage";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {trainingCampTypes.map((trainingCampType) => (
                  <SelectItem key={trainingCampType.id} value={trainingCampType.id}>
                    {formatTrainingCampTypeOption(trainingCampType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {trainingCampTypeId && (
              <SelectClearButton
                onClear={() => setTrainingCampTypeId("")}
                label="Effacer le type de stage"
              />
            )}
          </div>
          {fieldErrors.trainingCampTypeId && (
            <p className="text-sm text-destructive">{fieldErrors.trainingCampTypeId}</p>
          )}
        </div>
      </div>

      {!wizardStep && (
        <h2 className="text-lg font-medium tracking-tight text-foreground">Observations</h2>
      )}
      <div className={cn(wizardStep === 2 ? "hidden" : "flex flex-col gap-4")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="summary">Bilan</Label>
          <Textarea id="summary" name="summary" defaultValue={defaultValues?.summary} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="certification">Certification</Label>
          <Input
            id="certification"
            name="certification"
            defaultValue={defaultValues?.certification}
          />
        </div>
      </div>

      {wizardStep ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <Button type="button" variant="outline" onClick={onWizardBack}>
            Précédent
          </Button>
          {wizardStep === 2 ? (
            <Button type="button" onClick={handleWizardNext}>
              Suivant
            </Button>
          ) : (
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : submitLabel}
            </Button>
          )}
        </div>
      ) : (
        <Button type="submit" className="mt-2" disabled={isPending}>
          {isPending ? "Enregistrement..." : submitLabel}
        </Button>
      )}

      {state?.success === false && <p className="text-destructive">{state.error}</p>}
    </form>
  );
}
