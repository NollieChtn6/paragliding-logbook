import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Connexion</h1>
      <SignInForm />
    </div>
  );
}
