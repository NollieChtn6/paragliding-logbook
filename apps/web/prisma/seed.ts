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

// Tables de référence (ActivityType/SitePointType/FlightType) : pas de label
// ici, le libellé affiché vit côté application
// (src/lib/reference-labels.ts, docs/decisions/003-reference-table-codes.md).
const activityTypes = [{ code: "FLIGHT" }, { code: "TRAINING_CAMP" }, { code: "GROUND_HANDLING" }];

const sitePointTypes = [{ code: "TAKEOFF" }, { code: "LANDING" }];

// Remplace l'ancien enum Prisma FlightType (ADR 003). CROSS renommé en
// CROSS_COUNTRY, plus explicite (docs/decisions/003-reference-table-codes.md).
const flightTypes = [
  { code: "LOCAL" },
  { code: "CROSS_COUNTRY" },
  { code: "SOARING" },
  { code: "THERMAL" },
  { code: "TRAINING" },
  { code: "OTHER" },
];

// Remplace l'ancien champ TrainingCamp.campType (texte libre), même principe
// que les autres tables de référence ci-dessus (docs/decisions/003-reference-table-codes.md).
const trainingCampTypes = [
  { code: "INIT" },
  { code: "PROGRESSION" },
  { code: "THERMAL" },
  { code: "SIV" },
];

// orientationDeg est un cap en degrés (0 = N, 90 = E, 180 = S, 270 = O) —
// convention déjà en place (docs/decisions/005-flight-takeoff-landing-points.md
// point 11 : pas de nouvelle refonte de l'orientation dans cette PR), les
// données réelles ci-dessous sont juste converties lettre → degré.
const ORIENTATION_N = 0;
const ORIENTATION_E = 90;
const ORIENTATION_S = 180;

// Site de vol réel (Saint-Hilaire-du-Touvet), plusieurs points de décollage
// et un point d'atterrissage — aucun n'est "principal" (ADR 005 : la notion
// de point principal est abandonnée).
const TEST_SITE_POINTS = [
  {
    label: "SAINT HILAIRE DU TOUVET - CHALET MOQUETTE",
    typeCode: "TAKEOFF",
    latitude: 45.3067,
    longitude: 5.888,
    altitudeM: 892,
    orientationDeg: ORIENTATION_N,
  },
  {
    label: "SAINT HILAIRE DU TOUVET FUNICULAIRE - EST",
    typeCode: "TAKEOFF",
    latitude: 45.3067,
    longitude: 5.888,
    altitudeM: 921,
    orientationDeg: ORIENTATION_E,
  },
  {
    label: "SAINT HILAIRE DU TOUVET - SUD",
    typeCode: "TAKEOFF",
    latitude: 45.3103,
    longitude: 5.8908,
    altitudeM: 939,
    orientationDeg: ORIENTATION_S,
  },
  {
    label: "SAINT HILAIRE DU TOUVET - LUMBIN CIBLE",
    typeCode: "LANDING",
    latitude: 45.3021,
    longitude: 5.9061,
    altitudeM: 237,
    orientationDeg: null,
  },
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

// Un site de test doit avoir des points de décollage et d'atterrissage pour
// que le flux de création de vol soit utilisable (Flight référence
// désormais directement des SitePoint typés, plus un Site). Idempotent : ne
// crée que les points absents (recherche par site + libellé, pas de
// contrainte unique en base). Aucun point n'est marqué "principal" (ADR 005).
async function ensureTestSitePoints(client: PrismaClient, siteId: string) {
  const sitePointTypesByCode = new Map(
    (
      await Promise.all([
        client.sitePointType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
        client.sitePointType.findUniqueOrThrow({ where: { code: "LANDING" } }),
      ])
    ).map((sitePointType) => [sitePointType.code, sitePointType]),
  );

  for (const point of TEST_SITE_POINTS) {
    const existing = await client.sitePoint.findFirst({ where: { siteId, label: point.label } });
    if (existing) {
      continue;
    }

    const sitePointType = sitePointTypesByCode.get(point.typeCode);
    if (!sitePointType) {
      throw new Error(`SitePointType inconnu : ${point.typeCode}`);
    }

    await client.sitePoint.create({
      data: {
        label: point.label,
        siteId,
        sitePointTypeId: sitePointType.id,
        latitude: point.latitude,
        longitude: point.longitude,
        altitudeM: point.altitudeM,
        orientationDeg: point.orientationDeg,
      },
    });
  }
}

async function main() {
  for (const activityType of activityTypes) {
    await prisma.activityType.upsert({
      where: { code: activityType.code },
      update: {},
      create: activityType,
    });
  }

  for (const sitePointType of sitePointTypes) {
    await prisma.sitePointType.upsert({
      where: { code: sitePointType.code },
      update: {},
      create: sitePointType,
    });
  }

  for (const flightType of flightTypes) {
    await prisma.flightType.upsert({
      where: { code: flightType.code },
      update: {},
      create: flightType,
    });
  }

  for (const trainingCampType of trainingCampTypes) {
    await prisma.trainingCampType.upsert({
      where: { code: trainingCampType.code },
      update: {},
      create: trainingCampType,
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
    testSite = await prisma.site.create({
      data: { name: TEST_SITE_NAME, region: "Rhône-Alpes", countryCode: "FR" },
    });
  }
  await ensureTestSitePoints(prisma, testSite.id);

  const testSchool = await prisma.school.findFirst({ where: { name: TEST_SCHOOL_NAME } });
  if (!testSchool) {
    await prisma.school.create({ data: { name: TEST_SCHOOL_NAME, countryCode: "FR" } });
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
