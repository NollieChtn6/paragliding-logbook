import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Favicon complémentaire de favicon.ico (conservé tel quel) : convention de
// fichier App Router, câble automatiquement <link rel="icon"> (voir
// layout.tsx, aucun champ metadata.icons à ajouter à la main). Glyphe 🪂
// repris tel quel de la marque déjà utilisée dans l'UI (connexion,
// inscription, AppShell/AdminShell, DesktopSidebar) plutôt qu'un logo dédié
// (docs/decisions/008) — fontSize volontairement généreux pour rester lisible
// à cette taille.
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
        fontSize: 24,
      }}
    >
      🪂
    </div>,
    { ...size },
  );
}
