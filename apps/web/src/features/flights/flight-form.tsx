"use client";

import { useActionState } from "react";
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

// Dupliqué depuis l'enum Prisma FlightType plutôt qu'importé, pour ne pas
// tirer @prisma/client dans le bundle client pour un simple select.
const FLIGHT_TYPES = ["LOCAL", "CROSS", "SOARING", "THERMAL", "TRAINING", "OTHER"] as const;

type TrainingCampOption = {
  id: string;
  campType: string;
  startDate: Date;
  endDate: Date;
  school: { name: string };
};

type FlightFormActionState = { success: true } | { success: false; error: string };

type FlightFormDefaultValues = {
  date?: Date;
  siteId?: string;
  trainingCampId?: string;
  takeoffAltitudeM?: number;
  landingAltitudeM?: number;
  durationMin?: number;
  flightType?: (typeof FLIGHT_TYPES)[number];
  observations?: string;
  improvementPoints?: string;
};

type FlightFormProps = {
  sites: { id: string; name: string }[];
  trainingCamps?: TrainingCampOption[];
  action: (
    prevState: FlightFormActionState | null,
    formData: FormData,
  ) => Promise<FlightFormActionState>;
  defaultValues?: FlightFormDefaultValues;
  submitLabel?: string;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR");
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
  sites,
  trainingCamps = [],
  action,
  defaultValues,
  submitLabel = "Créer le vol",
}: FlightFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={defaultValues?.date ? toDateInputValue(defaultValues.date) : undefined}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="siteId">Site</Label>
        <Select name="siteId" defaultValue={defaultValues?.siteId} required>
          <SelectTrigger id="siteId" className="w-full">
            <SelectValue placeholder="Choisir un site" />
          </SelectTrigger>
          <SelectContent>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {trainingCamps.length > 0 && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="trainingCampId">Stage associé (optionnel)</Label>
          <Select name="trainingCampId" defaultValue={defaultValues?.trainingCampId ?? ""}>
            <SelectTrigger id="trainingCampId" className="w-full">
              <SelectValue placeholder="Aucun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun</SelectItem>
              {trainingCamps.map((trainingCamp) => (
                <SelectItem key={trainingCamp.id} value={trainingCamp.id}>
                  {trainingCamp.campType} — {trainingCamp.school.name} (
                  {formatDate(trainingCamp.startDate)} → {formatDate(trainingCamp.endDate)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="takeoffAltitudeM">Altitude décollage (m)</Label>
        <Input
          id="takeoffAltitudeM"
          name="takeoffAltitudeM"
          type="number"
          defaultValue={defaultValues?.takeoffAltitudeM}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="landingAltitudeM">Altitude atterrissage (m)</Label>
        <Input
          id="landingAltitudeM"
          name="landingAltitudeM"
          type="number"
          defaultValue={defaultValues?.landingAltitudeM}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
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

      <div className="flex flex-col gap-1">
        <Label htmlFor="flightType">Type de vol</Label>
        <Select name="flightType" defaultValue={defaultValues?.flightType} required>
          <SelectTrigger id="flightType" className="w-full">
            <SelectValue placeholder="Choisir un type de vol" />
          </SelectTrigger>
          <SelectContent>
            {FLIGHT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="observations">Observations</Label>
        <Textarea
          id="observations"
          name="observations"
          defaultValue={defaultValues?.observations}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="improvementPoints">Points d&apos;amélioration</Label>
        <Textarea
          id="improvementPoints"
          name="improvementPoints"
          defaultValue={defaultValues?.improvementPoints}
          required
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : submitLabel}
      </Button>

      {state?.success === false && <p className="text-red-600">{state.error}</p>}
    </form>
  );
}
