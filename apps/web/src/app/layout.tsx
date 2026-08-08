import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Plus Jakarta Sans (SIL OFL, docs/ui-directions.md) auto-hébergée : fichier
// variable (poids 200–800) copié depuis @fontsource-variable/plus-jakarta-sans
// dans ./fonts, pas de dépendance à next/font/google ni à une CDN de polices.
// Licence : ./fonts/plus-jakarta-sans-LICENSE.txt.
const fontSans = localFont({
  src: "./fonts/plus-jakarta-sans-variable-latin.woff2",
  variable: "--font-sans",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "THERMIK — Carnet de vols & progression",
  description:
    "THERMIK, carnet de vols & progression : suivez vos vols, stages et gonflages, et votre progression en parapente.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${fontSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
