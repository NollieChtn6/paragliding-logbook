"use client";

import { useActionState, useEffect, useRef } from "react";
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
import { TRAINING_CAMP_TYPE_LABELS } from "@/lib/reference-labels";

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

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, type: "error" });
    }
  }, [state]);

  function handleWizardNext() {
    if (formRef.current?.reportValidity()) {
      onWizardNext?.();
    }
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {!wizardStep && (
        <h2 className="text-lg font-medium tracking-tight text-foreground">Détails</h2>
      )}
      <div hidden={wizardStep === 3} className="flex flex-col gap-4">
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
          />
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
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="schoolId">École</Label>
          <Select name="schoolId" defaultValue={defaultValues?.schoolId} required>
            <SelectTrigger id="schoolId" className="w-full">
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
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="trainingCampTypeId">Type de stage</Label>
          <Select
            name="trainingCampTypeId"
            defaultValue={defaultValues?.trainingCampTypeId}
            required
          >
            <SelectTrigger id="trainingCampTypeId" className="w-full">
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
        </div>
      </div>

      {!wizardStep && (
        <h2 className="text-lg font-medium tracking-tight text-foreground">Observations</h2>
      )}
      <div hidden={wizardStep === 2} className="flex flex-col gap-4">
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
