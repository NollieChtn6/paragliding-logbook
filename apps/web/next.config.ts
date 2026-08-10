import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // VERCEL_GIT_COMMIT_SHA est fournie par Vercel au build, mais jamais
    // exposée au bundle client sans le préfixe NEXT_PUBLIC_ (Next.js exige
    // ce préfixe littéralement dans le nom pour l'inliner côté client) —
    // voir lib/app-version.ts. Absente hors Vercel (build/dev local).
    NEXT_PUBLIC_APP_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
  },
  // Défense en profondeur (audit sécurité, item S6) : headers sans risque de
  // régression, pas de Content-Security-Policy ici — une CSP correcte pour
  // cette app (scripts Next.js/Vercel, police auto-hébergée) demande un
  // travail d'allowlist à part entière, hors périmètre de ce correctif.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
