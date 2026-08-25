import { ImageResponse } from "next/og";
import { ParagliderWingGlyph } from "@/lib/icon-glyph";

// Écran de lancement iOS (rel="apple-touch-startup-image", câblé dans
// layout.tsx > metadata.icons.other) : Android/Chrome dérive déjà son propre
// écran de lancement de manifest.ts (background_color/theme_color/icons),
// mais iOS n'a un équivalent basé sur le manifest que depuis iOS 15.4 — cette
// image sert de repli pour les versions antérieures et pour un rendu plus
// fidèle à la marque que le repli générique d'iOS (icône seule sur fond
// blanc). Une seule taille "universelle" plutôt qu'un jeu complet par
// appareil (voir docs/decisions/008 : même logique de sobriété que les
// icônes) : demande explicite d'un écran simple, pas d'un support pixel-perfect
// de chaque taille d'iPhone/iPad.
//
// force-static : voir icon-512/route.tsx, même raisonnement (contenu fixe).
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        // Cloud White (docs/ui-directions.md, DESIGN.md) : même fond que
        // --background en mode clair — le manifest ne déclare qu'une seule
        // background_color, cet écran reste cohérent avec elle plutôt que de
        // tenter un rendu sombre qu'iOS ne sait pas sélectionner de façon
        // fiable ici.
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 200,
          height: 200,
          borderRadius: 44,
          // Dégradé Altitude Blue -> Thermal Amber : identique au badge de
          // marque de DesktopSidebar/AppShell (bg-gradient-to-br
          // from-primary to-accent).
          backgroundImage: "linear-gradient(135deg, #2563eb, #f59e0b)",
        }}
      >
        <ParagliderWingGlyph size={100} color="#f8fafc" />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: -1,
            // Ink (DESIGN.md) : texte principal en mode clair.
            color: "#0f172a",
          }}
        >
          THERMIK
        </div>
        <div
          style={{
            fontSize: 26,
            // Slate (DESIGN.md) : texte secondaire.
            color: "#64748b",
          }}
        >
          Carnet de vols &amp; progression
        </div>
      </div>
    </div>,
    { width: 1170, height: 2532 },
  );
}
