"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { useActionState, useEffect, useState } from "react";
import { signUpAction } from "@/actions/sign-up";
import { verifySignUpInviteCodeAction } from "@/actions/verify-signup-invite-code";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { CityCombobox } from "@/features/account/city-combobox";

// Doit rester en phase avec SIGNUP_INVITE_CODE_LENGTH
// (lib/signup-invite-code.ts) : pas importable ici tel quel, ce module lit
// process.env et n'a rien à faire dans le bundle client.
const INVITE_CODE_LENGTH = 6;

type SignUpFormProps = {
  redirectTo: string;
  // Décidé côté serveur (sign-up/page.tsx > isSignUpInviteCodeRequired) :
  // si aucun SIGNUP_INVITE_CODE n'est configuré, l'étape "code" est
  // entièrement sautée, l'inscription reste directe comme avant.
  inviteCodeRequired: boolean;
};

// Deux écrans distincts plutôt qu'un assistant à plusieurs étapes dans un
// même <form> (contrairement à new-activity-form.tsx) : l'étape "code" n'est
// pas un champ du formulaire d'inscription, c'est une porte d'entrée qui le
// précède, vérifiée à la fois ici (feedback immédiat, verifySignUpInviteCodeAction)
// et pour de bon côté serveur dans signUp (features/auth/sign-up.service.ts).
export function SignUpForm({ redirectTo, inviteCodeRequired }: SignUpFormProps) {
  const [step, setStep] = useState<"code" | "form">(inviteCodeRequired ? "code" : "form");
  const [inviteCode, setInviteCode] = useState("");

  const signInHref = `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`;

  if (step === "code") {
    return (
      <SignUpInviteCodeStep
        signInHref={signInHref}
        onValidCode={(code) => {
          setInviteCode(code);
          setStep("form");
        }}
      />
    );
  }

  return (
    <SignUpDetailsStep redirectTo={redirectTo} inviteCode={inviteCode} signInHref={signInHref} />
  );
}

type SignUpInviteCodeStepProps = {
  signInHref: string;
  onValidCode: (code: string) => void;
};

function SignUpInviteCodeStep({ signInHref, onValidCode }: SignUpInviteCodeStepProps) {
  const [codeValue, setCodeValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useT().auth.signUp;

  async function handleComplete(code: string) {
    setIsVerifying(true);
    setError(null);
    const valid = await verifySignUpInviteCodeAction(code);
    setIsVerifying(false);
    if (!valid) {
      setError(t.invalidCode);
      setCodeValue("");
      return;
    }
    onValidCode(code);
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-muted-foreground">{t.inviteIntro}</p>

      <InputOTP
        maxLength={INVITE_CODE_LENGTH}
        value={codeValue}
        onChange={setCodeValue}
        onComplete={handleComplete}
        pattern={REGEXP_ONLY_DIGITS}
        inputMode="numeric"
        disabled={isVerifying}
        autoFocus
      >
        <InputOTPGroup>
          {Array.from({ length: INVITE_CODE_LENGTH }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: liste de taille fixe, l'ordre des slots ne change jamais.
            <InputOTPSlot key={index} index={index} aria-invalid={!!error} />
          ))}
        </InputOTPGroup>
      </InputOTP>

      <p role="status" aria-live="polite" className="min-h-5 text-sm">
        {isVerifying && <span className="text-muted-foreground">{t.verifying}</span>}
        {error && (
          <span role="alert" className="text-destructive">
            {error}
          </span>
        )}
      </p>

      <p className="text-sm text-muted-foreground">
        {t.alreadyHaveAccount}{" "}
        <Link href={signInHref} className="font-medium text-primary hover:underline">
          {t.signIn}
        </Link>
      </p>
    </div>
  );
}

type SignUpDetailsStepProps = {
  redirectTo: string;
  inviteCode: string;
  signInHref: string;
};

// signUpAction redirige vers redirectTo en cas de succès (connexion
// automatique après inscription) : pas d'état "succès" à afficher ici, même
// principe que SignInForm.
function SignUpDetailsStep({ redirectTo, inviteCode, signInHref }: SignUpDetailsStepProps) {
  const [state, formAction, isPending] = useActionState(signUpAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const messages = useT();
  const t = messages.auth.signUp;

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
      confirmPassword.value === password.value ? "" : messages.validation.signUp.passwordMismatch,
    );
  }

  const passwordFieldType = showPassword ? "text" : "password";
  const toggleVisibility = () => setShowPassword((value) => !value);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="inviteCode" value={inviteCode} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t.nameLabel}</Label>
        <Input id="name" name="name" type="text" autoComplete="given-name" required />
      </div>

      <CityCombobox name="city" />

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t.emailLabel}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t.emailPlaceholder}
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t.passwordLabel}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={passwordFieldType}
            placeholder={t.passwordPlaceholder}
            className="pr-9"
            autoComplete="new-password"
            minLength={12}
            onChange={handlePasswordFieldChange}
            required
          />
          <button
            type="button"
            onClick={toggleVisibility}
            aria-label={showPassword ? t.hidePasswords : t.showPasswords}
            title={showPassword ? t.hidePasswords : t.showPasswords}
            className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{t.passwordHint}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">{t.confirmPasswordLabel}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={passwordFieldType}
            placeholder={t.passwordPlaceholder}
            className="pr-9"
            autoComplete="new-password"
            onChange={handlePasswordFieldChange}
            required
          />
          <button
            type="button"
            onClick={toggleVisibility}
            aria-label={showPassword ? t.hidePasswords : t.showPasswords}
            title={showPassword ? t.hidePasswords : t.showPasswords}
            className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="mt-2" disabled={isPending}>
        {isPending ? t.submitting : t.submit}
      </Button>

      {state?.success === false && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
          {state.emailAlreadyUsed && (
            <>
              {" "}
              <Link href={signInHref} className="font-medium underline underline-offset-2">
                {t.signIn}
              </Link>
            </>
          )}
        </p>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {t.alreadyHaveAccount}{" "}
        <Link href={signInHref} className="font-medium text-primary hover:underline">
          {t.signIn}
        </Link>
      </p>
    </form>
  );
}
