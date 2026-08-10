// VERCEL_ENV (fourni par Vercel : "production" | "preview" | absent en local,
// jamais "development" hors `vercel dev`, qu'on n'utilise pas) plutôt que
// NODE_ENV, qui vaut "production" aussi bien en local après `pnpm build` que
// sur un vrai déploiement — ne distinguerait pas les deux. Rendu uniquement
// dans app/layout.tsx (racine, seul ancêtre commun à toutes les pages, y
// compris /sign-in et /sign-up) : composant serveur, aucune donnée sensible,
// pas besoin du préfixe NEXT_PUBLIC_.
function getEnvironmentLabel(): string | null {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "production") return null;
  if (vercelEnv === "preview") return "Preview";
  return "Local";
}

// Bandeau fixe pleine largeur, volontairement voyant (rouge) : sert
// uniquement en local/preview pour ne jamais confondre un environnement de
// test avec la production pendant une campagne de tests manuels.
export function EnvironmentBanner() {
  const label = getEnvironmentLabel();
  if (!label) return null;

  return (
    // fixed (pas sticky) : sticky reste dans le flux et réserve sa hauteur,
    // ce qui poussait le contenu et provoquait un scroll vertical sur les
    // écrans dont la hauteur est déjà calée sur le viewport (min-h-svh,
    // AppShell/AdminShell). fixed sort du flux, hauteur du document
    // inchangée. z-40 (pas z-50, réservé aux dialogs/menus/toasts,
    // components/ui/*.tsx) : ne doit jamais passer devant un élément
    // interactif, seulement au-dessus du contenu de page ordinaire.
    <div className="fixed inset-x-0 top-0 z-40 bg-destructive px-4 py-0.5 text-center text-[10px] font-semibold tracking-wide text-destructive-foreground uppercase">
      Environnement {label}
    </div>
  );
}
