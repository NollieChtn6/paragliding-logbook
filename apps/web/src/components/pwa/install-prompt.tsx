"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/components/locale-provider";
import { InstallOptions } from "@/components/pwa/install-options";
import { useInstallPrompt } from "@/components/pwa/install-prompt-provider";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMounted } from "@/lib/use-mounted";

const DISMISS_KEY = "thermik-install-dismissed";

type InstallPromptProps = {
  // Même signal que la grille de stats masquée (audit UX, item U4,
  // app/(app)/page.tsx) : pas de nudge d'installation avant le premier vol,
  // ça entrerait en concurrence avec l'EmptyState "Ajouter une activité".
  hasActivities: boolean;
};

// Carte du dashboard, masquable — refermée une fois, elle ne réapparaît
// plus dans ce navigateur (localStorage). Le point de retour après un
// masquage vit dans /settings/security (même InstallOptions, sans le
// masquage), pas ici (docs/decisions/008).
export function InstallPrompt({ hasActivities }: InstallPromptProps) {
  const mounted = useMounted();
  const { standalone } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const t = useT();

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  if (!mounted || standalone || dismissed || !hasActivities) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="size-4 text-primary" aria-hidden />
          {t.pwa.installTitle}
        </CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t.pwa.close}
            title={t.pwa.close}
            onClick={handleDismiss}
          >
            <X className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <InstallOptions />
      </CardContent>
    </Card>
  );
}
