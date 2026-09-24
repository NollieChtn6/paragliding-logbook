import path from "node:path";
import { Font } from "@react-pdf/renderer";

export const PDF_FONT_FAMILY = "Plus Jakarta Sans";

const FONTS_DIR = path.join(process.cwd(), "src", "lib", "pdf", "fonts");

// TTF statiques dédiées (Regular/Medium/Bold), distinctes du fichier
// variable WOFF2 servi sur le web (app/layout.tsx) : Font.register de
// @react-pdf/renderer documente son support des polices personnalisées
// comme fiable en TTF/OTF mais instable en WOFF2 (ADR 013). Mêmes glyphes,
// même licence OFL (./fonts/plus-jakarta-sans-LICENSE.txt), instanciées
// depuis la police variable Google Fonts à wght=400/500/700. Chemin absolu
// (process.cwd(), pas un chemin relatif) : Font.register lit le fichier
// depuis le système de fichiers du serveur, indépendamment du module
// appelant.
let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;

  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: [
      { src: path.join(FONTS_DIR, "plus-jakarta-sans-regular.ttf"), fontWeight: "normal" },
      { src: path.join(FONTS_DIR, "plus-jakarta-sans-medium.ttf"), fontWeight: "medium" },
      { src: path.join(FONTS_DIR, "plus-jakarta-sans-bold.ttf"), fontWeight: "bold" },
    ],
  });

  registered = true;
}
