import { hash } from "@node-rs/argon2";

// Argon2, conformément à CLAUDE.md (Authentification > Hash sécurisé des
// mots de passe avec Argon2). Utilisé dès le seed : même les utilisateurs de
// développement ne doivent pas avoir de mot de passe en clair en base.
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}
