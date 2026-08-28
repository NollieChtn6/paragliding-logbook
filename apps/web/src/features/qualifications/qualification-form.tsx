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

type QualificationFormActionState = { success: true } | { success: false; error: string };

type QualificationFormDefaultValues = {
  qualificationTypeId?: string;
  obtainedDate?: Date;
  schoolId?: string;
  trainingCampId?: string;
  notes?: string;
};

type QualificationTypeOption = { id: string; code: string };
type TrainingCampOption = { id: string; label: string };

// Seuls les deux champs obligatoires : voir lib/validations/qualification.ts
// (schoolId/trainingCampId/notes optionnels).
const REQUIRED_FIELDS = ["qualificationTypeId", "obtainedDate"];

type QualificationFormProps = {
  qualificationTypes: QualificationTypeOption[];
  schools: { id: string; name: string }[];
  trainingCamps: TrainingCampOption[];
  action: (
    prevState: QualificationFormActionState | null,
    formData: FormData,
  ) => Promise<QualificationFormActionState>;
  defaultValues?: QualificationFormDefaultValues;
  submitLabel?: string;
};

// Format attendu par <Input type="date">, même principe que
// training-camp-form.tsx/flight-form.tsx.
function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Même comparaison (chaîne de jour ISO) que le refine côté serveur
// (qualificationSchema, lib/validations/qualification.ts) : bloque la
// sélection d'une date future directement dans le sélecteur natif du
// navigateur, sans attendre un aller-retour serveur pour le signaler
// (critique /impeccable, P1).
function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

// Formulaire simple (pas d'assistant multi-étapes, à la différence de
// FlightForm/TrainingCampForm) : peu de champs, tous visibles d'un coup, même
// principe que SchoolForm/SiteForm. Utilisé en création (/qualifications/new)
// et en modification (/qualifications/[id]/edit).
export function QualificationForm({
  qualificationTypes,
  schools,
  trainingCamps,
  action,
  defaultValues,
  submitLabel,
}: QualificationFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  // Select contrôlé : voir training-camp-form.tsx pour la justification
  // (bouton croix de réinitialisation).
  const [qualificationTypeId, setQualificationTypeId] = useState(
    defaultValues?.qualificationTypeId ?? "",
  );
  const [schoolId, setSchoolId] = useState(defaultValues?.schoolId ?? "");
  const [trainingCampId, setTrainingCampId] = useState(defaultValues?.trainingCampId ?? "");
  // Erreurs de validation affichées en ligne sous chaque champ : voir
  // flight-form.tsx/training-camp-form.tsx pour la justification (toasts
  // réservés à la soumission/succès).
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const t = useT();
  const tq = t.qualifications;

  function formatQualificationTypeOption(qualificationType: QualificationTypeOption): string {
    return t.referenceLabels.qualificationType[qualificationType.code] ?? qualificationType.code;
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
          {tq.qualificationSectionLabel}
        </legend>

        <div className="flex flex-col gap-2">
          <Label htmlFor="qualificationTypeId">{tq.typeLabel}</Label>
          <Select
            name="qualificationTypeId"
            value={qualificationTypeId}
            onValueChange={(value) => setQualificationTypeId(value ?? "")}
            required
          >
            <SelectTrigger
              id="qualificationTypeId"
              className="w-full"
              aria-invalid={!!fieldErrors.qualificationTypeId}
            >
              <SelectValue placeholder={tq.chooseType}>
                {(value: string | null) => {
                  const qualificationType = qualificationTypes.find((qt) => qt.id === value);
                  return qualificationType
                    ? formatQualificationTypeOption(qualificationType)
                    : tq.chooseType;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {qualificationTypes.map((qualificationType) => (
                <SelectItem key={qualificationType.id} value={qualificationType.id}>
                  {formatQualificationTypeOption(qualificationType)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.qualificationTypeId && (
            <p className="text-sm text-destructive">{fieldErrors.qualificationTypeId}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="obtainedDate">{tq.obtainedDateLabel}</Label>
          <Input
            id="obtainedDate"
            name="obtainedDate"
            type="date"
            defaultValue={
              defaultValues?.obtainedDate ? toDateInputValue(defaultValues.obtainedDate) : undefined
            }
            max={todayInputValue()}
            required
            aria-invalid={!!fieldErrors.obtainedDate}
          />
          {fieldErrors.obtainedDate && (
            <p className="text-sm text-destructive">{fieldErrors.obtainedDate}</p>
          )}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-sm font-medium text-muted-foreground">
          {tq.contextSectionLabel}
        </legend>

        <div className="flex flex-col gap-2">
          <Label htmlFor="schoolId">{tq.schoolLabel}</Label>
          <div className="flex items-center gap-1.5">
            <Select
              name="schoolId"
              value={schoolId}
              onValueChange={(value) => setSchoolId(value ?? "")}
            >
              <SelectTrigger id="schoolId" className="w-full flex-1">
                <SelectValue placeholder={tq.chooseSchool}>
                  {(value: string | null) =>
                    schools.find((school) => school.id === value)?.name ?? tq.chooseSchool
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
              <SelectClearButton onClear={() => setSchoolId("")} label={tq.clearSchool} />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="trainingCampId">{tq.trainingCampLabel}</Label>
          <div className="flex items-center gap-1.5">
            <Select
              name="trainingCampId"
              value={trainingCampId}
              onValueChange={(value) => setTrainingCampId(value ?? "")}
            >
              <SelectTrigger id="trainingCampId" className="w-full flex-1">
                <SelectValue placeholder={tq.chooseTrainingCamp}>
                  {(value: string | null) =>
                    trainingCamps.find((trainingCamp) => trainingCamp.id === value)?.label ??
                    tq.chooseTrainingCamp
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {trainingCamps.map((trainingCamp) => (
                  <SelectItem key={trainingCamp.id} value={trainingCamp.id}>
                    {trainingCamp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {trainingCampId && (
              <SelectClearButton
                onClear={() => setTrainingCampId("")}
                label={tq.clearTrainingCamp}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">{tq.notesLabel}</Label>
          <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes} />
        </div>
      </fieldset>

      <Button type="submit" disabled={isPending}>
        {isPending ? t.common.saving : (submitLabel ?? tq.createQualification)}
      </Button>

      {state?.success === false && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
