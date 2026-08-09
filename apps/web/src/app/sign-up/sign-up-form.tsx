"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { useActionState, useEffect, useState } from "react";
import { signUpAction } from "@/actions/sign-up";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type SignUpFormProps = {
  redirectTo: string;
};

// signUpAction redirige vers redirectTo en cas de succès (connexion
// automatique après inscription) : pas d'état "succès" à afficher ici, même
// principe que SignInForm.
export function SignUpForm({ redirectTo }: SignUpFormProps) {
  const [state, formAction, isPending] = useActionState(signUpAction, null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, type: "error" });
    }
  }, [state]);

  // Retour natif du navigateur (bordure rouge + message au submit) via
  // setCustomValidity, lu directement sur le formulaire (form.elements),
  // même technique que lib/form-validation.ts : un formulaire à une seule
  // étape n'a pas besoin de l'architecture fieldErrors construite pour
  // l'assistant de création d'activité.
  function handlePasswordFieldChange(event: React.ChangeEvent<HTMLInputElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    const password = form.elements.namedItem("password");
    const confirmPassword = form.elements.namedItem("confirmPassword");
    if (!(password instanceof HTMLInputElement) || !(confirmPassword instanceof HTMLInputElement)) {
      return;
    }
    if (!confirmPassword.value) return;
    confirmPassword.setCustomValidity(
      confirmPassword.value === password.value ? "" : "Les mots de passe ne correspondent pas.",
    );
  }

  const signInHref = `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`;
  const passwordFieldType = showPassword ? "text" : "password";
  const toggleVisibility = () => setShowPassword((value) => !value);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nom</Label>
        <Input id="name" name="name" type="text" autoComplete="name" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Adresse email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="email@exemple.fr"
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={passwordFieldType}
            placeholder="Votre mot de passe"
            className="pr-9"
            autoComplete="new-password"
            minLength={12}
            onChange={handlePasswordFieldChange}
            required
          />
          <button
            type="button"
            onClick={toggleVisibility}
            aria-label={showPassword ? "Masquer les mots de passe" : "Afficher les mots de passe"}
            title={showPassword ? "Masquer les mots de passe" : "Afficher les mots de passe"}
            className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Au moins 12 caractères.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={passwordFieldType}
            placeholder="Votre mot de passe"
            className="pr-9"
            autoComplete="new-password"
            onChange={handlePasswordFieldChange}
            required
          />
          <button
            type="button"
            onClick={toggleVisibility}
            aria-label={showPassword ? "Masquer les mots de passe" : "Afficher les mots de passe"}
            title={showPassword ? "Masquer les mots de passe" : "Afficher les mots de passe"}
            className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="mt-2" disabled={isPending}>
        {isPending ? "Création du compte..." : "Créer mon compte"}
      </Button>

      {state?.success === false && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
          {state.emailAlreadyUsed && (
            <>
              {" "}
              <Link href={signInHref} className="font-medium underline underline-offset-2">
                Se connecter
              </Link>
            </>
          )}
        </p>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href={signInHref} className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
