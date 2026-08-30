import { ImageResponse } from "next/og";
import { ParagliderWingGlyph } from "@/lib/icon-glyph";

// Variante maskable (purpose "maskable" dans manifest.ts) : le fond
// --primary couvre tout le canevas 512×512, mais le glyphe reste confiné à
// la zone de sécurité (~80% du canevas, ~409×409 centrés) — au-delà, le
// masque de forme Android (cercle/squircle/...) peut le rogner de façon
// imprévisible selon l'appareil. Taille volontairement plus petite que
// icon-512/route.tsx pour respecter cette marge — voir docs/decisions/008.
// Glyphe dessiné depuis docs/decisions/010.
//
// force-static : voir icon-512/route.tsx pour la justification.
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
      <ParagliderWingGlyph size={230} color="#f8fafc" />
    </div>,
    { width: 512, height: 512 },
  );
}
