import { APIError } from "better-auth/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { SignUpNotAllowedError } from "@/lib/signup-invite-code";
import { signUp } from "./sign-up.service";

// Emails créés par les tests, nettoyés après chaque test (pas de beforeAll
// partagé : chaque test crée son propre compte pour rester indépendant, même
// principe que change-password.service.integration.test.ts).
const createdEmails: string[] = [];

function uniqueEmail(): string {
  const email = `sign-up-${crypto.randomUUID()}@paragliding-logbook.local`;
  createdEmails.push(email);
  return email;
}

// Neutralise SIGNUP_INVITE_CODE par défaut : les tests qui ne portent pas
// dessus doivent rester indépendants du .env local de la machine qui
// exécute les tests, les deux tests dédiés au code (plus bas) le
// redéfinissent explicitement.
beforeEach(() => {
  vi.stubEnv("SIGNUP_INVITE_CODE", "");
});

afterEach(async () => {
  const users = await prisma.user.findMany({ where: { email: { in: createdEmails } } });
  const userIds = users.map((user) => user.id);
  await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.account.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  createdEmails.length = 0;
  vi.unstubAllEnvs();
});

describe("signUp (integration)", () => {
  it("creates the User and credential Account with an Argon2 hash", async () => {
    const email = uniqueEmail();

    await signUp({
      name: "Jane Doe",
      email,
      password: "a-strong-password-12",
      confirmPassword: "a-strong-password-12",
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.name).toBe("Jane Doe");

    const account = await prisma.account.findFirstOrThrow({
      where: { userId: user.id, providerId: "credential" },
    });
    expect(account.password).not.toBe("a-strong-password-12");
  });

  it("rejects input that fails the Zod schema without calling Better Auth", async () => {
    await expect(
      signUp({
        name: "Jane Doe",
        email: "not-an-email",
        password: "a-strong-password-12",
        confirmPassword: "a-strong-password-12",
      }),
    ).rejects.toThrow();
  });

  it("rejects sign-up with an email that is already used", async () => {
    const email = uniqueEmail();
    await signUp({
      name: "Jane Doe",
      email,
      password: "a-strong-password-12",
      confirmPassword: "a-strong-password-12",
    });

    await expect(
      signUp({
        name: "Someone Else",
        email,
        password: "another-password-12",
        confirmPassword: "another-password-12",
      }),
    ).rejects.toThrow(APIError);
  });

  it("rejects sign-up with a wrong invite code, without creating a user", async () => {
    const email = uniqueEmail();
    vi.stubEnv("SIGNUP_INVITE_CODE", "482913");

    await expect(
      signUp({
        name: "Jane Doe",
        email,
        password: "a-strong-password-12",
        confirmPassword: "a-strong-password-12",
        inviteCode: "111111",
      }),
    ).rejects.toThrow(SignUpNotAllowedError);

    await expect(prisma.user.findUnique({ where: { email } })).resolves.toBeNull();
  });

  it("allows sign-up with the correct invite code", async () => {
    const email = uniqueEmail();
    vi.stubEnv("SIGNUP_INVITE_CODE", "482913");

    await signUp({
      name: "Jane Doe",
      email,
      password: "a-strong-password-12",
      confirmPassword: "a-strong-password-12",
      inviteCode: "482913",
    });

    await expect(prisma.user.findUnique({ where: { email } })).resolves.not.toBeNull();
  });
});
