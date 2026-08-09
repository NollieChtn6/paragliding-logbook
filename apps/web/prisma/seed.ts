import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { DEV_USER_2_EMAIL, DEV_USER_EMAIL } from "../src/lib/dev-fixtures";
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
// Labels associés : src/lib/reference-labels.ts > TRAINING_CAMP_TYPE_LABELS.
const trainingCampTypes = [
  { code: "INITIATION" },
  { code: "AUTONOMY" },
  { code: "ADVANCED" },
  { code: "THERMAL" },
  { code: "CROSS_COUNTRY" },
  { code: "SIV" },
  { code: "HIKE_AND_FLY" },
  { code: "ACRO_DISCOVERY" },
  { code: "ACRO_ADVANCED" },
  { code: "SAFETY" },
  { code: "OTHER" },
];

// orientationDeg est un cap en degrés (0 = N, 90 = E, 180 = S, 270 = O) —
// convention déjà en place (docs/decisions/005-flight-takeoff-landing-points.md
// point 11 : pas de nouvelle refonte de l'orientation dans cette PR), les
// données réelles ci-dessous sont juste converties lettre → degré.
const ORIENTATION_N = 0;
const ORIENTATION_E = 90;
const ORIENTATION_SE = 135;
const ORIENTATION_S = 180;
const ORIENTATION_SO = 225;
const ORIENTATION_NO = 315;

type SitePointSeed = {
  label: string;
  typeCode: "TAKEOFF" | "LANDING";
  latitude: number;
  longitude: number;
  altitudeM: number;
  orientationDeg: number | null;
};

type SiteSeed = {
  name: string;
  region: string;
  countryCode: string;
  points: SitePointSeed[];
};

// Sites de vol réels (données référentielles, pas de donnée personnelle) —
// chaque site peut avoir plusieurs points de décollage et un point
// d'atterrissage, aucun n'est "principal" (ADR 005 : la notion de point
// principal est abandonnée).
const SITES: SiteSeed[] = [
  {
    name: "Saint-Hilaire-du-Touvet",
    region: "Auvergne-Rhône-Alpes",
    countryCode: "FR",
    points: [
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
    ],
  },
  {
    name: "Montlambert",
    region: "Auvergne-Rhône-Alpes",
    countryCode: "FR",
    points: [
      {
        label: "MONTLAMBERT",
        typeCode: "TAKEOFF",
        latitude: 45.5529,
        longitude: 6.1048,
        altitudeM: 894,
        orientationDeg: ORIENTATION_SE,
      },
      {
        label: "MONTLAMBERT",
        typeCode: "LANDING",
        latitude: 45.5415,
        longitude: 6.1178,
        altitudeM: 280,
        orientationDeg: null,
      },
    ],
  },
  {
    name: "Chamoux - Montendry",
    region: "Auvergne-Rhône-Alpes",
    countryCode: "FR",
    points: [
      {
        label: "DÉCOLLAGE DES PIEDS TENDRES",
        typeCode: "TAKEOFF",
        latitude: 45.5295,
        longitude: 6.2529,
        altitudeM: 1283,
        orientationDeg: ORIENTATION_S,
      },
      {
        label: "CHAMOUX-SUR-GELON",
        typeCode: "LANDING",
        latitude: 45.5406,
        longitude: 6.2149,
        altitudeM: 292,
        orientationDeg: null,
      },
    ],
  },
  {
    name: "Col de la Forclaz - Montmin",
    region: "Auvergne-Rhône-Alpes",
    countryCode: "FR",
    points: [
      {
        label: "COL DE LA FORCLAZ - MONTMIN",
        typeCode: "TAKEOFF",
        latitude: 45.8142,
        longitude: 6.2469,
        altitudeM: 1257,
        orientationDeg: ORIENTATION_NO,
      },
      {
        label: "DOUSSARD",
        typeCode: "LANDING",
        latitude: 45.5406,
        longitude: 6.2149,
        altitudeM: 468,
        orientationDeg: null,
      },
    ],
  },
  {
    name: "Planfait - Perroix",
    region: "Auvergne-Rhône-Alpes",
    countryCode: "FR",
    points: [
      {
        label: "PLANFAIT",
        typeCode: "TAKEOFF",
        latitude: 45.8487,
        longitude: 6.2142,
        altitudeM: 916,
        orientationDeg: ORIENTATION_SO,
      },
      {
        label: "PERROIX - PERROIX",
        typeCode: "LANDING",
        latitude: 45.8532,
        longitude: 6.223,
        altitudeM: 553,
        orientationDeg: null,
      },
    ],
  },
];

type SchoolSeed = {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  countryCode: string;
  website: string;
};

const SCHOOLS: SchoolSeed[] = [
  {
    name: "St Hil Air School",
    address: "84, route des Trois Villages",
    postalCode: "38660",
    city: "Plateau-des-Petites-Roches",
    countryCode: "FR",
    website: "https://www.apprendre-parapente.com/",
  },
  {
    name: "Espace 3D Parapente",
    address: "93, route de Marceau",
    postalCode: "74210",
    city: "Lathuile",
    countryCode: "FR",
    website: "https://www.espace3d.fr/",
  },
  {
    name: "Prévol Parapente",
    address: "14, chemin du Funiculaire",
    postalCode: "38660",
    city: "Plateau-des-Petites-Roches",
    countryCode: "FR",
    website: "https://www.prevol.com/",
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

// Un site doit avoir des points de décollage et d'atterrissage pour que le
// flux de création de vol soit utilisable (Flight référence directement des
// SitePoint typés, plus un Site). Idempotent : ne crée que les points
// absents (recherche par site + libellé, pas de contrainte unique en base).
async function ensureSitePoints(client: PrismaClient, siteId: string, points: SitePointSeed[]) {
  const sitePointTypesByCode = new Map(
    (
      await Promise.all([
        client.sitePointType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
        client.sitePointType.findUniqueOrThrow({ where: { code: "LANDING" } }),
      ])
    ).map((sitePointType) => [sitePointType.code, sitePointType]),
  );

  for (const point of points) {
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

// Site.name n'est pas une contrainte unique en base (upsert impossible) :
// vérification manuelle pour rester idempotent, comme pour School plus bas.
async function ensureSite(client: PrismaClient, site: SiteSeed) {
  let record = await client.site.findFirst({ where: { name: site.name } });
  if (!record) {
    record = await client.site.create({
      data: { name: site.name, region: site.region, countryCode: site.countryCode },
    });
  }
  await ensureSitePoints(client, record.id, site.points);
  return record;
}

async function ensureSchool(client: PrismaClient, school: SchoolSeed) {
  const existing = await client.school.findFirst({ where: { name: school.name } });
  if (existing) {
    return existing;
  }
  return client.school.create({ data: school });
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

  // Utilisateurs de développement : pas de page d'inscription pour l'instant,
  // ces comptes débloquent les premiers flux métier sans construire cette feature.
  await upsertDevUser(prisma, DEV_USER_EMAIL, "Dev");
  await upsertDevUser(prisma, DEV_USER_2_EMAIL, "Dev 2");

  for (const site of SITES) {
    await ensureSite(prisma, site);
  }

  for (const school of SCHOOLS) {
    await ensureSchool(prisma, school);
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
