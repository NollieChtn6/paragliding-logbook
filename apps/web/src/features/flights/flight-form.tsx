"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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

type SitePointOption = {
  id: string;
  label: string;
  altitudeM: number;
  site: { id: string; name: string };
  sitePointType: { label: string };
};

type FlightFormActionState = { success: true } | { success: false; error: string };

type FlightFormDefaultValues = {
  date?: Date;
  departurePointId?: string;
  arrivalPointId?: string;
  trainingCampId?: string;
  durationMin?: number;
  flightType?: (typeof FLIGHT_TYPES)[number];
  observations?: string;
  improvementPoints?: string;
};

type FlightFormProps = {
  points: SitePointOption[];
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

function formatTrainingCampOption(trainingCamp: TrainingCampOption): string {
  return `${trainingCamp.campType} — ${trainingCamp.school.name} (${formatDate(trainingCamp.startDate)} → ${formatDate(trainingCamp.endDate)})`;
}

// Un point peut être choisi comme départ ou arrivée quel que soit son
// SitePointType habituel (un décollage peut être utilisé comme point
// d'arrivée d'un cross) : le libellé garde le type à titre indicatif, sans
// filtrer la liste.
function formatSitePointOption(point: SitePointOption): string {
  return `${point.site.name} — ${point.label} (${point.sitePointType.label}, ${point.altitudeM} m)`;
}

// Libellé d'un point à l'intérieur de son groupe (le nom du site est déjà le
// SelectLabel du groupe, pas besoin de le répéter).
function formatSitePointItemLabel(point: SitePointOption): string {
  return `${point.label} (${point.sitePointType.label}, ${point.altitudeM} m)`;
}

type SitePointGroup = { site: { id: string; name: string }; points: SitePointOption[] };

// Regroupe les points par site : la liste de choix devient plus lisible que
// des libellés plats répétant le nom du site (préféré à un double sélecteur
// Site puis Point — voir la discussion, pas justifié tant que peu de sites
// existent, cf. docs/todo.md "Créer la gestion des sites de vol").
function groupPointsBySite(points: SitePointOption[]): SitePointGroup[] {
  const groups = new Map<string, SitePointGroup>();
  for (const point of points) {
    const group = groups.get(point.site.id);
    if (group) {
      group.points.push(point);
    } else {
      groups.set(point.site.id, { site: point.site, points: [point] });
    }
  }
  return [...groups.values()];
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
  points,
  trainingCamps = [],
  action,
  defaultValues,
  submitLabel = "Créer le vol",
}: FlightFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const pointGroups = groupPointsBySite(points);

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

      <div className="flex flex-col gap-2">
        <Label htmlFor="departurePointId">Point de départ</Label>
        <Select name="departurePointId" defaultValue={defaultValues?.departurePointId} required>
          <SelectTrigger id="departurePointId" className="w-full">
            <SelectValue placeholder="Choisir un point de départ">
              {(value: string | null) => {
                const point = points.find((p) => p.id === value);
                return point ? formatSitePointOption(point) : "Choisir un point de départ";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {pointGroups.map((group) => (
              <SelectGroup key={group.site.id}>
                <SelectLabel>{group.site.name}</SelectLabel>
                {group.points.map((point) => (
                  <SelectItem key={point.id} value={point.id}>
                    {formatSitePointItemLabel(point)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="arrivalPointId">Point d&apos;arrivée</Label>
        <Select name="arrivalPointId" defaultValue={defaultValues?.arrivalPointId} required>
          <SelectTrigger id="arrivalPointId" className="w-full">
            <SelectValue placeholder="Choisir un point d'arrivée">
              {(value: string | null) => {
                const point = points.find((p) => p.id === value);
                return point ? formatSitePointOption(point) : "Choisir un point d'arrivée";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {pointGroups.map((group) => (
              <SelectGroup key={group.site.id}>
                <SelectLabel>{group.site.name}</SelectLabel>
                {group.points.map((point) => (
                  <SelectItem key={point.id} value={point.id}>
                    {formatSitePointItemLabel(point)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

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
