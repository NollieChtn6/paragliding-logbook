import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  DEV_USER_2_EMAIL,
  DEV_USER_EMAIL,
  TEST_SCHOOL_NAME,
  TEST_SITE_LANDING_LABEL,
  TEST_SITE_NAME,
  TEST_SITE_TAKEOFF_LABEL,
} from "../src/lib/dev-fixtures";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const activityTypes = [
  { code: "FLIGHT", label: "Vol" },
  { code: "TRAINING_CAMP", label: "Stage" },
  { code: "GROUND_HANDLING", label: "Gonflage" },
];

// Table de référence des types de point (même principe qu'activityTypes
// ci-dessus) : extensible sans migration si un nouveau type de point est
// nécessaire plus tard (docs/decisions, cf. schema.prisma).
const sitePointTypes = [
  { code: "TAKEOFF", label: "Décollage" },
  { code: "LANDING", label: "Atterrissage" },
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

// Un site de test doit avoir un point de décollage et d'atterrissage
// principal pour que le flux de création de vol soit utilisable (Flight
// référence désormais des SitePoint, plus un Site). Idempotent : ne crée les
// points que s'ils n'existent pas déjà, ne touche pas aux primary*PointId
// déjà renseignés.
async function ensureTestSitePoints(client: PrismaClient, siteId: string) {
  const [takeoffType, landingType] = await Promise.all([
    client.sitePointType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    client.sitePointType.findUniqueOrThrow({ where: { code: "LANDING" } }),
  ]);

  let takeoffPoint = await client.sitePoint.findFirst({
    where: { siteId, sitePointTypeId: takeoffType.id },
  });
  if (!takeoffPoint) {
    takeoffPoint = await client.sitePoint.create({
      data: {
        label: TEST_SITE_TAKEOFF_LABEL,
        siteId,
        sitePointTypeId: takeoffType.id,
        latitude: 45.9237,
        longitude: 6.8694,
        altitudeM: 1500,
        orientationDeg: 180,
      },
    });
  }

  let landingPoint = await client.sitePoint.findFirst({
    where: { siteId, sitePointTypeId: landingType.id },
  });
  if (!landingPoint) {
    landingPoint = await client.sitePoint.create({
      data: {
        label: TEST_SITE_LANDING_LABEL,
        siteId,
        sitePointTypeId: landingType.id,
        latitude: 45.9012,
        longitude: 6.8501,
        altitudeM: 500,
      },
    });
  }

  await client.site.update({
    where: { id: siteId },
    data: {
      primaryTakeoffPointId: takeoffPoint.id,
      primaryLandingPointId: landingPoint.id,
    },
  });
}

async function main() {
  for (const activityType of activityTypes) {
    await prisma.activityType.upsert({
      where: { code: activityType.code },
      update: { label: activityType.label },
      create: activityType,
    });
  }

  for (const sitePointType of sitePointTypes) {
    await prisma.sitePointType.upsert({
      where: { code: sitePointType.code },
      update: { label: sitePointType.label },
      create: sitePointType,
    });
  }

  // Utilisateurs et site de développement : pas de page d'inscription ni de
  // gestion des sites pour l'instant, ces données de référence débloquent les
  // premiers flux métier (ex. création d'un vol) sans construire ces features.
  await upsertDevUser(prisma, DEV_USER_EMAIL, "Dev");
  await upsertDevUser(prisma, DEV_USER_2_EMAIL, "Dev 2");

  // Site.name et School.name ne sont pas des contraintes uniques en base
  // (upsert impossible) : vérification manuelle pour rester idempotent.
  let testSite = await prisma.site.findFirst({ where: { name: TEST_SITE_NAME } });
  if (!testSite) {
    testSite = await prisma.site.create({ data: { name: TEST_SITE_NAME } });
  }
  await ensureTestSitePoints(prisma, testSite.id);

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
