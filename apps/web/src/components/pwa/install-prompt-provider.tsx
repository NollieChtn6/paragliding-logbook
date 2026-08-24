"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useT } from "@/components/locale-provider";
import { toast } from "@/components/ui/toast";

// beforeinstallprompt n'est pas dans le lib.dom.d.ts de TypeScript (API
// encore non standardisée) — type minimal local, juste ce qu'on utilise.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallPromptContextValue = {
  canInstall: boolean;
  standalone: boolean;
  promptInstall: () => Promise<void>;
};

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null);

// Capture beforeinstallprompt une seule fois, au niveau racine (monté dans
// layout.tsx) — pas dans chaque composant qui veut proposer l'installation
// (dashboard, /settings/security). L'évènement ne se déclenche qu'une fois
// par chargement de page : le capturer localement dans plusieurs composants
// distincts risquerait de le manquer selon la page affichée au moment où le
// navigateur le déclenche, alors qu'une navigation côté client (App Router)
// ne recharge pas la page — le contexte, lui, survit à la navigation
// puisqu'il vit dans le layout racine (docs/decisions/008).
export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const t = useT();

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);

    function handleBeforeInstallPrompt(event: Event) {
      // Empêche la mini-barre d'installation automatique de Chrome : on
      // contrôle nous-mêmes quand proposer l'installation, pas le
      // navigateur.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) {
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    // L'onglet en cours ne bascule pas lui-même en mode standalone après
    // acceptation (l'app installée est une fenêtre distincte) : sans ce
    // toast, accepter l'installation ne donnait jusqu'ici aucun retour, la
    // carte/le bouton restant affichés tels quels.
    if (outcome === "accepted") {
      toast.add({
        title: t.pwa.installSuccessTitle,
        description: t.pwa.installSuccessDescription,
        type: "success",
      });
    }
  }

  return (
    <InstallPromptContext.Provider
      value={{ canInstall: deferredPrompt !== null, standalone, promptInstall }}
    >
      {children}
    </InstallPromptContext.Provider>
  );
}

export function useInstallPrompt(): InstallPromptContextValue {
  const context = useContext(InstallPromptContext);
  if (!context) {
    throw new Error("useInstallPrompt doit être utilisé sous InstallPromptProvider.");
  }
  return context;
}
