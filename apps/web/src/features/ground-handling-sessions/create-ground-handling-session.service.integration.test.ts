import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createGroundHandlingSession } from "./create-ground-handling-session.service";

// Fixtures propres à ce test, indépendantes du seed dev (apps/web/prisma/seed.ts).
let userId: string;
let siteId: string;

const validGroundHandlingInput = {
  date: "2025-01-15",
  durationMin: "30",
  exercises: "Contrôle au sol, gestion des surventes.",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const user = await prisma.user.create({
    data: {
      email: `integration-test-ghs-${suffix}@paragliding-logbook.local`,
      name: "Integration Test User",
    },
  });
  userId = user.id;

  const site = await prisma.site.create({
    data: { name: `Integration Test Site ${suffix}` },
  });
  siteId = site.id;
});

afterAll(async () => {
  await prisma.groundHandlingSession.deleteMany({ where: { activity: { userId } } });
  await prisma.activity.deleteMany({ where: { userId } });
  await prisma.site.delete({ where: { id: siteId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("createGroundHandlingSession (integration)", () => {
  describe("with valid data", () => {
    let groundHandlingSessionId: string;
    let activityId: string;

    beforeAll(async () => {
      const groundHandlingSession = await createGroundHandlingSession(userId, {
        ...validGroundHandlingInput,
        siteId,
      });
      groundHandlingSessionId = groundHandlingSession.id;
      activityId = groundHandlingSession.activityId;
    });

    it("creates the Activity with the GROUND_HANDLING type and the right user", async () => {
      const activity = await prisma.activity.findUniqueOrThrow({
        where: { id: activityId },
        include: { activityType: true },
      });
      expect(activity.userId).toBe(userId);
      expect(activity.activityType.code).toBe("GROUND_HANDLING");
    });

    it("creates the GroundHandlingSession with the submitted data", async () => {
      const groundHandlingSession = await prisma.groundHandlingSession.findUniqueOrThrow({
        where: { id: groundHandlingSessionId },
      });
      expect(groundHandlingSession.siteId).toBe(siteId);
      expect(groundHandlingSession.durationMin).toBe(30);
      expect(groundHandlingSession.exercises).toBe("Contrôle au sol, gestion des surventes.");
    });

    it("links the GroundHandlingSession to its Activity", async () => {
      const activity = await prisma.activity.findUniqueOrThrow({
        where: { id: activityId },
        include: { groundHandlingSession: true },
      });
      expect(activity.groundHandlingSession?.id).toBe(groundHandlingSessionId);
    });
  });

  it("fails with invalid data", async () => {
    await expect(
      createGroundHandlingSession(userId, {
        ...validGroundHandlingInput,
        siteId,
        durationMin: "-10",
      }),
    ).rejects.toThrow();
  });
});
