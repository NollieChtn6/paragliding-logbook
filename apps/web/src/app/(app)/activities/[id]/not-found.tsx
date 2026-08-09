import { SearchX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function ActivityNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Activité introuvable"
      description="Cette activité n'existe pas ou ne vous appartient pas."
      action={
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/activities">Retour aux activités</Link>}
        />
      }
    />
  );
}
