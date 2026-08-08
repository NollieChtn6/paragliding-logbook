import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  DEV_USER_2_EMAIL,
  DEV_USER_EMAIL,
  TEST_SCHOOL_NAME,
  TEST_SITE_NAME,
} from "../src/lib/dev-fixtures";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const activityTypes = [
  { code: "FLIGHT", label: "Vol" },
  { code: "TRAINING_CAMP", label: "Stage" },
  { code: "GROUND_HANDLING", label: "Gonflage" },
];

// Jamais de mot de passe en dur dans le repository (CLAUDE.md > Authentification) :
// les comptes de développement lisent leur mot de passe depuis l'environnement.
function getDevUserPassword(): string {
  const password = process.env.DEV_USER_PASSWORD;
  if (!password) {
    throw new Error(
      "DEV_USER_PASSWORD manquant : définissez-le dans apps/web/.env (voir .env.example).",
    );
  }
  return password;
}

// Utilisateur de développement + Account "credential" (c'est cette table que
// Better Auth lit pour l'authentification email + mot de passe, voir
// src/lib/auth.ts) : un second compte (DEV_USER_2_EMAIL) permet de vérifier
// manuellement que les activités sont bien isolées par utilisateur.
async function upsertDevUser(client: PrismaClient, email: string, name: string) {
  const passwordHash = await hashPassword(getDevUserPassword());
  const user = await client.user.upsert({
    where: { email },
    update: {},
    create: { email, name },
  });

  // Pas de contrainte unique (providerId, accountId) dans le schéma généré
  // par Better Auth (vérifié via `better-auth generate`) : recherche
  // manuelle pour rester idempotent, comme pour Site plus bas.
  const credentialAccount = await client.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });
  if (credentialAccount) {
    await client.account.update({
      where: { id: credentialAccount.id },
      data: { password: passwordHash },
    });
  } else {
    await client.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: passwordHash,
      },
    });
  }

  return user;
}

async function main() {
  for (const activityType of activityTypes) {
    await prisma.activityType.upsert({
      where: { code: activityType.code },
      update: { label: activityType.label },
      create: activityType,
    });
  }

  // Utilisateurs et site de développement : pas de page d'inscription ni de
  // gestion des sites pour l'instant, ces données de référence débloquent les
  // premiers flux métier (ex. création d'un vol) sans construire ces features.
  await upsertDevUser(prisma, DEV_USER_EMAIL, "Dev");
  await upsertDevUser(prisma, DEV_USER_2_EMAIL, "Dev 2");

  // Site.name et School.name ne sont pas des contraintes uniques en base
  // (upsert impossible) : vérification manuelle pour rester idempotent.
  const testSite = await prisma.site.findFirst({ where: { name: TEST_SITE_NAME } });
  if (!testSite) {
    await prisma.site.create({ data: { name: TEST_SITE_NAME } });
  }

  const testSchool = await prisma.school.findFirst({ where: { name: TEST_SCHOOL_NAME } });
  if (!testSchool) {
    await prisma.school.create({ data: { name: TEST_SCHOOL_NAME } });
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
