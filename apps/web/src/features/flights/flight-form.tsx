"use client";

import { useActionState } from "react";
import { createFlightAction } from "@/actions/create-flight";
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

type FlightFormProps = {
  sites: { id: string; name: string }[];
};

// Formulaire de vol partagé (shadcn/ui exclusivement, cf. CLAUDE.md), utilisé
// par /flights/new et /activities/new. createFlightAction redirige vers "/"
// en cas de succès : il n'y a pas d'état "succès" à afficher ici.
export function FlightForm({ sites }: FlightFormProps) {
  const [state, formAction, isPending] = useActionState(createFlightAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="siteId">Site</Label>
        <Select name="siteId" required>
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

      <div className="flex flex-col gap-1">
        <Label htmlFor="takeoffAltitudeM">Altitude décollage (m)</Label>
        <Input id="takeoffAltitudeM" name="takeoffAltitudeM" type="number" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="landingAltitudeM">Altitude atterrissage (m)</Label>
        <Input id="landingAltitudeM" name="landingAltitudeM" type="number" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="durationMin">Durée (min)</Label>
        <Input id="durationMin" name="durationMin" type="number" min={1} required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="flightType">Type de vol</Label>
        <Select name="flightType" required>
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
        <Textarea id="observations" name="observations" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="improvementPoints">Points d&apos;amélioration</Label>
        <Textarea id="improvementPoints" name="improvementPoints" required />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Créer le vol"}
      </Button>

      {state?.success === false && <p className="text-red-600">{state.error}</p>}
    </form>
  );
}
