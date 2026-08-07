"use client";

import { useActionState } from "react";
import { createFlightAction } from "@/actions/create-flight";
import { Button } from "@/components/ui/button";

// Dupliqué depuis l'enum Prisma FlightType plutôt qu'importé, pour ne pas
// tirer @prisma/client dans le bundle client pour un simple <select>.
const FLIGHT_TYPES = ["LOCAL", "CROSS", "SOARING", "THERMAL", "TRAINING", "OTHER"] as const;

type NewFlightFormProps = {
  sites: { id: string; name: string }[];
};

export function NewFlightForm({ sites }: NewFlightFormProps) {
  const [state, formAction, isPending] = useActionState(createFlightAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="date">Date</label>
        <input id="date" name="date" type="date" required className="border rounded px-2 py-1" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="siteId">Site</label>
        <select id="siteId" name="siteId" required className="border rounded px-2 py-1">
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="takeoffAltitudeM">Altitude décollage (m)</label>
        <input
          id="takeoffAltitudeM"
          name="takeoffAltitudeM"
          type="number"
          required
          className="border rounded px-2 py-1"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="landingAltitudeM">Altitude atterrissage (m)</label>
        <input
          id="landingAltitudeM"
          name="landingAltitudeM"
          type="number"
          required
          className="border rounded px-2 py-1"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="durationMin">Durée (min)</label>
        <input
          id="durationMin"
          name="durationMin"
          type="number"
          min={1}
          required
          className="border rounded px-2 py-1"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="flightType">Type de vol</label>
        <select id="flightType" name="flightType" required className="border rounded px-2 py-1">
          {FLIGHT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="observations">Observations</label>
        <textarea
          id="observations"
          name="observations"
          required
          className="border rounded px-2 py-1"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="improvementPoints">Points d&apos;amélioration</label>
        <textarea
          id="improvementPoints"
          name="improvementPoints"
          required
          className="border rounded px-2 py-1"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Créer le vol"}
      </Button>

      {state?.success === true && <p className="text-green-600">Vol créé avec succès.</p>}
      {state?.success === false && <p className="text-red-600">{state.error}</p>}
    </form>
  );
}
