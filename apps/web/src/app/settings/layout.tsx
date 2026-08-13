import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { AccountMenu } from "@/components/layout/account-menu";
import { LocaleToggle } from "@/components/locale-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { VersionBadge } from "@/components/version-badge";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

// /settings (ex. /settings/security) doit rester accessible aux deux rôles
// (USER et ADMIN) : hors du route group (app) exprès, pour ne pas hériter
// de sa redirection ADMIN → /admin (app/(app)/layout.tsx). Chrome minimal
// dédié plutôt que AppShell/AdminShell : pas de seconde identité visuelle,
// juste de quoi revenir (vers / ou /admin selon le rôle) et se déconnecter.
// VersionBadge en pied : ce layout n'a pas de sidebar (contrairement à
// AppShell/AdminShell, où elle vit déjà), seul endroit où elle apparaîtrait
// sinon quand on consulte /settings.
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();
  const backHref = user.role === "ADMIN" ? "/admin" : "/";
  const t = getDictionary(await getLocale());

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t.common.back}
        </Link>
        {/* showSecurityLink=false : un lien vers /settings/security depuis
        /settings/security lui-même n'aurait pas de sens. */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <LocaleToggle />
          <AccountMenu showSecurityLink={false} />
        </div>
        <div className="hidden items-center gap-1 md:flex">
          <LocaleToggle />
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 p-4 md:p-6">{children}</main>

      <footer className="p-4 text-center">
        <VersionBadge />
      </footer>
    </div>
  );
}
