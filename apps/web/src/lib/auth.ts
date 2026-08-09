import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

// Inscription publique (CLAUDE.md > Authentification) : email + mot de passe
// via /sign-up (src/app/sign-up), auth.api.signUpEmail reste l'unique
// responsable de la création du compte credential (voir features/auth/sign-up.service.ts).
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
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
