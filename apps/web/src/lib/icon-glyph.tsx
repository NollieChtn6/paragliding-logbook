type ParagliderWingGlyphProps = {
  size: number;
  color: string;
};

// Glyphe partagé par toutes les icônes générées (favicon, PWA, iOS, écran de
// lancement) : silhouette de voile de parapente stylisée — arc large côté
// bord d'attaque, effilé côté bord de fuite, pointes aux extrémités. Remplace
// l'emoji 🪂 historique dans ces surfaces uniquement (docs/decisions/010) ;
// l'emoji reste utilisé tel quel ailleurs dans l'UI (connexion, inscription,
// DesktopSidebar). Un simple <path> plutôt qu'un détail multi-lignes : reste
// lisible à 32px (favicon) comme à 512px (icône PWA), un motif chargé se
// brouille aux petites tailles.
export function ParagliderWingGlyph({ size, color }: ParagliderWingGlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 16 C6 6 18 6 21 16 C18 11 6 11 3 16 Z" fill={color} />
    </svg>
  );
}
