"use client";

import { useActionState } from "react";
import { createGroundHandlingSessionAction } from "@/actions/create-ground-handling-session";
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

type TrainingCampOption = {
  id: string;
  campType: string;
  startDate: Date;
  endDate: Date;
  school: { name: string };
};

type GroundHandlingSessionFormProps = {
  sites: { id: string; name: string }[];
  trainingCamps?: TrainingCampOption[];
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR");
}

// Même principe que FlightForm/TrainingCampForm :
// createGroundHandlingSessionAction redirige vers /activities en cas de
// succès, pas d'état "succès" à afficher ici.
export function GroundHandlingSessionForm({
  sites,
  trainingCamps = [],
}: GroundHandlingSessionFormProps) {
  const [state, formAction, isPending] = useActionState(createGroundHandlingSessionAction, null);

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

      {trainingCamps.length > 0 && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="trainingCampId">Stage associé (optionnel)</Label>
          <Select name="trainingCampId" defaultValue="">
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
        <Label htmlFor="durationMin">Durée (min)</Label>
        <Input id="durationMin" name="durationMin" type="number" min={1} required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="exercises">Exercices travaillés</Label>
        <Textarea id="exercises" name="exercises" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="difficulties">Difficultés rencontrées</Label>
        <Textarea id="difficulties" name="difficulties" />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="feeling">Ressenti</Label>
        <Textarea id="feeling" name="feeling" />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Créer la séance"}
      </Button>

      {state?.success === false && <p className="text-red-600">{state.error}</p>}
    </form>
  );
}
