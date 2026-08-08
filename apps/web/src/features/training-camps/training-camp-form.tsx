"use client";

import { useActionState } from "react";
import { createTrainingCampAction } from "@/actions/create-training-camp";
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

type TrainingCampFormProps = {
  schools: { id: string; name: string }[];
};

// Même principe que FlightForm : createTrainingCampAction redirige vers
// /activities en cas de succès, pas d'état "succès" à afficher ici.
export function TrainingCampForm({ schools }: TrainingCampFormProps) {
  const [state, formAction, isPending] = useActionState(createTrainingCampAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="startDate">Date de début</Label>
        <Input id="startDate" name="startDate" type="date" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="endDate">Date de fin</Label>
        <Input id="endDate" name="endDate" type="date" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="schoolId">École</Label>
        <Select name="schoolId" required>
          <SelectTrigger id="schoolId" className="w-full">
            <SelectValue placeholder="Choisir une école" />
          </SelectTrigger>
          <SelectContent>
            {schools.map((school) => (
              <SelectItem key={school.id} value={school.id}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="campType">Type de stage</Label>
        <Input id="campType" name="campType" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="summary">Bilan</Label>
        <Textarea id="summary" name="summary" />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="certification">Certification</Label>
        <Input id="certification" name="certification" />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Créer le stage"}
      </Button>

      {state?.success === false && <p className="text-red-600">{state.error}</p>}
    </form>
  );
}
