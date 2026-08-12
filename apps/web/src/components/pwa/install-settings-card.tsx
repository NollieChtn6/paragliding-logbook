"use client";

import { Download } from "lucide-react";
import { InstallOptions } from "@/components/pwa/install-options";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMounted } from "@/lib/use-mounted";

// Point de retour vers l'installation après un masquage de la carte du
// dashboard (InstallPrompt) : même InstallOptions, mais toujours affichée
// (pas de bouton fermer, pas de persistance localStorage) — /settings/
// security est une destination explicite, pas un nudge ponctuel
// (docs/decisions/008).
//
// Contrairement à InstallPrompt (dashboard), pas de masquage en mode
// standalone : l'usage type de cette carte est justement de l'ouvrir depuis
// l'app déjà installée sur son propre téléphone, pour montrer le QR code à
// quelqu'un d'autre — masquer la carte une fois installée casserait ce cas
// d'usage. InstallOptions bascule déjà naturellement sur le QR code dans ce
// contexte (beforeinstallprompt ne se déclenche jamais pour une app déjà
// installée, donc canInstall reste faux).
export function InstallSettingsCard() {
  const mounted = useMounted();

  if (!mounted) {
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
