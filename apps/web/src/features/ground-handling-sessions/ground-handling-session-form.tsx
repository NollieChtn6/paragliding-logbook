"use client";

import type * as React from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useLocale, useT } from "@/components/locale-provider";
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
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { SpotCombobox, type SpotOption } from "./spot-combobox";

type TrainingCampOption = {
  id: string;
  trainingCampType: { code: string };
  startDate: Date;
  endDate: Date;
  school: { name: string };
};

type GroundHandlingSessionFormActionState = { success: true } | { success: false; error: string };

type GroundHandlingSessionFormDefaultValues = {
  // Porte aussi l'heure (voir toTimeInputValue ci-dessous) : pas de champ
  // "time" séparé ici, un seul Date sert à préremplir les deux <Input>.
  date?: Date;
  trainingCampId?: string;
  durationMin?: number;
  exercises?: string;
  difficulties?: string;
  feeling?: string;
};

type GroundHandlingSessionFormProps = {
  trainingCamps?: TrainingCampOption[];
  action: (
    prevState: GroundHandlingSessionFormActionState | null,
    formData: FormData,
  ) => Promise<GroundHandlingSessionFormActionState>;
  defaultValues?: GroundHandlingSessionFormDefaultValues;
  // Spot déjà sélectionné en mode édition, distinct de defaultValues (comme
  // defaultTakeoffPoint/defaultLandingPoint sur FlightForm) : SpotCombobox
  // ne reçoit jamais la liste complète des spots, seulement celui-ci.
  defaultSpot?: SpotOption;
  submitLabel?: string;
  // Mode assistant en 3 étapes : voir flight-form.tsx pour le détail.
  wizardStep?: 2 | 3;
  onWizardBack?: () => void;
  onWizardNext?: () => void;
};

const WIZARD_STEP_2_REQUIRED_FIELDS = ["date", "time", "spotId", "durationMin"];
const WIZARD_STEP_3_REQUIRED_FIELDS = ["exercises"];

// Format attendu par <Input type="date">/<Input type="time">, voir
// flight-form.tsx.
function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toTimeInputValue(date: Date): string {
  return date.toISOString().slice(11, 16);
}

