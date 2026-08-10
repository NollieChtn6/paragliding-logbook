"use client";

import type * as React from "react";
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
import { FLIGHT_TYPE_LABELS, TRAINING_CAMP_TYPE_LABELS } from "@/lib/reference-labels";
import { cn } from "@/lib/utils";
import { SitePointCombobox, type SitePointOption } from "./site-point-combobox";

type TrainingCampOption = {
  id: string;
  trainingCampType: { code: string };
  startDate: Date;
  endDate: Date;
  school: { name: string };
};

type FlightTypeOption = { id: string; code: string };

type FlightFormActionState = { success: true } | { success: false; error: string };

type FlightFormDefaultValues = {
  // Porte aussi l'heure (voir toTimeInputValue ci-dessous) : pas de champ
  // "time" séparé ici, un seul Date sert à préremplir les deux <Input>.
  date?: Date;
  trainingCampId?: string;
  durationMin?: number;
  flightTypeId?: string;
  observations?: string;
  improvementPoints?: string;
};

type FlightFormProps = {
  flightTypes: FlightTypeOption[];
  trainingCamps?: TrainingCampOption[];
  action: (
    prevState: FlightFormActionState | null,
    formData: FormData,
  ) => Promise<FlightFormActionState>;
  defaultValues?: FlightFormDefaultValues;
  defaultTakeoffPoint?: SitePointOption;
  defaultLandingPoint?: SitePointOption;
  submitLabel?: string;
  // Mode assistant en 3 étapes (utilisé par /activities/new,
  // new-activity-form.tsx) : absent = comportement historique inchangé, un
  // seul écran (/flights/new, /activities/[id]/edit). Voir le commentaire
  // au-dessus du <form> ci-dessous pour le détail du fonctionnement.
  wizardStep?: 2 | 3;
  onWizardBack?: () => void;
  onWizardNext?: () => void;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR");
}

function formatTrainingCampOption(trainingCamp: TrainingCampOption): string {
  const typeLabel =
    TRAINING_CAMP_TYPE_LABELS[trainingCamp.trainingCampType.code] ??
    trainingCamp.trainingCampType.code;
  return `${typeLabel} — ${trainingCamp.school.name} (${formatDate(trainingCamp.startDate)} → ${formatDate(trainingCamp.endDate)})`;
}

// Repli sur le code brut si un code existe en base sans entrée dans le
// dictionnaire (docs/decisions/003-reference-table-codes.md) : ne doit pas
// arriver en pratique (ces tables ne sont pas éditables en dehors du seed),
// mais reste lisible plutôt que silencieusement vide.
function formatFlightTypeOption(flightType: FlightTypeOption): string {
  return FLIGHT_TYPE_LABELS[flightType.code] ?? flightType.code;
}

const WIZARD_STEP_2_REQUIRED_FIELDS = [
  "date",
  "time",
  "takeoffPointId",
  "landingPointId",
  "durationMin",
  "flightTypeId",
];
const WIZARD_STEP_3_REQUIRED_FIELDS = ["observations", "improvementPoints"];

// Format attendu par <Input type="date">/<Input type="time">. Cohérent avec
// la lecture : le schéma Zod (flightSchema) combine ces deux chaînes en un
// Date UTC littéral (pas de conversion de fuseau horaire), donc les relire
// via toISOString().slice(...) restitue exactement les mêmes chaînes,
// indépendamment du fuseau du navigateur.
function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toTimeInputValue(date: Date): string {
  return date.toISOString().slice(11, 16);
}

