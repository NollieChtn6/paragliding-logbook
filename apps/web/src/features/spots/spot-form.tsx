"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type SpotFormActionState = { success: true } | { success: false; error: string };

type SpotFormDefaultValues = {
  name?: string;
  region?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
};

type SpotFormProps = {
  action: (
    prevState: SpotFormActionState | null,
    formData: FormData,
  ) => Promise<SpotFormActionState>;
  defaultValues?: SpotFormDefaultValues;
  submitLabel?: string;
};

// Formulaire admin simple (pas d'assistant multi-étapes, contrairement aux
// formulaires d'activité) : utilisé en création (/admin/spots/new) et en
// modification (/admin/spots/[id]/edit), action et defaultValues varient
// selon l'appelant — même principe que FlightForm/TrainingCampForm.
export function SpotForm({ action, defaultValues, submitLabel = "Créer le spot" }: SpotFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, type: "error" });
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nom</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="region">Région</Label>
        <Input id="region" name="region" defaultValue={defaultValues?.region} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="countryCode">Pays (code ISO, ex. FR)</Label>
        <Input
          id="countryCode"
          name="countryCode"
          maxLength={2}
          defaultValue={defaultValues?.countryCode}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            defaultValue={defaultValues?.latitude}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            defaultValue={defaultValues?.longitude}
          />
        </div>
      </div>

      <Button type="submit" className="mt-2" disabled={isPending}>
        {isPending ? "Enregistrement..." : submitLabel}
      </Button>

      {state?.success === false && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
