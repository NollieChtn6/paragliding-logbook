import { SearchX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

// Généralise le pattern déjà utilisé pour /activities/[id]/not-found.tsx
// à la racine : sans ce fichier, une URL inconnue tombait sur l'écran 404
// par défaut de Next.js, hors charte THERMIK.
export default function NotFound() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center px-4 py-8">
      <EmptyState
        icon={SearchX}
        title="Page introuvable"
        description="Cette page n'existe pas ou plus."
        action={
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/">Retour à l'accueil</Link>}
          />
        }
      />
    </div>
  );
}
