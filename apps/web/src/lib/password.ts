import { hash, verify } from "@node-rs/argon2";

// Argon2, conformément à CLAUDE.md (Authentification > Hash sécurisé des
// mots de passe avec Argon2). Utilisé dès le seed : même les utilisateurs de
// développement ne doivent pas avoir de mot de passe en clair en base.
//
// memoryCost/timeCost alignés sur la recommandation OWASP pour Argon2id
// (>= 19 Mo, 2 itérations) — la valeur par défaut de la lib (4 Mo) est en
// dessous. Ces paramètres sont encodés dans le hash produit (format PHC),
// verifyPassword n'a donc pas besoin de les reconnaître explicitement.
const ARGON2_OPTIONS = { memoryCost: 19456, timeCost: 2 };

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

// Branché sur emailAndPassword.password.verify de Better Auth (voir lib/auth.ts).
export function verifyPassword(password: string, hashValue: string): Promise<boolean> {
  return verify(hashValue, password);
}
