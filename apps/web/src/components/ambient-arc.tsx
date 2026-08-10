// Touche de couleur décorative sur l'interface après connexion (demande
// explicite, pas dans docs/ui-directions.md à ce jour) : trois ellipses
// radiales superposées, de hauteurs et largeurs différentes, plutôt qu'une
// seule — évoque une silhouette de montagnes en arrière-plan plutôt qu'un
// simple dôme. Vert plus sombre et plus fondu qu'un premier essai (retour
// utilisateur), et volontairement distinct de --success (sémantique,
// réservé aux états de réussite) — celui-ci est purement décoratif. Fondu
// vers transparent (pas vers var(--background)) : le fond réel de body
// (bg-background, voir globals.css) apparaît tel quel derrière, donc
// s'adapte déjà automatiquement au thème clair/sombre sans rien de plus.
export function AmbientArc() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        background: [
          "radial-gradient(ellipse 56vw 60vh at 26% 122%, rgb(21 128 61 / 45%) 0%, rgb(21 128 61 / 18%) 45%, transparent 78%)",
          "radial-gradient(ellipse 66vw 48vh at 70% 128%, rgb(21 128 61 / 38%) 0%, rgb(21 128 61 / 14%) 45%, transparent 75%)",
          "radial-gradient(ellipse 190vw 72vh at 50% 122%, rgb(21 128 61 / 26%) 0%, rgb(21 128 61 / 8%) 45%, transparent 80%)",
        ].join(", "),
      }}
    />
  );
}
