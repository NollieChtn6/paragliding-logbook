"use client";

import { WifiOff } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

// Page de repli servie par le service worker (public/sw.js) quand une
// navigation échoue faute de réseau — jamais atteinte via une navigation
// normale. Pas de fetch serveur : le réseau est hors service par définition
// ici (docs/decisions/008).
export default function OfflinePage() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center px-4 py-8">
      <EmptyState
        icon={WifiOff}
        title="Vous êtes hors ligne"
        description="Cette page nécessite une connexion internet. Réessayez une fois reconnecté·e."
        action={
          <Button type="button" variant="outline" onClick={() => location.reload()}>
            Réessayer
          </Button>
        }
      />
    </div>
  );
}
