import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { DEV_USER_EMAIL, DEV_USER_PASSWORD, TEST_SITE_NAME } from "../src/lib/dev-fixtures";
import { hashPassword } from "../src/lib/password";

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

  // Utilisateur et site de développement : pas d'Auth.js ni de gestion des
  // sites pour l'instant, ces données de référence débloquent les premiers
  // flux métier (ex. création d'un vol) sans construire ces features.
  const devPasswordHash = await hashPassword(DEV_USER_PASSWORD);
  await prisma.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: { passwordHash: devPasswordHash },
    create: {
      email: DEV_USER_EMAIL,
      name: "Dev",
      passwordHash: devPasswordHash,
    },
  });

  // Site.name n'est pas une contrainte unique en base (upsert impossible) :
  // vérification manuelle pour rester idempotent.
  const testSite = await prisma.site.findFirst({ where: { name: TEST_SITE_NAME } });
  if (!testSite) {
    await prisma.site.create({ data: { name: TEST_SITE_NAME } });
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
