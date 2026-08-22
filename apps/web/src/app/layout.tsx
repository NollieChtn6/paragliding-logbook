import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { EnvironmentBanner } from "@/components/environment-banner";
import { LocaleProvider } from "@/components/locale-provider";
import { InstallPromptProvider } from "@/components/pwa/install-prompt-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastListener } from "@/components/toast-listener";
import { Toaster } from "@/components/ui/toast";
import { getLocale } from "@/lib/i18n/get-locale";
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
  // statusBarStyle "default" (pas "black-translucent") : ce dernier fait
  // passer le contenu sous la barre de statut iOS, ce que l'app ne gère nulle
  // part (pas de padding de zone de sécurité en haut, seulement en bas pour
  // MobileBottomNav) — aurait fait passer du contenu sous l'encoche/l'île
  // dynamique sans qu'on l'ait demandé (docs/decisions/008).
  appleWebApp: { title: "THERMIK", statusBarStyle: "default" },
  icons: {
    // rel="apple-touch-startup-image" (app/apple-splash/route.tsx) : repli
    // pour l'écran de lancement iOS sur les versions antérieures à iOS 15.4,
    // qui ne dérivent pas encore leur propre écran de lancement de
    // manifest.ts. Aucune media query par appareil (voir le commentaire de
    // apple-splash/route.tsx) : une seule image sert de repli universel.
    other: [{ rel: "apple-touch-startup-image", url: "/apple-splash" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale === "en-GB" ? "en" : "fr"}
      className={`${fontSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* suppressHydrationWarning : certaines extensions navigateur (ex.
      ColorZilla) injectent un attribut sur <body> avant l'hydratation
      (ex. cz-shortcut-listen), provoquant un faux positif d'avertissement
      d'hydratation sans rapport avec notre code. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {/* Hors de ThemeProvider/Toaster : ne dépend d'aucun état client,
        doit rester visible même si l'un de ces providers échoue. */}
        <EnvironmentBanner locale={locale} />
        <LocaleProvider initialLocale={locale}>
          {/* ServiceWorkerRegistration a besoin de useT() (toast "nouvelle
          version disponible") : doit vivre sous LocaleProvider, mais reste
          hors de ThemeProvider/Toaster comme avant — pas de dépendance au
          thème. */}
          <ServiceWorkerRegistration />
          <ThemeProvider>
            <Toaster>
              <Suspense fallback={null}>
                <ToastListener />
              </Suspense>
              <InstallPromptProvider>{children}</InstallPromptProvider>
            </Toaster>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
