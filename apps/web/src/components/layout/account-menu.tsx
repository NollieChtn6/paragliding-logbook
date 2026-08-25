"use client";

import { Award, ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/actions/sign-out";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AccountMenuProps = {
  // false sur /settings/security elle-même : un lien vers la page où l'on
  // se trouve déjà n'a pas de sens.
  showSecurityLink?: boolean;
  // "icon" : bouton icône seule, en-tête mobile (AppShell, AdminShell,
  // settings/layout.tsx), où la place est comptée. "full" : bouton pleine
  // largeur avec libellé, pied de DesktopSidebar/AdminShell (aside), où un
  // simple pictogramme serait moins découvrable sans le manque de place qui
  // le justifie sur mobile.
  trigger?: "icon" | "full";
};

// Réglages de sécurité + déconnexion derrière un seul menu — thème et
// langue vivent à côté (ThemeToggle/LocaleToggle, toujours visibles) plutôt
// qu'à l'intérieur : les enterrer dans ce menu les rendait moins accessibles
// pour un réglage qu'on peut vouloir changer souvent (retour utilisatrice).
// Décliné en deux présentations (icône compacte sur mobile, bouton pleine
// largeur en pied de sidebar sur desktop).
export function AccountMenu({ showSecurityLink = true, trigger = "icon" }: AccountMenuProps) {
  const t = useT();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          trigger === "full" ? (
            <Button type="button" variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-1.5">
                <User className="size-4" aria-hidden />
                {t.account.pageTitle}
              </span>
              <ChevronDown className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t.shell.menu}
              title={t.shell.menu}
            >
              <Menu />
            </Button>
          )
        }
      />
      <DropdownMenuContent align={trigger === "full" ? "start" : "end"}>
        {showSecurityLink && (
          <DropdownMenuItem
            className="cursor-pointer"
            render={
              <Link href="/settings/security" title={t.shell.securitySettings}>
                <Settings />
                {t.shell.securitySettings}
              </Link>
            }
          />
        )}
        <DropdownMenuItem
          className="cursor-pointer"
          render={
            <Link href="/qualifications" title={t.shell.qualificationsLink}>
              <Award />
              {t.shell.qualificationsLink}
            </Link>
          }
        />
        <DropdownMenuItem
          className="cursor-pointer"
          title={t.common.signOut}
          onClick={() => signOutAction()}
        >
          <LogOut />
          {t.common.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
