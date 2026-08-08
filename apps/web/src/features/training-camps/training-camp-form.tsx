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

type TrainingCampFormActionState = { success: true } | { success: false; error: string };

type TrainingCampFormDefaultValues = {
  startDate?: Date;
  endDate?: Date;
  schoolId?: string;
  campType?: string;
  summary?: string;
  certification?: string;
};

type TrainingCampFormProps = {
  schools: { id: string; name: string }[];
  action: (
    prevState: TrainingCampFormActionState | null,
    formData: FormData,
  ) => Promise<TrainingCampFormActionState>;
  defaultValues?: TrainingCampFormDefaultValues;
  submitLabel?: string;
};

// Format attendu par <Input type="date">, voir flight-form.tsx.
function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Même principe que FlightForm : utilisé en création (/activities/new) et en
// modification (/activities/[id]/edit), action et defaultValues varient
// selon l'appelant. Les actions redirigent en cas de succès, pas d'état
// "succès" à afficher ici.
export function TrainingCampForm({
  schools,
  action,
  defaultValues,
  submitLabel = "Créer le stage",
}: TrainingCampFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="startDate">Date de début</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={
            defaultValues?.startDate ? toDateInputValue(defaultValues.startDate) : undefined
          }
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="endDate">Date de fin</Label>
        <Input
          id="endDate"
          name="endDate"
          type="date"
          defaultValue={
            defaultValues?.endDate ? toDateInputValue(defaultValues.endDate) : undefined
          }
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="schoolId">École</Label>
        <Select name="schoolId" defaultValue={defaultValues?.schoolId} required>
          <SelectTrigger id="schoolId" className="w-full">
            <SelectValue placeholder="Choisir une école">
              {(value: string | null) =>
                schools.find((school) => school.id === value)?.name ?? "Choisir une école"
              }
            </SelectValue>
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="campType">Type de stage</Label>
        <Input id="campType" name="campType" defaultValue={defaultValues?.campType} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="summary">Bilan</Label>
        <Textarea id="summary" name="summary" defaultValue={defaultValues?.summary} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="certification">Certification</Label>
        <Input
          id="certification"
          name="certification"
          defaultValue={defaultValues?.certification}
        />
      </div>

      <Button type="submit" className="mt-2" disabled={isPending}>
        {isPending ? "Enregistrement..." : submitLabel}
      </Button>

      {state?.success === false && <p className="text-destructive">{state.error}</p>}
    </form>
  );
}
