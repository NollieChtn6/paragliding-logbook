import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSite } from "./create-site.service";

const createdIds: string[] = [];

afterEach(async () => {
  await prisma.site.deleteMany({ where: { id: { in: createdIds } } });
  createdIds.length = 0;
});

describe("createSite (integration)", () => {
  it("creates a site with the submitted data", async () => {
    const suffix = crypto.randomUUID();
    const site = await createSite({
      name: `Integration Test Site ${suffix}`,
      region: "Auvergne-Rhône-Alpes",
      countryCode: "fr",
      latitude: "45.3",
      longitude: "5.9",
    });
    createdIds.push(site.id);

    expect(site.name).toBe(`Integration Test Site ${suffix}`);
    expect(site.region).toBe("Auvergne-Rhône-Alpes");
    expect(site.countryCode).toBe("FR");
    expect(site.latitude).toBe(45.3);
    expect(site.longitude).toBe(5.9);
  });

  it("creates a site with only a name", async () => {
    const suffix = crypto.randomUUID();
    const site = await createSite({ name: `Integration Test Site ${suffix}` });
    createdIds.push(site.id);

    expect(site.region).toBeNull();
    expect(site.countryCode).toBeNull();
  });

  it("fails with invalid data", async () => {
    await expect(createSite({ name: "" })).rejects.toThrow();
  });
});
