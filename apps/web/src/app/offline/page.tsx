"use client";

import { WifiOff } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

// Page de repli servie par le service worker (public/sw.js) quand une
// navigation échoue faute de réseau — jamais atteinte via une navigation
// normale. Pas de fetch serveur : le réseau est hors service par définition
// ici (docs/decisions/008). "use client" et useT() (plutôt que getLocale()
// côté serveur) restent valables même hors ligne : cette page est
// précachée par le service worker au moment de l'installation (en ligne),
// HTML déjà rendu avec la langue active à ce moment-là (voir sw.js).
export default function OfflinePage() {
  const t = useT().offlinePage;

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center px-4 py-8">
      <EmptyState
        icon={WifiOff}
        title={t.title}
        description={t.description}
        action={
          <Button type="button" variant="outline" onClick={() => location.reload()}>
            {t.retry}
          </Button>
        }
      />
    </div>
  );
}
