import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSite } from "./create-site.service";
import { getSite } from "./get-site.service";
import { listSites } from "./list-sites.service";

let siteId: string;
let uniqueName: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  uniqueName = `List Site Search Test ${suffix}`;
  const site = await createSite({ name: uniqueName });
  siteId = site.id;
});

afterAll(async () => {
  await prisma.site.deleteMany({ where: { id: siteId } });
  await prisma.$disconnect();
});

describe("listSites (integration)", () => {
  it("finds a site by a case-insensitive partial name match", async () => {
    const results = await listSites(uniqueName.toLowerCase().slice(0, 10));
    expect(results.some((site) => site.id === siteId)).toBe(true);
  });

  it("returns no results for a query that matches nothing", async () => {
    const results = await listSites("this-query-should-not-match-anything-xyz");
    expect(results).toHaveLength(0);
  });

  it("includes the point count", async () => {
    const results = await listSites(uniqueName);
    expect(results[0]?._count.points).toBe(0);
  });
});

describe("getSite (integration)", () => {
  it("returns the site with its points", async () => {
    const site = await getSite(siteId);
    expect(site?.id).toBe(siteId);
    expect(site?.points).toEqual([]);
  });

  it("returns null when the site does not exist", async () => {
    const site = await getSite(crypto.randomUUID());
    expect(site).toBeNull();
  });
});
