"use client";

import { useInstallPrompt } from "@/components/pwa/install-prompt-provider";
import { InstallQrCode } from "@/components/pwa/install-qr-code";
import { Button } from "@/components/ui/button";

// Contenu partagé entre la carte dashboard (InstallPrompt, masquable) et la
// carte /settings/security (toujours disponible, sert de point de retour
// après un premier masquage sur le dashboard) — même moment UX ("voici
// comment installer"), pas dupliqué deux fois. Branché sur la détection de
// fonctionnalité (canInstall, depuis InstallPromptProvider), jamais sur un
// sniffing d'OS/navigateur.
export function InstallOptions() {
  const { canInstall, promptInstall } = useInstallPrompt();

  if (canInstall) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Ajoutez THERMIK à votre écran d&apos;accueil pour un accès rapide, comme une application
          native.
        </p>
        <Button type="button" onClick={promptInstall}>
          Installer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <InstallQrCode />
      <p className="text-sm text-muted-foreground">
        Scannez ce code avec votre téléphone pour ouvrir THERMIK, puis ajoutez-le à l&apos;écran
        d&apos;accueil (menu Partager sur iOS, « Installer l&apos;application » sur Android).
      </p>
    </div>
  );
}
