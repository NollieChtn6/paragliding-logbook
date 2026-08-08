import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { listTrainingCamps } from "./list-training-camps.service";

let userId: string;
let otherUserId: string;
let schoolId: string;
const activityIds: string[] = [];

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, school] = await Promise.all([
    prisma.user.create({
      data: {
        email: `list-training-camps-${suffix}@paragliding-logbook.local`,
        name: "List Training Camps Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `list-training-camps-other-${suffix}@paragliding-logbook.local`,
        name: "Other User",
      },
    }),
    prisma.school.create({ data: { name: `List Training Camps Test School ${suffix}` } }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  schoolId = school.id;

  const trainingCampActivityType = await prisma.activityType.findUniqueOrThrow({
    where: { code: "TRAINING_CAMP" },
  });

  // Créés dans un ordre différent de leur startDate, pour prouver que le tri
  // se fait bien sur startDate et pas sur createdAt.
  const olderActivity = await prisma.activity.create({
    data: { userId, activityTypeId: trainingCampActivityType.id },
  });
  await prisma.trainingCamp.create({
    data: {
      activityId: olderActivity.id,
      schoolId,
      campType: "Initiation",
      startDate: new Date("2024-01-10"),
      endDate: new Date("2024-01-15"),
    },
  });

  const newerActivity = await prisma.activity.create({
    data: { userId, activityTypeId: trainingCampActivityType.id },
  });
  await prisma.trainingCamp.create({
    data: {
      activityId: newerActivity.id,
      schoolId,
      campType: "Perfectionnement",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-10"),
    },
  });

  const otherUserActivity = await prisma.activity.create({
    data: { userId: otherUserId, activityTypeId: trainingCampActivityType.id },
  });
  await prisma.trainingCamp.create({
    data: {
      activityId: otherUserActivity.id,
      schoolId,
      campType: "Stage d'un autre utilisateur",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-05"),
    },
  });

  activityIds.push(olderActivity.id, newerActivity.id, otherUserActivity.id);
});

afterAll(async () => {
  await prisma.trainingCamp.deleteMany({ where: { activityId: { in: activityIds } } });
  await prisma.activity.deleteMany({ where: { id: { in: activityIds } } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("listTrainingCamps (integration)", () => {
  it("returns only the current user's training camps, most recent start date first", async () => {
    const trainingCamps = await listTrainingCamps(userId);

    expect(trainingCamps).toHaveLength(2);
    expect(trainingCamps[0]?.campType).toBe("Perfectionnement");
    expect(trainingCamps[1]?.campType).toBe("Initiation");
    expect(trainingCamps.some((camp) => camp.campType === "Stage d'un autre utilisateur")).toBe(
      false,
    );
  });

  it("includes the School", async () => {
    const trainingCamps = await listTrainingCamps(userId);

    for (const trainingCamp of trainingCamps) {
      expect(trainingCamp.school.id).toBe(schoolId);
    }
  });
});
