"use client";

import { useActionState, useEffect } from "react";
import { updateProfileAction } from "@/actions/update-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import type { CitySuggestion } from "@/features/address-search";
import { CityCombobox } from "./city-combobox";

type ProfileFormProps = {
  name: string;
  city?: string | null;
};

export function ProfileForm({ name, city }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, null);

  // Reconstruit une CitySuggestion à partir de la seule chaîne stockée
  // (User.city) : même principe que school-form.tsx pour initialAddress —
  // id synthétique (la ville elle-même), pas de code postal connu (non
  // stocké, uniquement utile à la désambiguïsation pendant la recherche).
  const initialCity: CitySuggestion | undefined = city
    ? { id: city, city, postalCode: "" }
    : undefined;

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, type: "error" });
    }
    if (state?.success === true) {
      toast.add({ title: "Profil mis à jour avec succès.", type: "success" });
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Prénom</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="given-name"
          defaultValue={name}
          required
        />
      </div>

      <CityCombobox name="city" defaultValue={initialCity} />

      <Button type="submit" className="mt-2" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </Button>

      {state?.success === false && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
