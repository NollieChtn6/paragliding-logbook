"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "@/components/ui/toast";

// Lit le paramètre `toast` déposé par withToast() (lib/toast-redirect.ts)
// sur l'URL de destination d'une Server Action réussie, affiche le toast de
// succès, puis retire le paramètre de l'URL pour ne pas le redéclencher au
// rafraîchissement ou au retour arrière. Monté une seule fois dans le layout
// racine (app/layout.tsx), au-dessus de toutes les pages.
export function ToastListener() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const message = searchParams.get("toast");

  useEffect(() => {
    if (!message) return;
    toast.add({ title: message, type: "success" });
    router.replace(pathname, { scroll: false });
  }, [message, pathname, router]);

  return null;
}
