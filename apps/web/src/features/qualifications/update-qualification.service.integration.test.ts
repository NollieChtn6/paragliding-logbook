import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { QualificationNotFoundError } from "./qualification-not-found.error";
import { updateQualification } from "./update-qualification.service";

const t = getDictionary("fr-FR").validation.qualification;

let userId: string;
let otherUserId: string;
let qualificationTypeId: string;
let otherQualificationTypeId: string;
let qualificationId: string;

const validQualificationInput = {
  obtainedDate: "2025-01-10",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, qualificationType, otherQualificationType] = await Promise.all([
    prisma.user.create({
      data: {
        email: `integration-test-qual-update-${suffix}@paragliding-logbook.local`,
        name: "Integration Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `integration-test-qual-update-other-${suffix}@paragliding-logbook.local`,
        name: "Other Integration Test User",
      },
    }),
    prisma.qualificationType.upsert({
      where: { code: "PILOT" },
      update: {},
      create: { code: "PILOT" },
    }),
    prisma.qualificationType.upsert({
      where: { code: "TANDEM" },
      update: {},
      create: { code: "TANDEM" },
    }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  qualificationTypeId = qualificationType.id;
  otherQualificationTypeId = otherQualificationType.id;

  const qualification = await prisma.qualification.create({
    data: { userId, qualificationTypeId, obtainedDate: new Date("2025-01-10") },
  });
  qualificationId = qualification.id;
});

afterAll(async () => {
  await prisma.qualification.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("updateQualification (integration)", () => {
  it("updates the qualification with the submitted data", async () => {
    const updated = await updateQualification(
      userId,
      qualificationId,
      {
        ...validQualificationInput,
        qualificationTypeId: otherQualificationTypeId,
        notes: "Passage en biplace.",
      },
      t,
    );
    expect(updated.qualificationTypeId).toBe(otherQualificationTypeId);
    expect(updated.notes).toBe("Passage en biplace.");
  });

  it("throws QualificationNotFoundError when the qualification does not exist", async () => {
    await expect(
      updateQualification(
        userId,
        crypto.randomUUID(),
        { ...validQualificationInput, qualificationTypeId },
        t,
      ),
    ).rejects.toThrow(QualificationNotFoundError);
  });

  it("throws QualificationNotFoundError, and does not update, when the qualification belongs to another user", async () => {
    await expect(
      updateQualification(
        otherUserId,
        qualificationId,
        { ...validQualificationInput, qualificationTypeId, notes: "Tentative non autorisée" },
        t,
      ),
    ).rejects.toThrow(QualificationNotFoundError);

    const untouched = await prisma.qualification.findUniqueOrThrow({
      where: { id: qualificationId },
    });
    expect(untouched.notes).toBe("Passage en biplace.");
  });

  it("fails when the new qualification type does not exist", async () => {
    await expect(
      updateQualification(
        userId,
        qualificationId,
        { ...validQualificationInput, qualificationTypeId: crypto.randomUUID() },
        t,
      ),
    ).rejects.toThrow();
  });
});
