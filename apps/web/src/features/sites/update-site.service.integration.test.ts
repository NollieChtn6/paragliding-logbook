import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSite } from "./create-site.service";
import { updateSite } from "./update-site.service";

let siteId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  const site = await createSite({ name: `Update Site Test ${suffix}`, countryCode: "FR" });
  siteId = site.id;
});

afterAll(async () => {
  await prisma.site.deleteMany({ where: { id: siteId } });
  await prisma.$disconnect();
});

describe("updateSite (integration)", () => {
  it("updates the site with the submitted data", async () => {
    const updated = await updateSite(siteId, {
      name: "Updated Site Name",
      region: "Nouvelle région",
      countryCode: "CH",
    });

    expect(updated.name).toBe("Updated Site Name");
    expect(updated.region).toBe("Nouvelle région");
    expect(updated.countryCode).toBe("CH");
  });

  it("clears an optional field when it is omitted from the input", async () => {
    const updated = await updateSite(siteId, { name: "Updated Site Name" });

    expect(updated.region).toBeNull();
    expect(updated.countryCode).toBeNull();
  });

  it("fails with invalid data", async () => {
    await expect(updateSite(siteId, { name: "" })).rejects.toThrow();
  });

  it("fails when the site does not exist", async () => {
    await expect(updateSite(crypto.randomUUID(), { name: "Anything" })).rejects.toThrow();
  });
});
