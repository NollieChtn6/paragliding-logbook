"use client";

import { OctagonX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

// Frontière d'erreur racine (convention Next.js App Router, doit être un
// composant client) : sans ce fichier, une exception non attrapée tombait
// sur l'écran d'erreur par défaut de Next.js, hors charte THERMIK. Next.js
// journalise déjà error.digest côté serveur, pas besoin d'un console.error
// ici (voir l'absence de logging applicatif ailleurs dans le projet).
export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center px-4 py-8">
      <EmptyState
        icon={OctagonX}
        title="Une erreur est survenue"
        description="Une erreur inattendue s'est produite. Vous pouvez réessayer ou revenir à l'accueil."
        action={
          <div className="flex gap-2">
            <Button onClick={reset}>Réessayer</Button>
            <Button nativeButton={false} variant="outline" render={<Link href="/">Accueil</Link>} />
          </div>
        }
      />
    </div>
  );
}
