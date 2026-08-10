"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { signInAction } from "@/actions/sign-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type SignInFormProps = {
  redirectTo: string;
};

// signInAction redirige vers redirectTo en cas de succès : il n'y a pas
// d'état "succès" à afficher ici (voir FlightForm pour le même principe).
export function SignInForm({ redirectTo }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(signInAction, null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, type: "error" });
    }
  }, [state]);

  const signUpHref = `/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="email@exemple.fr" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Votre mot de passe"
            className="pr-9"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="mt-2" disabled={isPending}>
        {isPending ? "Connexion..." : "Se connecter"}
      </Button>

      {state?.success === false && (
        <p role="alert" className="text-destructive">
          {state.error}
        </p>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href={signUpHref} className="font-medium text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
