import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { searchSites } from "./search-sites.service";

let siteId: string;
let otherSiteId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [site, otherSite] = await Promise.all([
    prisma.site.create({ data: { name: `Search Sites Test ${suffix}`, region: "Savoie" } }),
    prisma.site.create({ data: { name: `Search Sites Other ${suffix}` } }),
  ]);
  siteId = site.id;
  otherSiteId = otherSite.id;
});

afterAll(async () => {
  await prisma.site.deleteMany({ where: { id: { in: [siteId, otherSiteId] } } });
  await prisma.$disconnect();
});

describe("searchSites (integration)", () => {
  it("finds a site by name", async () => {
    const results = await searchSites({ query: "Search Sites Test" });

    expect(results.some((site) => site.id === siteId)).toBe(true);
    expect(results.some((site) => site.id === otherSiteId)).toBe(false);
  });

  it("is case-insensitive", async () => {
    const results = await searchSites({ query: "search sites test" });

    expect(results.some((site) => site.id === siteId)).toBe(true);
  });

  it("returns the region alongside the name", async () => {
    const results = await searchSites({ query: "Search Sites Test" });

    const match = results.find((site) => site.id === siteId);
    expect(match?.region).toBe("Savoie");
  });
});
