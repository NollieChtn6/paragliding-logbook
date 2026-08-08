"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FlightForm } from "@/features/flights/flight-form";

type NewActivityFormProps = {
  activityTypes: { code: string; label: string }[];
  sites: { id: string; name: string }[];
};

// Seul FLIGHT a un formulaire disponible pour l'instant (TrainingCamp et
// GroundHandlingSession ne sont pas encore implémentés, cf. docs/todo.md).
const AVAILABLE_ACTIVITY_TYPE_CODES = new Set(["FLIGHT"]);

export function NewActivityForm({ activityTypes, sites }: NewActivityFormProps) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <RadioGroup value={selectedCode ?? undefined} onValueChange={setSelectedCode}>
        {activityTypes.map((activityType) => (
          <div key={activityType.code} className="flex items-center gap-2">
            <RadioGroupItem value={activityType.code} id={activityType.code} />
            <Label htmlFor={activityType.code}>{activityType.label}</Label>
          </div>
        ))}
      </RadioGroup>

      {selectedCode && !AVAILABLE_ACTIVITY_TYPE_CODES.has(selectedCode) && (
        <p className="text-muted-foreground">Bientôt disponible.</p>
      )}

      {selectedCode === "FLIGHT" && <FlightForm sites={sites} />}
    </div>
  );
}
