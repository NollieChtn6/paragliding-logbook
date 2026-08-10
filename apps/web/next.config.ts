import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // VERCEL_GIT_COMMIT_SHA est fournie par Vercel au build, mais jamais
    // exposée au bundle client sans le préfixe NEXT_PUBLIC_ (Next.js exige
    // ce préfixe littéralement dans le nom pour l'inliner côté client) —
    // voir lib/app-version.ts. Absente hors Vercel (build/dev local).
    NEXT_PUBLIC_APP_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
  },
};

export default nextConfig;