// Formulaire de vol partagé (shadcn/ui exclusivement, cf. CLAUDE.md), utilisé
// par /flights/new, /activities/new (création) et /activities/[id]/edit
// (modification) — action et defaultValues varient selon l'appelant.
// createFlightAction/updateFlightAction redirigent en cas de succès : il n'y
// a pas d'état "succès" à afficher ici.
export function FlightForm({
  flightTypes,
  trainingCamps = [],
  action,
  defaultValues,
  defaultTakeoffPoint,
  defaultLandingPoint,
  submitLabel = "Créer le vol",
  wizardStep,
  onWizardBack,
  onWizardNext,
}: FlightFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  // Select contrôlé (plutôt que defaultValue non contrôlé) : nécessaire pour
  // permettre au bouton croix (SelectClearButton) de réinitialiser la valeur
  // de l'extérieur du composant Select.
  const [trainingCampId, setTrainingCampId] = useState(defaultValues?.trainingCampId ?? "");
  const [flightTypeId, setFlightTypeId] = useState(defaultValues?.flightTypeId ?? "");
  // Erreurs de validation affichées en ligne sous chaque champ (mode
  // assistant uniquement) — les toasts restent réservés à la soumission
  // (state?.success === false ci-dessous) et au succès (redirection +
  // toast, voir actions/create-flight.ts).
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

    // Règle métier docs/domain-model.md (Stage) : un vol rattaché à un stage
    // doit avoir une date dans l'intervalle du stage — revérifiée côté
    // serveur (create-flight.service.ts/update-flight.service.ts), pas
    // exprimable par une contrainte HTML statique (dépend du stage choisi).
    // Vérifiée ici pour bloquer le passage à l'étape 3 au bon endroit (date
    // et stage associé sont des champs de l'étape 2).
    if (trainingCampId) {
      const selectedCamp = trainingCamps.find((tc) => tc.id === trainingCampId);
      const dateInput = form.elements.namedItem("date");
      const dateValue = dateInput instanceof HTMLInputElement ? dateInput.value : undefined;
      if (selectedCamp && dateValue) {
        const flightDate = new Date(dateValue);
        if (flightDate < selectedCamp.startDate || flightDate > selectedCamp.endDate) {
          setFieldErrors({
            date: "Doit être comprise dans l'intervalle du stage sélectionné (ou retirez le stage associé).",
          });
          return;
        }
      }
    }

    setFieldErrors({});
    onWizardNext?.();
  }

  // Applique le même traitement en ligne à la soumission finale (étape 3) :
  // sans ça, les champs Observations/Points d'amélioration retomberaient
  // sur la bulle de validation native du navigateur, incohérent avec
  // l'étape 2 ci-dessus. N'intercepte rien en dehors du mode assistant
  // (wizardStep absent : /flights/new, /activities/[id]/edit inchangés).
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!wizardStep) return;
    const errors = getFieldErrors(event.currentTarget, WIZARD_STEP_3_REQUIRED_FIELDS);
    if (Object.keys(errors).length > 0) {
      event.preventDefault();
      setFieldErrors(errors);
    }
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!wizardStep && (
        <h2 className="text-lg font-medium tracking-tight text-foreground">Détails</h2>
      )}
      <div className={cn(wizardStep === 3 ? "hidden" : "flex flex-col gap-4")}>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="date">Date</Label>
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
            <Label htmlFor="time">Heure</Label>
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

        <SitePointCombobox
          type="TAKEOFF"
          name="takeoffPointId"
          label="Décollage"
          placeholder="Rechercher un décollage..."
          defaultPoint={defaultTakeoffPoint}
          error={fieldErrors.takeoffPointId}
        />

        <SitePointCombobox
          type="LANDING"
          name="landingPointId"
          label="Atterrissage"
          placeholder="Rechercher un atterrissage..."
          defaultPoint={defaultLandingPoint}
          error={fieldErrors.landingPointId}
        />

        {trainingCamps.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="trainingCampId">Stage associé (optionnel)</Label>
            <div className="flex items-center gap-1.5">
              <Select
                name="trainingCampId"
                value={trainingCampId}
                onValueChange={(value) => setTrainingCampId(value ?? "")}
              >
                <SelectTrigger id="trainingCampId" className="w-full flex-1">
                  <SelectValue placeholder="Aucun">
                    {(value: string) => {
                      const trainingCamp = trainingCamps.find((tc) => tc.id === value);
                      return trainingCamp ? formatTrainingCampOption(trainingCamp) : "Aucun";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {trainingCamps.map((trainingCamp) => (
                    <SelectItem key={trainingCamp.id} value={trainingCamp.id}>
                      {formatTrainingCampOption(trainingCamp)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {trainingCampId && (
                <SelectClearButton
                  onClear={() => setTrainingCampId("")}
                  label="Effacer le stage associé"
                />
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="durationMin">Durée (min)</Label>
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="flightTypeId">Type de vol</Label>
          <div className="flex items-center gap-1.5">
            <Select
              name="flightTypeId"
              value={flightTypeId}
              onValueChange={(value) => setFlightTypeId(value ?? "")}
              required
            >
              <SelectTrigger
                id="flightTypeId"
                className="w-full flex-1"
                aria-invalid={!!fieldErrors.flightTypeId}
              >
                <SelectValue placeholder="Choisir un type de vol">
                  {(value: string | null) => {
                    const flightType = flightTypes.find((ft) => ft.id === value);
                    return flightType
                      ? formatFlightTypeOption(flightType)
                      : "Choisir un type de vol";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {flightTypes.map((flightType) => (
                  <SelectItem key={flightType.id} value={flightType.id}>
                    {formatFlightTypeOption(flightType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {flightTypeId && (
              <SelectClearButton
                onClear={() => setFlightTypeId("")}
                label="Effacer le type de vol"
              />
            )}
          </div>
          {fieldErrors.flightTypeId && (
            <p className="text-sm text-destructive">{fieldErrors.flightTypeId}</p>
          )}
        </div>
      </div>

      {!wizardStep && (
        <h2 className="text-lg font-medium tracking-tight text-foreground">Observations</h2>
      )}
      <div className={cn(wizardStep === 2 ? "hidden" : "flex flex-col gap-4")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="observations">Observations</Label>
          <Textarea
            id="observations"
            name="observations"
            defaultValue={defaultValues?.observations}
            required={wizardStep !== 2}
            aria-invalid={!!fieldErrors.observations}
          />
          {fieldErrors.observations && (
            <p className="text-sm text-destructive">{fieldErrors.observations}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="improvementPoints">Points d&apos;amélioration</Label>
          <Textarea
            id="improvementPoints"
            name="improvementPoints"
            defaultValue={defaultValues?.improvementPoints}
            required={wizardStep !== 2}
            aria-invalid={!!fieldErrors.improvementPoints}
          />
          {fieldErrors.improvementPoints && (
            <p className="text-sm text-destructive">{fieldErrors.improvementPoints}</p>
          )}
        </div>
      </div>

      {wizardStep ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <Button type="button" variant="outline" onClick={onWizardBack}>
            Précédent
          </Button>
          {/* key distinct sur les deux boutons : sans ça, passer de l'étape 2
          à 3 fait muter le même nœud DOM de type="button" à type="submit"
          au lieu d'en monter un nouveau, et le clic en cours peut être
          traité par le navigateur comme un clic sur le bouton (désormais)
          submit — soumission accidentelle avant toute saisie à l'étape 3.
          Masqué ici par le required sur les champs de l'étape 3 (bloque la
          soumission via la validation native), mais bien réel — même bug
          plus visible sur TrainingCampForm, où aucun champ n'est requis. */}
          {wizardStep === 2 ? (
            <Button key="next" type="button" onClick={handleWizardNext}>
              Suivant
            </Button>
          ) : (
            <Button key="submit" type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : submitLabel}
            </Button>
          )}
        </div>
      ) : (
        <Button type="submit" className="mt-2" disabled={isPending}>
          {isPending ? "Enregistrement..." : submitLabel}
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
