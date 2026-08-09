"use client";

import { Eye, EyeOff } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { changePasswordAction } from "@/actions/change-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type ToggleVisibilityButtonProps = {
  visible: boolean;
  onToggle: () => void;
};

// Réutilisé sur newPassword/confirmPassword (mêmes icônes Eye/EyeOff que
// sign-in-form.tsx) — pas sur currentPassword, qui ne sert qu'à confirmer
// l'identité de l'utilisateur avant modification (voir ChangePasswordForm) :
// rien à "vérifier visuellement" sur un mot de passe qu'on n'est pas en
// train de saisir pour la première fois, contrairement aux deux autres.
function ToggleVisibilityButton({ visible, onToggle }: ToggleVisibilityButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Masquer les mots de passe" : "Afficher les mots de passe"}
      title={visible ? "Masquer les mots de passe" : "Afficher les mots de passe"}
      className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
    >
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

type ChangePasswordFormProps = {
  email: string;
};

export function ChangePasswordForm({ email }: ChangePasswordFormProps) {
  const [state, formAction, isPending] = useActionState(changePasswordAction, null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, type: "error" });
    }
    if (state?.success === true) {
      toast.add({ title: "Mot de passe modifié avec succès.", type: "success" });
      formRef.current?.reset();
    }
  }, [state]);

  const newPasswordFieldType = showNewPassword ? "text" : "password";
  const toggleNewPasswordVisibility = () => setShowNewPassword((value) => !value);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {/* Champ caché autoComplete="username" : sans lui, le navigateur n'a
      aucun moyen d'associer le champ "Mot de passe actuel" (ci-dessous) au
      bon compte enregistré — ce formulaire ne contient pas d'email visible.
      Il proposait alors l'identifiant/mot de passe d'un tout autre compte
      déjà mémorisé sur ce domaine (ex. un compte de test). Voir la
      spécification WHATWG sur le remplissage automatique des champs cachés :
      un input hidden porte bien autoComplete pour ce cas précis. */}
      <input type="text" name="username" value={email} autoComplete="username" readOnly hidden />

      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={newPasswordFieldType}
            className="pr-9"
            autoComplete="new-password"
            minLength={12}
            required
          />
          <ToggleVisibilityButton
            visible={showNewPassword}
            onToggle={toggleNewPasswordVisibility}
          />
        </div>
        <p className="text-sm text-muted-foreground">Au moins 12 caractères.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={newPasswordFieldType}
            className="pr-9"
            autoComplete="new-password"
            required
          />
          <ToggleVisibilityButton
            visible={showNewPassword}
            onToggle={toggleNewPasswordVisibility}
          />
        </div>
      </div>

      <Button type="submit" className="mt-2" disabled={isPending}>
        {isPending ? "Modification..." : "Changer le mot de passe"}
      </Button>

      {state?.success === false && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success === true && (
        <p role="status" className="text-sm text-foreground">
          Mot de passe modifié avec succès. Vos autres sessions ont été déconnectées.
        </p>
      )}
    </form>
  );
}
