import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { deleteQualification } from "./delete-qualification.service";
import { QualificationNotFoundError } from "./qualification-not-found.error";

let userId: string;
let otherUserId: string;
let qualificationTypeId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, qualificationType] = await Promise.all([
    prisma.user.create({
      data: {
        email: `integration-test-qual-delete-${suffix}@paragliding-logbook.local`,
        name: "Integration Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `integration-test-qual-delete-other-${suffix}@paragliding-logbook.local`,
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
});

afterAll(async () => {
  await prisma.qualification.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("deleteQualification (integration)", () => {
  it("deletes the qualification", async () => {
    const qualification = await prisma.qualification.create({
      data: { userId, qualificationTypeId, obtainedDate: new Date("2025-01-10") },
    });

    await deleteQualification(userId, qualification.id);

    const persisted = await prisma.qualification.findUnique({ where: { id: qualification.id } });
    expect(persisted).toBeNull();
  });

  it("throws QualificationNotFoundError when the qualification does not exist", async () => {
    await expect(deleteQualification(userId, crypto.randomUUID())).rejects.toThrow(
      QualificationNotFoundError,
    );
  });

  it("throws QualificationNotFoundError, and does not delete, when the qualification belongs to another user", async () => {
    const qualification = await prisma.qualification.create({
      data: { userId, qualificationTypeId, obtainedDate: new Date("2025-01-10") },
    });

    await expect(deleteQualification(otherUserId, qualification.id)).rejects.toThrow(
      QualificationNotFoundError,
    );

    const persisted = await prisma.qualification.findUniqueOrThrow({
      where: { id: qualification.id },
    });
    expect(persisted).not.toBeNull();
  });
});
