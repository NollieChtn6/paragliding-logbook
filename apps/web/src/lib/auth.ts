import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

// Pas d'inscription publique dans le MVP (CLAUDE.md > Authentification) :
// disableSignUp bloque l'endpoint sign-up au niveau API, pas seulement
// l'absence de page. Les comptes sont créés uniquement par le seed pour l'instant.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    password: {
      hash: hashPassword,
      verify: ({ password, hash }) => verifyPassword(password, hash),
    },
  },
  // Identifiants alignés sur la convention @db.Uuid déjà utilisée par tout le
  // reste du schéma (voir prisma/schema.prisma) plutôt que le format par
  // défaut de Better Auth.
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  // Pose le cookie de session via next/headers lors d'un appel auth.api.*
  // depuis une Server Action (voir src/actions/sign-in.ts). Doit rester le
  // dernier plugin de la liste (contrainte Better Auth).
  plugins: [nextCookies()],
});
