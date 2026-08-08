import { afterAll, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { DEV_USER_EMAIL } from "@/lib/dev-fixtures";
import { prisma } from "@/lib/prisma";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("auth (integration)", () => {
  it("signs in the seeded dev user with its Argon2-hashed credential", async () => {
    const password = process.env.DEV_USER_PASSWORD;
    if (!password) {
      throw new Error("DEV_USER_PASSWORD manquant (voir apps/web/.env) : lancez pnpm prisma:seed.");
    }

    const result = await auth.api.signInEmail({
      body: { email: DEV_USER_EMAIL, password },
    });

    expect(result.user.email).toBe(DEV_USER_EMAIL);
  });

  it("rejects an incorrect password for the seeded dev user", async () => {
    await expect(
      auth.api.signInEmail({
        body: { email: DEV_USER_EMAIL, password: "definitely-not-the-right-password" },
      }),
    ).rejects.toThrow();
  });
});
