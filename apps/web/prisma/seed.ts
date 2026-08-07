import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const activityTypes = [
  { code: "FLIGHT", label: "Vol" },
  { code: "TRAINING_CAMP", label: "Stage" },
  { code: "GROUND_HANDLING", label: "Gonflage" },
];

async function main() {
  for (const activityType of activityTypes) {
    await prisma.activityType.upsert({
      where: { code: activityType.code },
      update: { label: activityType.label },
      create: activityType,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
