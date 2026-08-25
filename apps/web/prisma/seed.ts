import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Compte admin de démonstration/local : le rôle ADMIN n'est jamais accessible
// depuis l'inscription publique (/sign-up, voir sign-up-role.integration.test.ts),
// donc pas d'autre moyen d'accéder à /admin en local sans ce seed. Mot de
// passe à changer après la première connexion (page Compte > changer le mot
// de passe) — voir docs/admin.md.
//
// Pas de valeur par défaut en dur : ce script tourne aussi en production
// (voir docs/todo.md > Déploiement), et un identifiant/mot de passe prévisibles
// dans un repo public équivaudraient à une porte dérobée admin. ADMIN_PASSWORD
// doit être défini dans .env pour obtenir un compte admin localement ; en son
// absence, ensureAdminUser est simplement sauté (voir main()).
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@thermik.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Tables de référence (ActivityType/SiteType/FlightType) : pas de label
// ici, le libellé affiché vit côté application
// (src/lib/reference-labels.ts, docs/decisions/003-reference-table-codes.md).
const activityTypes = [{ code: "FLIGHT" }, { code: "TRAINING_CAMP" }, { code: "GROUND_HANDLING" }];

const siteTypes = [{ code: "TAKEOFF" }, { code: "LANDING" }];

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

// Catégories de matériel (voile/sellette/secours), même principe que les
// autres tables de référence ci-dessus (docs/decisions/003-reference-table-codes.md).
// Labels associés : referenceLabels.equipmentType (src/messages/fr-FR.ts, en-GB.ts).
const equipmentTypes = [{ code: "WING" }, { code: "HARNESS" }, { code: "RESERVE" }];

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

type SiteSeed = {
  label: string;
  typeCode: "TAKEOFF" | "LANDING";
  latitude: number;
  longitude: number;
  altitudeM: number;
  orientationDeg: number | null;
};

type SpotSeed = {
  name: string;
  region: string;
  countryCode: string;
  sites: SiteSeed[];
};

// Spots de vol réels (données référentielles, pas de donnée personnelle) —
// chaque spot peut avoir plusieurs sites de décollage et un site
// d'atterrissage, aucun n'est "principal" (ADR 005 : la notion de site
// principal est abandonnée).
const SPOTS: SpotSeed[] = [
  {
    name: "Saint-Hilaire-du-Touvet",
    region: "Auvergne-Rhône-Alpes",
    countryCode: "FR",
    sites: [
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
    sites: [
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
    sites: [
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
    sites: [
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
    sites: [
      {
        label: "PLANFAIT",
        typeCode: "TAKEOFF",
        latitude: 45.8487,
        longitude: 6.2142,
        altitudeM: 916,
        orientationDeg: ORIENTATION_SO,
      },
      {
        label: "PLANFAIT - PERROIX",
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

// Un spot doit avoir des sites de décollage et d'atterrissage pour que le
// flux de création de vol soit utilisable (Flight référence directement des
// Site typés, plus un Spot). Idempotent : ne crée que les sites absents
// (recherche par spot + libellé + type, pas de contrainte unique en base).
// Le type doit faire partie de la clé de recherche : plusieurs spots (ex.
// Montlambert) ont un décollage et un atterrissage qui partagent le même
// libellé — une recherche par spot + libellé seul retomberait sur le
// décollage déjà créé et sauterait à tort la création de l'atterrissage.
async function ensureSites(client: PrismaClient, spotId: string, sites: SiteSeed[]) {
  const siteTypesByCode = new Map(
    (
      await Promise.all([
        client.siteType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
        client.siteType.findUniqueOrThrow({ where: { code: "LANDING" } }),
      ])
    ).map((siteType) => [siteType.code, siteType]),
  );

  for (const site of sites) {
    const siteType = siteTypesByCode.get(site.typeCode);
    if (!siteType) {
      throw new Error(`SiteType inconnu : ${site.typeCode}`);
    }

    const existing = await client.site.findFirst({
      where: { spotId, label: site.label, siteTypeId: siteType.id },
    });
    if (existing) {
      continue;
    }

    await client.site.create({
      data: {
        label: site.label,
        spotId,
        siteTypeId: siteType.id,
        latitude: site.latitude,
        longitude: site.longitude,
        altitudeM: site.altitudeM,
        orientationDeg: site.orientationDeg,
      },
    });
  }
}

// Spot.name n'est pas une contrainte unique en base (upsert impossible) :
// vérification manuelle pour rester idempotent, comme pour School plus bas.
async function ensureSpot(client: PrismaClient, spot: SpotSeed) {
  let record = await client.spot.findFirst({ where: { name: spot.name } });
  if (!record) {
    record = await client.spot.create({
      data: { name: spot.name, region: spot.region, countryCode: spot.countryCode },
    });
  }
  await ensureSites(client, record.id, spot.sites);
  return record;
}

async function ensureSchool(client: PrismaClient, school: SchoolSeed) {
  const existing = await client.school.findFirst({ where: { name: school.name } });
  if (existing) {
    return existing;
  }
  return client.school.create({ data: school });
}

// Reproduit manuellement ce que auth.api.signUpEmail (Better Auth) créerait
// (User + Account provider "credential", accountId = userId — vérifié en
// base sur des comptes existants), plutôt que d'appeler l'API Better Auth
// depuis ce script : évite toute dépendance au contexte requête Next.js
// (next/headers, plugin nextCookies) qu'un script tsx autonome n'a pas.
// Idempotent : le mot de passe est re-hashé et remis à jour à chaque run,
// comme l'était l'ancien compte de développement avant la migration vers
// Better Auth.
async function ensureAdminUser(client: PrismaClient, adminPassword: string) {
  const passwordHash = await hashPassword(adminPassword);

  const user = await client.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN" },
    create: { email: ADMIN_EMAIL, name: "Admin", role: "ADMIN" },
  });

  const existingAccount = await client.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });

  if (existingAccount) {
    await client.account.update({
      where: { id: existingAccount.id },
      data: { password: passwordHash },
    });
    return;
  }

  await client.account.create({
    data: { userId: user.id, accountId: user.id, providerId: "credential", password: passwordHash },
  });
}

async function main() {
  for (const activityType of activityTypes) {
    await prisma.activityType.upsert({
      where: { code: activityType.code },
      update: {},
      create: activityType,
    });
  }

  for (const siteType of siteTypes) {
    await prisma.siteType.upsert({
      where: { code: siteType.code },
      update: {},
      create: siteType,
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

  for (const equipmentType of equipmentTypes) {
    await prisma.equipmentType.upsert({
      where: { code: equipmentType.code },
      update: {},
      create: equipmentType,
    });
  }

  // Spot.name et School.name ne sont pas des contraintes uniques en base
  // (upsert impossible) : vérification manuelle pour rester idempotent (voir
  // ensureSpot/ensureSchool). Les comptes utilisateurs "normaux" restent
  // créés via /sign-up ; seul le compte admin (ci-dessous) est seedé, faute
  // d'autre moyen d'obtenir un compte ADMIN en local (voir docs/admin.md).
  for (const spot of SPOTS) {
    await ensureSpot(prisma, spot);
  }

  for (const school of SCHOOLS) {
    await ensureSchool(prisma, school);
  }

  if (ADMIN_PASSWORD) {
    await ensureAdminUser(prisma, ADMIN_PASSWORD);
  } else {
    console.warn(
      "ADMIN_PASSWORD non défini : compte admin non seedé (voir prisma/seed.ts et docs/admin.md).",
    );
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
