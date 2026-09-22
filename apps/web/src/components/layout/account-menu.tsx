"use client";

import { LogOut, Menu, Settings } from "lucide-react";
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
};

// Réglages de compte + déconnexion derrière un menu icône — thème et langue
// vivent à côté (ThemeToggle/LocaleToggle, toujours visibles) plutôt qu'à
// l'intérieur : les enterrer dans ce menu les rendait moins accessibles pour
// un réglage qu'on peut vouloir changer souvent (retour utilisatrice). Seul
// /settings (chrome minimal dédié, hors AppShell/AdminShell) utilise encore
// ce menu générique : AppShell et AdminShell affichent désormais l'identité
// via AccountSheet plutôt qu'un menu anonyme (voir son commentaire —
// critique /impeccable, P0), donc plus besoin ici d'une présentation "full".
export function AccountMenu({ showSecurityLink = true }: AccountMenuProps) {
  const t = useT();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t.shell.menu}
            title={t.shell.menu}
          >
            <Menu />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {showSecurityLink && (
          <DropdownMenuItem
            className="cursor-pointer"
            render={
              <Link href="/settings/security" title={t.shell.accountSettings}>
                <Settings />
                {t.shell.accountSettings}
              </Link>
            }
          />
        )}
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
