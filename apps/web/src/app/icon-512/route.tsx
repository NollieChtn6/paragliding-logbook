import { ImageResponse } from "next/og";
import { ParagliderWingGlyph } from "@/lib/icon-glyph";

// Route dédiée (pas la convention icon.tsx, réservée au favicon 32×32) :
// icône 512×512 purpose "any" référencée par manifest.ts. Générée plutôt que
// committée en PNG statique, pour rester dérivée de la même source (glyphe +
// couleurs de marque) — voir docs/decisions/008. Glyphe dessiné depuis
// docs/decisions/009, plus l'appel au CDN emoji de next/og qu'implique le
// commentaire ci-dessous sur force-static.
//
// force-static : sans ça, un Route Handler ordinaire est régénéré à chaque
// requête (contrairement à icon.tsx/apple-icon.tsx, statiquement optimisés
// par convention) — inutile ici (contenu fixe).
export const dynamic = "force-static";

export async function GET() {
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
      <ParagliderWingGlyph size={340} color="#f8fafc" />
    </div>,
    { width: 512, height: 512 },
  );
}
