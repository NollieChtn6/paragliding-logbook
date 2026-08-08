"use client";

import { useState } from "react";
import { createFlightAction } from "@/actions/create-flight";
import { createGroundHandlingSessionAction } from "@/actions/create-ground-handling-session";
import { createTrainingCampAction } from "@/actions/create-training-camp";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FlightForm } from "@/features/flights/flight-form";
import { GroundHandlingSessionForm } from "@/features/ground-handling-sessions/ground-handling-session-form";
import { TrainingCampForm } from "@/features/training-camps/training-camp-form";
import { ACTIVITY_TYPE_LABELS } from "@/lib/reference-labels";

type NewActivityFormProps = {
  activityTypes: { code: string }[];
  sites: { id: string; name: string }[];
  points: {
    id: string;
    label: string;
    altitudeM: number;
    site: { id: string; name: string };
    sitePointType: { code: string };
  }[];
  flightTypes: { id: string; code: string }[];
  schools: { id: string; name: string }[];
  trainingCamps: {
    id: string;
    campType: string;
    startDate: Date;
    endDate: Date;
    school: { name: string };
  }[];
};

// Les trois types du MVP (Vol, Stage, Gonflage) ont désormais un formulaire.
const AVAILABLE_ACTIVITY_TYPE_CODES = new Set(["FLIGHT", "TRAINING_CAMP", "GROUND_HANDLING"]);

// "" plutôt que null/undefined pour la valeur "aucune sélection" : Base UI
// détermine si un RadioGroup est contrôlé ou non au premier rendu (contrôlé
// si value !== undefined) et avertit s'il change d'état par la suite —
// value doit donc rester une string dès le premier rendu.
const NO_SELECTION = "";

export function NewActivityForm({
  activityTypes,
  sites,
  points,
  flightTypes,
  schools,
  trainingCamps,
}: NewActivityFormProps) {
  const [selectedCode, setSelectedCode] = useState<string>(NO_SELECTION);

  return (
    <div className="flex flex-col gap-6">
      <RadioGroup value={selectedCode} onValueChange={setSelectedCode}>
        {activityTypes.map((activityType) => (
          <div key={activityType.code} className="flex items-center gap-2">
            <RadioGroupItem value={activityType.code} id={activityType.code} />
            <Label htmlFor={activityType.code}>
              {ACTIVITY_TYPE_LABELS[activityType.code] ?? activityType.code}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {selectedCode && !AVAILABLE_ACTIVITY_TYPE_CODES.has(selectedCode) && (
        <p className="text-muted-foreground">Bientôt disponible.</p>
      )}

      {selectedCode === "FLIGHT" && (
        <FlightForm
          points={points}
          flightTypes={flightTypes}
          trainingCamps={trainingCamps}
          action={createFlightAction}
        />
      )}
      {selectedCode === "TRAINING_CAMP" && (
        <TrainingCampForm schools={schools} action={createTrainingCampAction} />
      )}
      {selectedCode === "GROUND_HANDLING" && (
        <GroundHandlingSessionForm
          sites={sites}
          trainingCamps={trainingCamps}
          action={createGroundHandlingSessionAction}
        />
      )}
    </div>
  );
}
