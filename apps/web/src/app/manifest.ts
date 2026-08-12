import type { MetadataRoute } from "next";

// Convention de fichier App Router : câble automatiquement <link
// rel="manifest"> dans <head>, aucun champ metadata.manifest à ajouter à la
// main (voir layout.tsx). Généré statiquement au build (docs/decisions/008).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "THERMIK — Carnet de vols & progression",
    short_name: "THERMIK",
    description:
      "Carnet de vols & progression : suivez vos vols, stages et gonflages en parapente.",
    start_url: "/",
    display: "standalone",
    lang: "fr",
    // Valeur unique, contrairement au viewport.themeColor clair/sombre de
    // layout.tsx (le manifest n'a pas de notion de media query) — reprend
    // --background clair et --primary de globals.css (palette "ciel et
    // altitude").
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    icons: [
      { src: "/icon", sizes: "any", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
