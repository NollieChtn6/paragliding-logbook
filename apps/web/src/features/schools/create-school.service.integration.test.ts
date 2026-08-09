import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSchool } from "./create-school.service";

const createdIds: string[] = [];

afterEach(async () => {
  await prisma.school.deleteMany({ where: { id: { in: createdIds } } });
  createdIds.length = 0;
});

describe("createSchool (integration)", () => {
  it("creates a school with the submitted data", async () => {
    const suffix = crypto.randomUUID();
    const school = await createSchool({
      name: `Integration Test School ${suffix}`,
      address: "1 rue du Vol Libre",
      postalCode: "38660",
      city: "Plateau-des-Petites-Roches",
      countryCode: "fr",
      website: "https://www.exemple.fr",
    });
    createdIds.push(school.id);

    expect(school.name).toBe(`Integration Test School ${suffix}`);
    expect(school.countryCode).toBe("FR");
    expect(school.website).toBe("https://www.exemple.fr");
  });

  it("creates a school with only a name", async () => {
    const suffix = crypto.randomUUID();
    const school = await createSchool({ name: `Integration Test School ${suffix}` });
    createdIds.push(school.id);

    expect(school.address).toBeNull();
    expect(school.website).toBeNull();
  });

  it("fails with an invalid website URL", async () => {
    await expect(createSchool({ name: "Test", website: "not-a-url" })).rejects.toThrow();
  });

  it("fails with invalid data", async () => {
    await expect(createSchool({ name: "" })).rejects.toThrow();
  });
});
