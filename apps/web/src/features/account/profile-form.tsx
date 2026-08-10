"use client";

import { useActionState, useEffect } from "react";
import { updateProfileAction } from "@/actions/update-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type ProfileFormProps = {
  name: string;
};

export function ProfileForm({ name }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, null);

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
        <Label htmlFor="name">Nom</Label>
        <Input id="name" name="name" type="text" autoComplete="name" defaultValue={name} required />
      </div>

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
