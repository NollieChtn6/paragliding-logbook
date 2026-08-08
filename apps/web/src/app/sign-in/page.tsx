import { ThemeToggle } from "@/components/theme-toggle";
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
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Bienvenue à bord
          </h1>
          <p className="text-sm text-muted-foreground">
            Votre carnet de vol parapente <br />
            du décollage à l&apos;atterrissage.
          </p>
        </div>
        <SignInForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
