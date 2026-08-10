import { Loader2Icon } from "lucide-react";

// Fallback des loading.tsx (Suspense implicite de Next.js) : rendu à la
// place de {children} dans le layout englobant (AppShell/AdminShell restent
// affichés instantanément, seule la zone de contenu affiche le loader) le
// temps qu'une page async se charge. Même icône que le toast "loading"
// (components/ui/toast.tsx), pour rester cohérent.
export function PageLoader() {
  return (
    <div
      className="flex flex-1 items-center justify-center py-24"
      role="status"
      aria-label="Chargement"
    >
      <Loader2Icon className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
    </div>
  );
}
