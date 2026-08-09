"use client";

import { useActionState, useEffect } from "react";
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
import { FLIGHT_TYPE_LABELS } from "@/lib/reference-labels";
import { SitePointCombobox, type SitePointOption } from "./site-point-combobox";

type TrainingCampOption = {
  id: string;
  campType: string;
  startDate: Date;
  endDate: Date;
  school: { name: string };
};

type FlightTypeOption = { id: string; code: string };

type FlightFormActionState = { success: true } | { success: false; error: string };

type FlightFormDefaultValues = {
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
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR");
}

function formatTrainingCampOption(trainingCamp: TrainingCampOption): string {
  return `${trainingCamp.campType} — ${trainingCamp.school.name} (${formatDate(trainingCamp.startDate)} → ${formatDate(trainingCamp.endDate)})`;
}

// Repli sur le code brut si un code existe en base sans entrée dans le
// dictionnaire (docs/decisions/003-reference-table-codes.md) : ne doit pas
// arriver en pratique (ces tables ne sont pas éditables en dehors du seed),
// mais reste lisible plutôt que silencieusement vide.
function formatFlightTypeOption(flightType: FlightTypeOption): string {
  return FLIGHT_TYPE_LABELS[flightType.code] ?? flightType.code;
}

// Format attendu par <Input type="date">. Cohérent avec la lecture : le
// schéma Zod (flightSchema) parse "YYYY-MM-DD" en UTC minuit via
// z.coerce.date(), donc toISOString().slice(0, 10) restitue exactement la
// même date, indépendamment du fuseau du navigateur.
function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
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
}: FlightFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, type: "error" });
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={defaultValues?.date ? toDateInputValue(defaultValues.date) : undefined}
          required
        />
      </div>

      <SitePointCombobox
        type="TAKEOFF"
        name="takeoffPointId"
        label="Décollage"
        placeholder="Rechercher un décollage..."
        defaultPoint={defaultTakeoffPoint}
      />

      <SitePointCombobox
        type="LANDING"
        name="landingPointId"
        label="Atterrissage"
        placeholder="Rechercher un atterrissage..."
        defaultPoint={defaultLandingPoint}
      />

      {trainingCamps.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="trainingCampId">Stage associé (optionnel)</Label>
          <Select name="trainingCampId" defaultValue={defaultValues?.trainingCampId ?? ""}>
            <SelectTrigger id="trainingCampId" className="w-full">
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
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="flightTypeId">Type de vol</Label>
        <Select name="flightTypeId" defaultValue={defaultValues?.flightTypeId} required>
          <SelectTrigger id="flightTypeId" className="w-full">
            <SelectValue placeholder="Choisir un type de vol">
              {(value: string | null) => {
                const flightType = flightTypes.find((ft) => ft.id === value);
                return flightType ? formatFlightTypeOption(flightType) : "Choisir un type de vol";
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
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="observations">Observations</Label>
        <Textarea
          id="observations"
          name="observations"
          defaultValue={defaultValues?.observations}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="improvementPoints">Points d&apos;amélioration</Label>
        <Textarea
          id="improvementPoints"
          name="improvementPoints"
          defaultValue={defaultValues?.improvementPoints}
          required
        />
      </div>

      <Button type="submit" className="mt-2" disabled={isPending}>
        {isPending ? "Enregistrement..." : submitLabel}
      </Button>

      {state?.success === false && <p className="text-destructive">{state.error}</p>}
    </form>
  );
}
