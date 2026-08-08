import { prisma } from "@/lib/prisma";
import {
  ACTIVITY_WITH_DETAILS_INCLUDE,
  type ActivityWithDetails,
  getActivityEventDate,
} from "./queries";

export async function listActivities(userId: string): Promise<ActivityWithDetails[]> {
  const activities = await prisma.activity.findMany({
    where: { userId },
    include: ACTIVITY_WITH_DETAILS_INCLUDE,
  });

  return [...activities].sort(
    (a, b) => getActivityEventDate(b).getTime() - getActivityEventDate(a).getTime(),
  );
}
