"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type SchoolFormActionState = { success: true } | { success: false; error: string };

type SchoolFormDefaultValues = {
  name?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
};

type SchoolFormProps = {
  action: (
    prevState: SchoolFormActionState | null,
    formData: FormData,
  ) => Promise<SchoolFormActionState>;
  defaultValues?: SchoolFormDefaultValues;
  submitLabel?: string;
};

// Même principe que SiteForm : formulaire admin simple, sans assistant
// multi-étapes.
export function SchoolForm({
  action,
  defaultValues,
  submitLabel = "Créer l'école",
}: SchoolFormProps) {
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
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" name="address" defaultValue={defaultValues?.address} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="postalCode">Code postal</Label>
          <Input id="postalCode" name="postalCode" defaultValue={defaultValues?.postalCode} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" name="city" defaultValue={defaultValues?.city} />
        </div>
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="website">Site web</Label>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://exemple.fr"
          defaultValue={defaultValues?.website}
        />
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
