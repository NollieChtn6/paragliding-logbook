import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { changePassword } from "./change-password.service";

// Fixtures propres à ce test, indépendantes du seed dev.
let userId: string;
let email: string;
const INITIAL_PASSWORD = "initial-password-1234";

// auth.api.signInEmail({ ..., returnHeaders: true }) renvoie les en-têtes de
// réponse (dont Set-Cookie) même hors d'une vraie requête Next.js (le
// plugin nextCookies() ne pose le cookie via next/headers que lorsqu'un
// contexte de requête existe — voir lib/auth.integration.test.ts qui appelle
// déjà signInEmail directement en test, sans requête Next). On reconstruit
// un en-tête Cookie à partir du Set-Cookie pour simuler la requête suivante
// du navigateur (changePassword a besoin d'une session authentifiée).
async function signInHeaders(password: string): Promise<Headers> {
  const { headers: responseHeaders } = await auth.api.signInEmail({
    body: { email, password },
    returnHeaders: true,
  });
  const setCookie = responseHeaders.get("set-cookie");
  if (!setCookie) {
    throw new Error("signInEmail did not return a Set-Cookie header for this test fixture");
  }
  const cookiePair = setCookie.split(";")[0];
  return new Headers({ cookie: cookiePair ?? "" });
}

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  email = `change-password-${suffix}@paragliding-logbook.local`;
  const user = await prisma.user.create({
    data: { email, name: "Change Password Test User" },
  });
  userId = user.id;
  await prisma.account.create({
    data: {
      userId,
      providerId: "credential",
      accountId: userId,
      password: await hashPassword(INITIAL_PASSWORD),
    },
  });
});

afterAll(async () => {
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("changePassword (integration)", () => {
  it("rejects an incorrect current password without changing the stored hash", async () => {
    const headers = await signInHeaders(INITIAL_PASSWORD);
    const accountBefore = await prisma.account.findFirstOrThrow({
      where: { userId, providerId: "credential" },
    });

    await expect(
      changePassword(headers, {
        currentPassword: "definitely-the-wrong-password",
        newPassword: "a-new-password-1234",
        confirmPassword: "a-new-password-1234",
      }),
    ).rejects.toThrow();

    const accountAfter = await prisma.account.findFirstOrThrow({
      where: { userId, providerId: "credential" },
    });
    expect(accountAfter.password).toBe(accountBefore.password);
  });

  it("changes the password, replaces the stored hash, and the new password works while the old one doesn't", async () => {
    const headers = await signInHeaders(INITIAL_PASSWORD);
    const accountBefore = await prisma.account.findFirstOrThrow({
      where: { userId, providerId: "credential" },
    });
    const newPassword = "a-successfully-changed-password-1234";

    await changePassword(headers, {
      currentPassword: INITIAL_PASSWORD,
      newPassword,
      confirmPassword: newPassword,
    });

    const accountAfter = await prisma.account.findFirstOrThrow({
      where: { userId, providerId: "credential" },
    });
    expect(accountAfter.password).not.toBe(accountBefore.password);

    const signInWithNewPassword = await auth.api.signInEmail({
      body: { email, password: newPassword },
    });
    expect(signInWithNewPassword.user.email).toBe(email);

    await expect(
      auth.api.signInEmail({ body: { email, password: INITIAL_PASSWORD } }),
    ).rejects.toThrow();
  });
});
