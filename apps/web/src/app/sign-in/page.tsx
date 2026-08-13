import Link from "next/link";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { VersionBadge } from "@/components/version-badge";
import { getLocale } from "@/lib/i18n/get-locale";
import { toSafeRedirectPath } from "@/lib/safe-redirect";
import { getDictionary } from "@/messages";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const redirectToParam = params.redirectTo;
  const redirectTo = toSafeRedirectPath(
    typeof redirectToParam === "string" ? redirectToParam : null,
    "/activities",
  );
  const t = getDictionary(await getLocale());

  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-4 right-4 flex gap-2">
        <LocaleToggle />
        <ThemeToggle />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex flex-col items-center gap-2">
            <span
              className="flex size-10 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent text-base"
              aria-hidden
            >
              🪂
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              THERMIK
            </h1>
          </Link>
          <p className="text-sm text-muted-foreground">
            {t.auth.signInTagline1} <br />
            {t.auth.signInTagline2}
          </p>
        </div>
        <SignInForm redirectTo={redirectTo} />
      </div>

      <VersionBadge className="absolute bottom-4" />
    </div>
  );
}
