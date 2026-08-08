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

type NewActivityFormProps = {
  activityTypes: { code: string; label: string }[];
  sites: { id: string; name: string }[];
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
            <Label htmlFor={activityType.code}>{activityType.label}</Label>
          </div>
        ))}
      </RadioGroup>

      {selectedCode && !AVAILABLE_ACTIVITY_TYPE_CODES.has(selectedCode) && (
        <p className="text-muted-foreground">Bientôt disponible.</p>
      )}

      {selectedCode === "FLIGHT" && (
        <FlightForm sites={sites} trainingCamps={trainingCamps} action={createFlightAction} />
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
