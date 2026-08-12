import { ImageResponse } from "next/og";

// Route dédiée (pas la convention icon.tsx, réservée au favicon 32×32) :
// icône 512×512 purpose "any" référencée par manifest.ts. Générée plutôt que
// committée en PNG statique, pour rester dérivée de la même source (glyphe +
// couleurs de marque) — voir docs/decisions/008.
//
// force-static : sans ça, un Route Handler ordinaire est régénéré à chaque
// requête (contrairement à icon.tsx/apple-icon.tsx, statiquement optimisés
// par convention) — inutile ici (contenu fixe) et évite de refaire l'appel
// au CDN emoji de next/og à chaque visite.
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
        fontSize: 320,
      }}
    >
      🪂
    </div>,
    { width: 512, height: 512 },
  );
}
