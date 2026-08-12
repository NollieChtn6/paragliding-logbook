"use client";

import { useEffect } from "react";
import { toast } from "@/components/ui/toast";

// Monté une fois dans layout.tsx : enregistre public/sw.js. Ne rend rien,
// pure logique d'effet de bord — "serviceWorker" in navigator écarte les
// navigateurs/webviews qui ne le supportent pas, sans faire échouer le
// reste de l'app (docs/decisions/008).
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // hadController : distingue une vraie mise à jour (un SW contrôlait déjà
    // la page, un nouveau vient de prendre le relai — self.skipWaiting()/
    // clients.claim() dans sw.js déclenchent "controllerchange" dès que
    // l'activation est terminée) d'une toute première installation (pas de
    // contrôleur avant, "controllerchange" se déclenche aussi dans ce cas —
    // sans cette vérification, un tout nouvel utilisateur verrait "nouvelle
    // version disponible" dès sa première visite, ce qui n'a pas de sens.
    const hadController = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Échec de l'enregistrement du service worker :", error);
    });

    if (!hadController) {
      return;
    }

    function handleControllerChange() {
      toast.add({
        title: "Nouvelle version disponible",
        description: "Rechargez la page pour utiliser la dernière version.",
        type: "info",
        timeout: 0,
        actionProps: {
          children: "Recharger",
          onClick: () => window.location.reload(),
        },
      });
    }

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    return () =>
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
  }, []);

  return null;
}
