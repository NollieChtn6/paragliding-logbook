import { Award } from "lucide-react";
import Link from "next/link";
import { QualificationDeleteButton } from "./qualification-delete-button";

type QualificationCardProps = {
  href: string;
  typeLabel: string;
  school: string | null;
  obtainedDateLabel: string;
  deleteAction: (
    prevState: { success: true } | { success: false; error: string } | null,
    formData: FormData,
  ) => Promise<{ success: true } | { success: false; error: string }>;
  deleteEntityLabel: string;
};

// Même gabarit que ActivityCard (components/activity-card.tsx) : un brevet
// est une donnée personnelle, pas une ligne de référentiel admin (voir
// critique /impeccable, P1 — la liste empruntait le Table d'admin/schools
// au lieu du badge icône coloré déjà utilisé partout ailleurs dans l'app).
// bg-accent/15 text-accent + Award : même paire icône/teinte que les
// paliers de progression (app/(app)/progression/page.tsx) — un brevet est
// un accomplissement au même titre qu'un palier, pas un vol/stage/gonflage,
// d'où un badge distinct de ACTIVITY_TYPE_STYLE plutôt qu'une 4e entrée.
// Un seul bouton d'action explicite (Supprimer) hors du Link, comme
// ActivityCard : le titre sert déjà de lien vers la modification, inutile
// de dupliquer un bouton crayon à côté (qui, resserré contre un bouton
// supprimer, était le red flag d'utilisatrice mobile relevé par la
// critique).
export function QualificationCard({
  href,
  typeLabel,
  school,
  obtainedDateLabel,
  deleteAction,
  deleteEntityLabel,
}: QualificationCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="flex size-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent"
          aria-hidden
        >
          <Award className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{typeLabel}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {school ? `${obtainedDateLabel} · ${school}` : obtainedDateLabel}
          </span>
        </span>
      </Link>
      <QualificationDeleteButton action={deleteAction} entityLabel={deleteEntityLabel} />
    </div>
  );
}
