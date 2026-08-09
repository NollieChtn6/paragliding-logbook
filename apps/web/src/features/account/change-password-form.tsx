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

// Répété sur les 3 champs, tous pilotés par le même état showPassword (voir
// ChangePasswordForm) — mêmes icônes Eye/EyeOff que sign-in-form.tsx.
function ToggleVisibilityButton({ visible, onToggle }: ToggleVisibilityButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Masquer les mots de passe" : "Afficher les mots de passe"}
      className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
    >
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, null);
  const [showPassword, setShowPassword] = useState(false);
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

  const passwordFieldType = showPassword ? "text" : "password";
  const toggleVisibility = () => setShowPassword((value) => !value);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            name="currentPassword"
            type={passwordFieldType}
            className="pr-9"
            autoComplete="current-password"
            required
          />
          <ToggleVisibilityButton visible={showPassword} onToggle={toggleVisibility} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={passwordFieldType}
            className="pr-9"
            autoComplete="new-password"
            minLength={12}
            required
          />
          <ToggleVisibilityButton visible={showPassword} onToggle={toggleVisibility} />
        </div>
        <p className="text-sm text-muted-foreground">Au moins 12 caractères.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={passwordFieldType}
            className="pr-9"
            autoComplete="new-password"
            required
          />
          <ToggleVisibilityButton visible={showPassword} onToggle={toggleVisibility} />
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
