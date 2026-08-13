import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { updateProfile } from "./update-profile.service";

const t = getDictionary("fr-FR").validation.updateProfile;

// Fixtures propres à ce test, indépendantes du seed dev.
let userId: string;
let email: string;
const PASSWORD = "a-strong-password-1234";

// Même technique que change-password.service.integration.test.ts : reconstruit
// un en-tête Cookie à partir du Set-Cookie renvoyé par signInEmail, pour
// simuler une session authentifiée hors d'une vraie requête Next.js.
async function signInHeaders(): Promise<Headers> {
  const { headers: responseHeaders } = await auth.api.signInEmail({
    body: { email, password: PASSWORD },
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
  email = `update-profile-${suffix}@paragliding-logbook.local`;
  const user = await prisma.user.create({ data: { email, name: "Initial Name" } });
  userId = user.id;
  await prisma.account.create({
    data: {
      userId,
      providerId: "credential",
      accountId: userId,
      password: await hashPassword(PASSWORD),
    },
  });
});

afterAll(async () => {
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("updateProfile (integration)", () => {
  it("updates the user's name", async () => {
    const headers = await signInHeaders();

    await updateProfile(headers, { name: "New Name" }, t);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.name).toBe("New Name");
  });

  it("rejects an empty name without changing the stored value", async () => {
    const headers = await signInHeaders();
    const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    await expect(updateProfile(headers, { name: "" }, t)).rejects.toThrow();

    const after = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(after.name).toBe(before.name);
  });

  it("updates the user's city", async () => {
    const headers = await signInHeaders();

    await updateProfile(headers, { name: "New Name", city: "Annecy" }, t);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.city).toBe("Annecy");
  });

  it("accepts an empty city (optional field, clears the stored value)", async () => {
    const headers = await signInHeaders();
    await updateProfile(headers, { name: "New Name", city: "Annecy" }, t);

    await updateProfile(headers, { name: "New Name", city: "" }, t);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.city).toBeNull();
  });
});
