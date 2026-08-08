import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ActivityNotFound() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Activité introuvable
      </h1>
      <p className="text-muted-foreground">
        Cette activité n&apos;existe pas ou ne vous appartient pas.
      </p>
      <Button render={<Link href="/activities">Retour aux activités</Link>} />
    </div>
  );
}
