import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { listQualifications } from "./list-qualifications.service";

let userId: string;
let otherUserId: string;
let qualificationTypeId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, qualificationType] = await Promise.all([
    prisma.user.create({
      data: {
        email: `integration-test-qual-list-${suffix}@paragliding-logbook.local`,
        name: "Integration Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `integration-test-qual-list-other-${suffix}@paragliding-logbook.local`,
        name: "Other Integration Test User",
      },
    }),
    prisma.qualificationType.upsert({
      where: { code: "PILOT" },
      update: {},
      create: { code: "PILOT" },
    }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  qualificationTypeId = qualificationType.id;

  await prisma.qualification.createMany({
    data: [
      { userId, qualificationTypeId, obtainedDate: new Date("2024-06-01") },
      { userId, qualificationTypeId, obtainedDate: new Date("2025-01-10") },
      { userId: otherUserId, qualificationTypeId, obtainedDate: new Date("2025-03-01") },
    ],
  });
});

afterAll(async () => {
  await prisma.qualification.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("listQualifications (integration)", () => {
  it("only returns qualifications belonging to the given user, most recent first", async () => {
    const qualifications = await listQualifications(userId);

    expect(qualifications).toHaveLength(2);
    expect(qualifications.every((q) => q.userId === userId)).toBe(true);
    expect(qualifications[0]?.obtainedDate.toISOString().slice(0, 10)).toBe("2025-01-10");
    expect(qualifications[1]?.obtainedDate.toISOString().slice(0, 10)).toBe("2024-06-01");
  });
});
