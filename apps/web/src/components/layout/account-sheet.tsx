"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { signOutAction } from "@/actions/sign-out";
import { useT } from "@/components/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ProfileAvatar, type ProfileSummary } from "./profile-avatar";

// Pied de DesktopSidebar : bulle d'identité compacte (avatar + prénom) qui
// ouvre un panneau latéral avec l'identité complète (email, ville) et les
// deux actions (Paramètres, déconnexion). Remplace l'ancien bouton "Compte"
// générique (AccountMenu trigger="full", toujours utilisé par AdminShell —
// pas touché ici, hors périmètre) : un menu déroulant classique masquait
// l'identité de l'utilisatrice derrière un libellé générique, sans avatar
// ni nom visibles en permanence. Issu d'un prototype comparant 3 pistes
// (voir branche prototype/profile-access), cette variante retenue.
export function AccountSheet({ user }: { user: ProfileSummary }) {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-background px-2.5 py-2 text-left transition-colors hover:bg-muted">
        <ProfileAvatar user={user} className="size-8 text-xs" />
        <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>{t.account.pageTitle}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-3">
            <ProfileAvatar user={user} className="size-14 text-lg" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-foreground">{user.name}</span>
              <span className="truncate text-sm text-muted-foreground">{user.email}</span>
              {user.city && (
                <span className="truncate text-xs text-muted-foreground">{user.city}</span>
              )}
            </div>
          </div>
          <Link
            href="/settings/security"
            onClick={() => setOpen(false)}
            className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start gap-2")}
          >
            <Settings className="size-4" />
            {t.shell.securitySettings}
          </Link>
          <button
            type="button"
            onClick={() => signOutAction()}
            className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start gap-2")}
          >
            <LogOut className="size-4" />
            {t.common.signOut}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