// Même principe que FlightForm/TrainingCampForm : utilisé en création
// (/activities/new) et en modification (/activities/[id]/edit), action et
// defaultValues varient selon l'appelant. Les actions redirigent en cas de
// succès, pas d'état "succès" à afficher ici.
export function GroundHandlingSessionForm({
  trainingCamps = [],
  action,
  defaultValues,
  defaultSpot,
  submitLabel,
  wizardStep,
  onWizardBack,
  onWizardNext,
}: GroundHandlingSessionFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  // Select contrôlé : voir flight-form.tsx pour la justification (bouton
  // croix de réinitialisation).
  const [trainingCampId, setTrainingCampId] = useState(defaultValues?.trainingCampId ?? "");
  // Erreurs de validation affichées en ligne sous chaque champ : voir
  // flight-form.tsx pour la justification (toasts réservés à la
  // soumission/succès).
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [locale] = useLocale();
  const t = useT();
  const tg = t.groundHandlingSessions;

  function formatTrainingCampOption(trainingCamp: TrainingCampOption): string {
    const typeLabel =
      t.referenceLabels.trainingCampType[trainingCamp.trainingCampType.code] ??
      trainingCamp.trainingCampType.code;
    return `${typeLabel} — ${trainingCamp.school.name} (${formatDate(trainingCamp.startDate, locale)} → ${formatDate(trainingCamp.endDate, locale)})`;
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

    // Règle métier docs/domain-model.md (Stage) : une séance rattachée à un
    // stage doit avoir une date dans l'intervalle du stage — voir
    // flight-form.tsx pour le détail du raisonnement (revérifiée côté
    // serveur, mais bloquée ici dès l'étape 2 plutôt qu'à la soumission
    // finale).
    if (trainingCampId) {
      const selectedCamp = trainingCamps.find((tc) => tc.id === trainingCampId);
      const dateInput = form.elements.namedItem("date");
      const dateValue = dateInput instanceof HTMLInputElement ? dateInput.value : undefined;
      if (selectedCamp && dateValue) {
        const sessionDate = new Date(dateValue);
        if (sessionDate < selectedCamp.startDate || sessionDate > selectedCamp.endDate) {
          setFieldErrors({
            date: tg.dateOutsideTrainingCampField,
          });
          return;
        }
      }
    }

    setFieldErrors({});
    onWizardNext?.();
  }

  // Voir flight-form.tsx : même traitement à la soumission finale (étape 3)
  // pour exercises, sans effet en dehors du mode assistant.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!wizardStep) return;
    const errors = getFieldErrors(event.currentTarget, WIZARD_STEP_3_REQUIRED_FIELDS, t.common);
    if (Object.keys(errors).length > 0) {
      event.preventDefault();
      setFieldErrors(errors);
    }
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!wizardStep && (
        <h2 className="text-lg font-medium tracking-tight text-foreground">{tg.detailsHeading}</h2>
      )}
      <div className={cn(wizardStep === 3 ? "hidden" : "flex flex-col gap-4")}>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="date">{tg.dateLabel}</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={defaultValues?.date ? toDateInputValue(defaultValues.date) : undefined}
              required
              aria-invalid={!!fieldErrors.date}
            />
            {fieldErrors.date && <p className="text-sm text-destructive">{fieldErrors.date}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="time">{tg.timeLabel}</Label>
            <Input
              id="time"
              name="time"
              type="time"
              defaultValue={defaultValues?.date ? toTimeInputValue(defaultValues.date) : undefined}
              required
              aria-invalid={!!fieldErrors.time}
            />
            {fieldErrors.time && <p className="text-sm text-destructive">{fieldErrors.time}</p>}
          </div>
        </div>

        <SpotCombobox name="spotId" defaultSpot={defaultSpot} error={fieldErrors.spotId} />

        {trainingCamps.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="trainingCampId">{tg.trainingCampLabel}</Label>
            <div className="flex items-center gap-1.5">
              <Select
                name="trainingCampId"
                value={trainingCampId}
                onValueChange={(value) => setTrainingCampId(value ?? "")}
              >
                <SelectTrigger id="trainingCampId" className="w-full flex-1">
                  <SelectValue placeholder={tg.none}>
                    {(value: string) => {
                      const trainingCamp = trainingCamps.find((tc) => tc.id === value);
                      return trainingCamp ? formatTrainingCampOption(trainingCamp) : tg.none;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{tg.none}</SelectItem>
                  {trainingCamps.map((trainingCamp) => (
                    <SelectItem key={trainingCamp.id} value={trainingCamp.id}>
                      {/* whitespace-normal : voir flight-form.tsx, même
                      correctif pour la même liste de stages. */}
                      <span className="whitespace-normal">
                        {formatTrainingCampOption(trainingCamp)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {trainingCampId && (
                <SelectClearButton
                  onClear={() => setTrainingCampId("")}
                  label={tg.clearTrainingCamp}
                />
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="durationMin">{tg.durationLabel}</Label>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            min={1}
            defaultValue={defaultValues?.durationMin}
            required
            aria-invalid={!!fieldErrors.durationMin}
          />
          {fieldErrors.durationMin && (
            <p className="text-sm text-destructive">{fieldErrors.durationMin}</p>
          )}
        </div>
      </div>

      {!wizardStep && (
        <h2 className="text-lg font-medium tracking-tight text-foreground">
          {tg.observationsHeading}
        </h2>
      )}
      <div className={cn(wizardStep === 2 ? "hidden" : "flex flex-col gap-4")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="exercises">{tg.exercisesLabel}</Label>
          <Textarea
            id="exercises"
            name="exercises"
            defaultValue={defaultValues?.exercises}
            required={wizardStep !== 2}
            aria-invalid={!!fieldErrors.exercises}
          />
          {fieldErrors.exercises && (
            <p className="text-sm text-destructive">{fieldErrors.exercises}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="difficulties">{tg.difficultiesLabel}</Label>
          <Textarea
            id="difficulties"
            name="difficulties"
            defaultValue={defaultValues?.difficulties}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="feeling">{tg.feelingLabel}</Label>
          <Textarea id="feeling" name="feeling" defaultValue={defaultValues?.feeling} />
        </div>
      </div>

      {wizardStep ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <Button type="button" variant="outline" onClick={onWizardBack}>
            {tg.previous}
          </Button>
          {/* key distinct sur les deux boutons : sans ça, passer de l'étape 2
          à 3 fait muter le même nœud DOM de type="button" à type="submit"
          au lieu d'en monter un nouveau, et le clic en cours peut être
          traité par le navigateur comme un clic sur le bouton (désormais)
          submit — soumission accidentelle avant toute saisie à l'étape 3.
          Masqué ici par le required sur exercises (bloque la soumission via
          la validation native), mais bien réel — même bug plus visible sur
          TrainingCampForm, où aucun champ n'est requis. */}
          {wizardStep === 2 ? (
            <Button key="next" type="button" onClick={handleWizardNext}>
              {tg.next}
            </Button>
          ) : (
            <Button key="submit" type="submit" disabled={isPending}>
              {isPending ? t.common.saving : (submitLabel ?? tg.createSession)}
            </Button>
          )}
        </div>
      ) : (
        <Button type="submit" className="mt-2" disabled={isPending}>
          {isPending ? t.common.saving : (submitLabel ?? tg.createSession)}
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
