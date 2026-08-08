import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { DEV_USER_EMAIL, TEST_SITE_NAME } from "../src/lib/dev-fixtures";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const activityTypes = [
  { code: "FLIGHT", label: "Vol" },
  { code: "TRAINING_CAMP", label: "Stage" },
  { code: "GROUND_HANDLING", label: "Gonflage" },
];

// Jamais de mot de passe en dur dans le repository (CLAUDE.md > Authentification) :
// le compte de développement lit son mot de passe depuis l'environnement.
function getDevUserPassword(): string {
  const password = process.env.DEV_USER_PASSWORD;
  if (!password) {
    throw new Error(
      "DEV_USER_PASSWORD manquant : définissez-le dans apps/web/.env (voir .env.example).",
    );
  }
  return password;
}

async function main() {
  for (const activityType of activityTypes) {
    await prisma.activityType.upsert({
      where: { code: activityType.code },
      update: { label: activityType.label },
      create: activityType,
    });
  }

  // Utilisateur et site de développement : pas de page de connexion ni de
  // gestion des sites pour l'instant, ces données de référence débloquent les
  // premiers flux métier (ex. création d'un vol) sans construire ces features.
  const devPasswordHash = await hashPassword(getDevUserPassword());
  const devUser = await prisma.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: {},
    create: {
      email: DEV_USER_EMAIL,
      name: "Dev",
    },
  });

  // Account "credential" : c'est cette table que Better Auth lit pour
  // l'authentification email + mot de passe (voir src/lib/auth.ts). Pas de
  // contrainte unique (providerId, accountId) dans le schéma généré par
  // Better Auth (vérifié via `better-auth generate`) : recherche manuelle
  // pour rester idempotent, comme pour Site plus bas.
  const devCredentialAccount = await prisma.account.findFirst({
    where: { userId: devUser.id, providerId: "credential" },
  });
  if (devCredentialAccount) {
    await prisma.account.update({
      where: { id: devCredentialAccount.id },
      data: { password: devPasswordHash },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: devUser.id,
        providerId: "credential",
        accountId: devUser.id,
        password: devPasswordHash,
      },
    });
  }

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
