import { afterEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Compte propre à chaque test (créé via auth.api.signUpEmail, désormais
// activé — voir lib/auth.ts), plus de dépendance à un compte de
// développement seedé ni à DEV_USER_PASSWORD (voir
// features/auth/sign-up.service.integration.test.ts pour les tests de
// signUp lui-même).
const password = "a-strong-password-12";
let userId: string | undefined;

afterEach(async () => {
  if (!userId) return;
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  userId = undefined;
});

describe("auth (integration)", () => {
  it("signs in a user created via signUpEmail with its Argon2-hashed credential", async () => {
    const email = `auth-integration-${crypto.randomUUID()}@paragliding-logbook.local`;
    const signUpResult = await auth.api.signUpEmail({
      body: { name: "Auth Integration Test User", email, password },
    });
    userId = signUpResult.user.id;

    const result = await auth.api.signInEmail({ body: { email, password } });

    expect(result.user.email).toBe(email);
  });

  it("rejects an incorrect password", async () => {
    const email = `auth-integration-${crypto.randomUUID()}@paragliding-logbook.local`;
    const signUpResult = await auth.api.signUpEmail({
      body: { name: "Auth Integration Test User", email, password },
    });
    userId = signUpResult.user.id;

    await expect(
      auth.api.signInEmail({
        body: { email, password: "definitely-not-the-right-password" },
      }),
    ).rejects.toThrow();
  });
});
