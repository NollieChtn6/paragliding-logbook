import { ImageResponse } from "next/og";
import { ParagliderWingGlyph } from "@/lib/icon-glyph";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Favicon complémentaire de favicon.ico (conservé tel quel) : convention de
// fichier App Router, câble automatiquement <link rel="icon"> (voir
// layout.tsx, aucun champ metadata.icons à ajouter à la main). Glyphe
// dessiné (docs/decisions/009), pas l'emoji 🪂 encore utilisé ailleurs dans
// l'UI (connexion, inscription, AppShell/AdminShell, DesktopSidebar).
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
