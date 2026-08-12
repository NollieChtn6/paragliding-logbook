"use client";

import { Download } from "lucide-react";
import { InstallOptions } from "@/components/pwa/install-options";
import { useInstallPrompt } from "@/components/pwa/install-prompt-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMounted } from "@/lib/use-mounted";

// Point de retour vers l'installation après un masquage de la carte du
// dashboard (InstallPrompt) : même InstallOptions, mais toujours affichée
// (pas de bouton fermer, pas de persistance localStorage) — /settings/
// security est une destination explicite, pas un nudge ponctuel
// (docs/decisions/008).
export function InstallSettingsCard() {
  const mounted = useMounted();
  const { standalone } = useInstallPrompt();

  if (!mounted || standalone) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="size-4 text-primary" aria-hidden />
          Installer l&apos;application
        </CardTitle>
      </CardHeader>
      <CardContent>
        <InstallOptions />
      </CardContent>
    </Card>
  );
}
