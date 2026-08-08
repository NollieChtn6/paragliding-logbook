import { toSafeRedirectPath } from "@/lib/safe-redirect";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const redirectToParam = params.redirectTo;
  const redirectTo = toSafeRedirectPath(
    typeof redirectToParam === "string" ? redirectToParam : null,
    "/activities",
  );

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Connexion</h1>
      <SignInForm redirectTo={redirectTo} />
    </div>
  );
}
