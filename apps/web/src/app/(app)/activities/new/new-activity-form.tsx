"use client";

import { useState } from "react";
import { createFlightAction } from "@/actions/create-flight";
import { createGroundHandlingSessionAction } from "@/actions/create-ground-handling-session";
import { createTrainingCampAction } from "@/actions/create-training-camp";
import { ACTIVITY_TYPE_STYLE } from "@/components/activity-card";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FlightForm } from "@/features/flights/flight-form";
import { GroundHandlingSessionForm } from "@/features/ground-handling-sessions/ground-handling-session-form";
import { TrainingCampForm } from "@/features/training-camps/training-camp-form";
import { cn } from "@/lib/utils";

type EquipmentOption = { id: string; brand: string; model: string; size: string | null };

type NewActivityFormProps = {
  activityTypes: { code: string }[];
  flightTypes: { id: string; code: string }[];
  trainingCampTypes: { id: string; code: string }[];
  qualificationTypes: { id: string; code: string }[];
  schools: { id: string; name: string }[];
  trainingCamps: {
    id: string;
    trainingCampType: { code: string };
    startDate: Date;
    endDate: Date;
    school: { name: string };
  }[];
  wings: EquipmentOption[];
  harnesses: EquipmentOption[];
  reserves: EquipmentOption[];
};

// Les trois types du MVP (Vol, Stage, Gonflage) ont désormais un formulaire —
// les autres types d'activité éventuels (aucun aujourd'hui) ne sont pas
// proposés à l'étape 1 : pas d'écran "bientôt disponible" sans suite.
const AVAILABLE_ACTIVITY_TYPE_CODES = new Set(["FLIGHT", "TRAINING_CAMP", "GROUND_HANDLING"]);

// "" plutôt que null/undefined pour la valeur "aucune sélection" : Base UI
// détermine si un RadioGroup est contrôlé ou non au premier rendu (contrôlé
// si value !== undefined) et avertit s'il change d'état par la suite —
// value doit donc rester une string dès le premier rendu.
const NO_SELECTION = "";

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const ta = useT().activities;
  const stepLabels = [ta.stepActivityType, ta.stepDetails, ta.stepObservations] as const;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        {ta.stepIndicator(step, stepLabels[step - 1])}
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
    </div>
  );
}

// Assistant en 3 étapes : 1. type d'activité, 2. détails structurés (dates,
// sites/points, stage associé, durée...), 3. observations/texte libre. Un
// seul <form> par type reste monté du choix du type jusqu'à la soumission
// finale (FlightForm/TrainingCampForm/GroundHandlingSessionForm gèrent en
// interne l'affichage/masquage de leurs deux groupes de champs via l'attribut
// HTML hidden — voir le commentaire dans flight-form.tsx) : passer d'une
// étape à l'autre ne fait que changer ce qui est visible, jamais remonter le
// formulaire, donc jamais perdre une valeur déjà saisie.
export function NewActivityForm({
  activityTypes,
  flightTypes,
  trainingCampTypes,
  qualificationTypes,
  schools,
  trainingCamps,
  wings,
  harnesses,
  reserves,
}: NewActivityFormProps) {
  const [selectedCode, setSelectedCode] = useState<string>(NO_SELECTION);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const t = useT();

  function goToStep2() {
    setStep(2);
  }

  function backToStep1() {
    setStep(1);
  }

  function backToStep2() {
    setStep(2);
  }

  function goToStep3() {
    setStep(3);
  }

  const wizardStep = step === 3 ? 3 : 2;

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator step={step} />

      <div
        className={cn(
          "duration-300 animate-in fade-in-0",
          step !== 1 ? "hidden" : "flex flex-col gap-6",
        )}
      >
        <RadioGroup value={selectedCode} onValueChange={setSelectedCode}>
          <div className="grid gap-3 sm:grid-cols-3">
            {activityTypes
              .filter((activityType) => AVAILABLE_ACTIVITY_TYPE_CODES.has(activityType.code))
              .map((activityType) => {
                const { icon: Icon, className } =
                  ACTIVITY_TYPE_STYLE[activityType.code as keyof typeof ACTIVITY_TYPE_STYLE];
                const isSelected = selectedCode === activityType.code;

                return (
                  <label
                    key={activityType.code}
                    htmlFor={activityType.code}
                    className={cn(
                      "relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-4 text-center shadow-sm transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/50",
                    )}
                  >
                    <RadioGroupItem
                      value={activityType.code}
                      id={activityType.code}
                      className="absolute top-3 right-3"
                    />
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl",
                        className,
                      )}
                      aria-hidden
                    >
                      <Icon className="size-5" />
                    </span>
                    {/* Le <label> englobant porte déjà l'association htmlFor : un
                    second <label> imbriqué (composant Label) serait invalide en HTML. */}
                    <span className="text-sm font-medium text-foreground">
                      {t.referenceLabels.activityType[activityType.code] ?? activityType.code}
                    </span>
                  </label>
                );
              })}
          </div>
        </RadioGroup>

        <div className="flex justify-end">
          <Button type="button" disabled={!selectedCode} onClick={goToStep2}>
            {t.activities.next}
          </Button>
        </div>
      </div>

      {selectedCode === "FLIGHT" && (
        <div hidden={step === 1} className="duration-300 animate-in fade-in-0">
          <FlightForm
            flightTypes={flightTypes}
            trainingCamps={trainingCamps}
            wings={wings}
            harnesses={harnesses}
            reserves={reserves}
            action={createFlightAction}
            wizardStep={wizardStep}
            onWizardBack={step === 3 ? backToStep2 : backToStep1}
            onWizardNext={goToStep3}
          />
        </div>
      )}
      {selectedCode === "TRAINING_CAMP" && (
        <div hidden={step === 1} className="duration-300 animate-in fade-in-0">
          <TrainingCampForm
            schools={schools}
            trainingCampTypes={trainingCampTypes}
            qualificationTypes={qualificationTypes}
            action={createTrainingCampAction}
            wizardStep={wizardStep}
            onWizardBack={step === 3 ? backToStep2 : backToStep1}
            onWizardNext={goToStep3}
          />
        </div>
      )}
      {selectedCode === "GROUND_HANDLING" && (
        <div hidden={step === 1} className="duration-300 animate-in fade-in-0">
          <GroundHandlingSessionForm
            trainingCamps={trainingCamps}
            wings={wings}
            harnesses={harnesses}
            action={createGroundHandlingSessionAction}
            wizardStep={wizardStep}
            onWizardBack={step === 3 ? backToStep2 : backToStep1}
            onWizardNext={goToStep3}
          />
        </div>
      )}
    </div>
  );
}
