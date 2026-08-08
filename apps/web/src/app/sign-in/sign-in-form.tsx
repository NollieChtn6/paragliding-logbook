"use client";

import { useActionState } from "react";
import { signInAction } from "@/actions/sign-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignInFormProps = {
  redirectTo: string;
};

// signInAction redirige vers redirectTo en cas de succès : il n'y a pas
// d'état "succès" à afficher ici (voir FlightForm pour le même principe).
export function SignInForm({ redirectTo }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(signInAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="flex flex-col gap-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" required />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Connexion..." : "Se connecter"}
      </Button>

      {state?.success === false && <p className="text-destructive">{state.error}</p>}
    </form>
  );
}
