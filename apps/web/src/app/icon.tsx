import { ImageResponse } from "next/og";
import { ParagliderWingGlyph } from "@/lib/icon-glyph";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Favicon complémentaire de favicon.ico : convention de fichier App Router,
// câble automatiquement <link rel="icon"> (voir layout.tsx, aucun champ
// metadata.icons à ajouter à la main). Glyphe dessiné (docs/decisions/009),
// pas l'emoji 🪂 encore utilisé ailleurs dans l'UI (connexion, inscription,
// AppShell/AdminShell, DesktopSidebar).
//
// favicon.ico ne peut PAS être généré dynamiquement comme ce fichier (Next.js
// ne le permet que pour .ico statique, voir sa doc app-icons.md) : le binaire
// commité a été rendu manuellement avec ce même glyphe/fond, pour ne pas
// laisser l'icône .ico par défaut de create-next-app (c'était le cas jusque-
// là, malgré ce fichier-ci). À régénérer à la main (rendre ce même composant
// en 16×16 et 32×32 via ImageResponse, assembler un .ico en y embarquant les
// PNG) si le glyphe ou la couleur changent à nouveau.
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#2563eb",
      }}
    >
      <ParagliderWingGlyph size={22} color="#f8fafc" />
    </div>,
    { ...size },
  );
}
