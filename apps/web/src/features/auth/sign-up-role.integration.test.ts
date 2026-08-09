import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { signUp } from "./sign-up.service";

// Complète sign-up.service.integration.test.ts : vérifie spécifiquement le
// rôle attribué à l'inscription (docs/admin.md > Rôles — "USER par défaut,
// jamais choisi par l'utilisateur").
const createdEmails: string[] = [];

afterEach(async () => {
  const users = await prisma.user.findMany({ where: { email: { in: createdEmails } } });
  const userIds = users.map((user) => user.id);
  await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.account.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  createdEmails.length = 0;
});

function uniqueEmail(): string {
  const email = `sign-up-role-${crypto.randomUUID()}@paragliding-logbook.local`;
  createdEmails.push(email);
  return email;
}

describe("signUp role assignment (integration)", () => {
  it("defaults a new user to the USER role", async () => {
    const email = uniqueEmail();

    await signUp({
      name: "Jane Doe",
      email,
      password: "a-strong-password-12",
      confirmPassword: "a-strong-password-12",
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.role).toBe("USER");
  });

  it("ignores a role field even if smuggled into the raw sign-up input", async () => {
    const email = uniqueEmail();

    // signUpSchema (lib/validations/sign-up.ts) ne connaît pas "role" : Zod
    // supprime silencieusement les clés inconnues d'un objet, et seuls
    // name/email/password sont transmis à auth.api.signUpEmail (voir
    // sign-up.service.ts) — un rôle injecté ici ne peut structurellement pas
    // atteindre la base.
    await signUp({
      name: "Jane Doe",
      email,
      password: "a-strong-password-12",
      confirmPassword: "a-strong-password-12",
      role: "ADMIN",
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.role).toBe("USER");
  });
});
