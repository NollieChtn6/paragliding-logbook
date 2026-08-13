"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useT } from "@/components/locale-provider";
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
import { cn } from "@/lib/utils";

type TrainingCampFormActionState = { success: true } | { success: false; error: string };

type TrainingCampFormDefaultValues = {
  startDate?: Date;
  endDate?: Date;
  schoolId?: string;
  trainingCampTypeId?: string;
  observations?: string;
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
  submitLabel,
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
  const t = useT();
  const tc = t.trainingCamps;

  function formatTrainingCampTypeOption(trainingCampType: TrainingCampTypeOption): string {
    return t.referenceLabels.trainingCampType[trainingCampType.code] ?? trainingCampType.code;
  }

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, type: "error" });
    }
  }, [state]);

  function handleWizardNext() {
    const form = formRef.current;
    if (!form) return;

    const errors = getFieldErrors(form, WIZARD_STEP_2_REQUIRED_FIELDS, t.common);
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
        startDate: tc.startDateAfterEndDateField,
      });
      return;
    }

    setFieldErrors({});
    onWizardNext?.();
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {!wizardStep && (
        <h2 className="text-lg font-medium tracking-tight text-foreground">{tc.detailsHeading}</h2>
      )}
      <div className={cn(wizardStep === 3 ? "hidden" : "flex flex-col gap-4")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">{tc.startDateLabel}</Label>
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
          <Label htmlFor="endDate">{tc.endDateLabel}</Label>
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
          <Label htmlFor="schoolId">{tc.schoolLabel}</Label>
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
                <SelectValue placeholder={tc.chooseSchool}>
                  {(value: string | null) =>
                    schools.find((school) => school.id === value)?.name ?? tc.chooseSchool
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
              <SelectClearButton onClear={() => setSchoolId("")} label={tc.clearSchool} />
            )}
          </div>
          {fieldErrors.schoolId && (
            <p className="text-sm text-destructive">{fieldErrors.schoolId}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="trainingCampTypeId">{tc.typeLabel}</Label>
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
                <SelectValue placeholder={tc.chooseType}>
                  {(value: string | null) => {
                    const trainingCampType = trainingCampTypes.find((tct) => tct.id === value);
                    return trainingCampType
                      ? formatTrainingCampTypeOption(trainingCampType)
                      : tc.chooseType;
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
              <SelectClearButton onClear={() => setTrainingCampTypeId("")} label={tc.clearType} />
            )}
          </div>
          {fieldErrors.trainingCampTypeId && (
            <p className="text-sm text-destructive">{fieldErrors.trainingCampTypeId}</p>
          )}
        </div>
      </div>

      {!wizardStep && (
        <h2 className="text-lg font-medium tracking-tight text-foreground">
          {tc.observationsHeading}
        </h2>
      )}
      <div className={cn(wizardStep === 2 ? "hidden" : "flex flex-col gap-4")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="observations">{tc.observationsLabel}</Label>
          <Textarea
            id="observations"
            name="observations"
            defaultValue={defaultValues?.observations}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="summary">{tc.summaryLabel}</Label>
          <Textarea id="summary" name="summary" defaultValue={defaultValues?.summary} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="certification">{tc.certificationLabel}</Label>
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
            {tc.previous}
          </Button>
          {/* key distinct sur les deux boutons : sans ça, passer de l'étape 2
          à 3 fait muter le même nœud DOM de type="button" à type="submit"
          au lieu d'en monter un nouveau — le clic en cours peut alors être
          traité par le navigateur comme un clic sur le bouton (désormais)
          submit et soumettre le formulaire immédiatement, avant toute saisie
          à l'étape 3. Aucun champ de l'étape 3 n'étant obligatoire ici (à la
          différence de FlightForm/GroundHandlingSessionForm, où le
          required bloquait cette soumission accidentelle via la validation
          native), le bug était pleinement visible sur ce formulaire. */}
          {wizardStep === 2 ? (
            <Button key="next" type="button" onClick={handleWizardNext}>
              {tc.next}
            </Button>
          ) : (
            <Button key="submit" type="submit" disabled={isPending}>
              {isPending ? t.common.saving : (submitLabel ?? tc.createCamp)}
            </Button>
          )}
        </div>
      ) : (
        <Button type="submit" className="mt-2" disabled={isPending}>
          {isPending ? t.common.saving : (submitLabel ?? tc.createCamp)}
        </Button>
      )}

      {state?.success === false && (
        <p role="alert" className="text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
