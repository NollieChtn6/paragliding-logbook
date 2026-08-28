import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createQualification } from "@/features/qualifications";
import { createTrainingCamp } from "@/features/training-camps";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { getParcoursTimeline } from "./get-parcours-timeline.service";

const trainingCampMessages = getDictionary("fr-FR").validation.trainingCamp;
const qualificationMessages = getDictionary("fr-FR").validation.qualification;

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysFromToday(offsetDays: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date;
}

let userId: string;
let otherUserId: string;
let schoolId: string;
let trainingCampTypeId: string;
let qualificationTypeId: string;
const trainingCampActivityIds: string[] = [];

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, school, trainingCampType, qualificationType] = await Promise.all([
    prisma.user.create({
      data: {
        email: `parcours-timeline-${suffix}@paragliding-logbook.local`,
        name: "Parcours Timeline Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `parcours-timeline-other-${suffix}@paragliding-logbook.local`,
        name: "Other User",
      },
    }),
    prisma.school.create({ data: { name: `Parcours Timeline Test School ${suffix}` } }),
    prisma.trainingCampType.findUniqueOrThrow({ where: { code: "AUTONOMY" } }),
    prisma.qualificationType.findUniqueOrThrow({ where: { code: "PILOT" } }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  schoolId = school.id;
  trainingCampTypeId = trainingCampType.id;
  qualificationTypeId = qualificationType.id;

  // Stage terminé (endDate hier) : doit apparaître.
  const completedCamp = await createTrainingCamp(
    userId,
    {
      startDate: toDateOnly(daysFromToday(-10)),
      endDate: toDateOnly(daysFromToday(-1)),
      schoolId,
      trainingCampTypeId,
    },
    trainingCampMessages,
  );
  // Stage se terminant AUJOURD'HUI : ne compte pas encore comme terminé
  // (règle métier), ne doit PAS apparaître.
  const endingTodayCamp = await createTrainingCamp(
    userId,
    {
      startDate: toDateOnly(daysFromToday(-5)),
      endDate: toDateOnly(daysFromToday(0)),
      schoolId,
      trainingCampTypeId,
    },
    trainingCampMessages,
  );
  // Stage encore en cours (endDate demain) : ne doit pas apparaître.
  const futureCamp = await createTrainingCamp(
    userId,
    {
      startDate: toDateOnly(daysFromToday(0)),
      endDate: toDateOnly(daysFromToday(5)),
      schoolId,
      trainingCampTypeId,
    },
    trainingCampMessages,
  );
  trainingCampActivityIds.push(
    completedCamp.activityId,
    endingTodayCamp.activityId,
    futureCamp.activityId,
  );

  // Deux brevets, tous deux doivent apparaître (aucune notion "en cours").
  await createQualification(
    userId,
    { qualificationTypeId, obtainedDate: "2024-06-01" },
    qualificationMessages,
  );
  await createQualification(
    userId,
    { qualificationTypeId, obtainedDate: "2025-01-10", schoolId },
    qualificationMessages,
  );

  // Stage/brevet d'un autre utilisateur, ne doit jamais fuiter.
  const otherUserCamp = await createTrainingCamp(
    otherUserId,
    {
      startDate: toDateOnly(daysFromToday(-10)),
      endDate: toDateOnly(daysFromToday(-1)),
      schoolId,
      trainingCampTypeId,
    },
    trainingCampMessages,
  );
  trainingCampActivityIds.push(otherUserCamp.activityId);
  await createQualification(
    otherUserId,
    { qualificationTypeId, obtainedDate: "2024-01-01" },
    qualificationMessages,
  );
});

afterAll(async () => {
  await prisma.qualification.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.trainingCamp.deleteMany({ where: { activityId: { in: trainingCampActivityIds } } });
  await prisma.activity.deleteMany({ where: { id: { in: trainingCampActivityIds } } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("getParcoursTimeline (integration)", () => {
  it("includes a completed training camp but excludes one ending today or still in progress", async () => {
    const timeline = await getParcoursTimeline(userId);

    const campEntries = timeline.filter((entry) => entry.kind === "training-camp");
    expect(campEntries).toHaveLength(1);
    expect(campEntries[0]).toMatchObject({
      trainingCampTypeCode: "AUTONOMY",
      schoolName: expect.stringContaining("Parcours Timeline Test School"),
    });
  });

  it("includes every qualification regardless of date", async () => {
    const timeline = await getParcoursTimeline(userId);

    const qualificationEntries = timeline.filter((entry) => entry.kind === "qualification");
    expect(qualificationEntries).toHaveLength(2);
  });

  it("sorts every entry most-recent-first, mixing both kinds", async () => {
    const timeline = await getParcoursTimeline(userId);

    const dates = timeline.map((entry) => entry.date.getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it("only returns entries belonging to the given user", async () => {
    const timeline = await getParcoursTimeline(userId);

    expect(timeline).toHaveLength(3);
  });

  it("returns an empty list for a user with no completed camp and no qualification", async () => {
    const timeline = await getParcoursTimeline(crypto.randomUUID());

    expect(timeline).toEqual([]);
  });
});
