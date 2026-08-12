import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Icône d'écran d'accueil iOS (convention de fichier App Router, câble
// automatiquement <link rel="apple-touch-icon">) : fond opaque obligatoire,
// iOS rend toute transparence en noir plein — voir docs/decisions/008.
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#2563eb",
        fontSize: 110,
      }}
    >
      🪂
    </div>,
    { ...size },
  );
}
