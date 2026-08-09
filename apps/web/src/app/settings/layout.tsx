import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireCurrentUser } from "@/lib/current-user";

// /settings (ex. /settings/security) doit rester accessible aux deux rôles
// (USER et ADMIN) : hors du route group (app) exprès, pour ne pas hériter
// de sa redirection ADMIN → /admin (app/(app)/layout.tsx). Chrome minimal
// dédié plutôt que AppShell/AdminShell : pas de seconde identité visuelle,
// juste de quoi revenir (vers / ou /admin selon le rôle) et se déconnecter.
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();
  const backHref = user.role === "ADMIN" ? "/admin" : "/";

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
