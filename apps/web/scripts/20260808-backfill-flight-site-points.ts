// Script de migration de données ponctuel, à exécuter une seule fois entre
// les deux migrations Prisma de l'évolution Site/SitePoint :
//   1. 20260808200453_add_site_point_model (ajoute departurePointId/
//      arrivalPointId nullables, sans toucher aux anciennes colonnes)
//   2. pnpm prisma:seed (crée SitePointType + les points du site de test)
//   3. ce script (backfill des Flight existants)
//   4. 20260808201500_finalize_site_point_model (NOT NULL + drop des
//      anciennes colonnes siteId/takeoffAltitudeM/landingAltitudeM)
//
// Conservé dans le repo comme trace de la façon dont les données historiques
// ont été migrées (voir l'analyse du modèle Site/Point), mais n'est pas
// destiné à être ré-exécuté : après l'étape 4, les colonnes qu'il lit
// (siteId, takeoffAltitudeM, landingAltitudeM) n'existent plus.
//
// Un seul SitePoint par (site, type) est réutilisé pour tous les vols
// existants de ce site, plutôt qu'un point par altitude distincte observée :
// l'altitude est une propriété du lieu, pas une mesure propre à chaque vol
// (décision actée dans l'analyse du modèle, l'éventuelle variation fine
// historique est perdue).
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type LegacyFlightRow = {
  id: string;
  siteId: string;
  takeoffAltitudeM: number;
  landingAltitudeM: number;
};

async function findOrCreateSitePoint(
  siteId: string,
  sitePointTypeId: string,
  typeCode: "TAKEOFF" | "LANDING",
  altitudeM: number,
): Promise<string> {
  const existing = await prisma.sitePoint.findFirst({
    where: { siteId, sitePointTypeId },
  });
  if (existing) {
    return existing.id;
  }

  const site = await prisma.site.findUniqueOrThrow({ where: { id: siteId } });
  const created = await prisma.sitePoint.create({
    data: {
      label: typeCode === "TAKEOFF" ? "Décollage (migré)" : "Atterrissage (migré)",
      siteId,
      sitePointTypeId,
      latitude: site.latitude ?? 0,
      longitude: site.longitude ?? 0,
      altitudeM,
    },
  });
  return created.id;
}

async function main() {
  const legacyFlights = await prisma.$queryRaw<LegacyFlightRow[]>`
    SELECT id, "siteId", "takeoffAltitudeM", "landingAltitudeM"
    FROM "Flight"
    WHERE "departurePointId" IS NULL
  `;
  console.log(`Found ${legacyFlights.length} flight(s) to backfill.`);

  const [takeoffType, landingType] = await Promise.all([
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "LANDING" } }),
  ]);

  for (const flight of legacyFlights) {
    const departurePointId = await findOrCreateSitePoint(
      flight.siteId,
      takeoffType.id,
      "TAKEOFF",
      flight.takeoffAltitudeM,
    );
    const arrivalPointId = await findOrCreateSitePoint(
      flight.siteId,
      landingType.id,
      "LANDING",
      flight.landingAltitudeM,
    );

    await prisma.flight.update({
      where: { id: flight.id },
      data: { departurePointId, arrivalPointId },
    });
    console.log(
      `Flight ${flight.id}: departurePointId=${departurePointId} arrivalPointId=${arrivalPointId}`,
    );
  }

  // Backfill Site.primaryTakeoffPointId/primaryLandingPointId pour tout site
  // qui aurait reçu un point ci-dessus sans en avoir déjà un désigné comme
  // principal (le site de test en a déjà via le seed, ce bloc couvre les
  // autres sites éventuels).
  const sites = await prisma.site.findMany({
    where: { OR: [{ primaryTakeoffPointId: null }, { primaryLandingPointId: null }] },
  });
  for (const site of sites) {
    const [takeoffPoint, landingPoint] = await Promise.all([
      prisma.sitePoint.findFirst({ where: { siteId: site.id, sitePointTypeId: takeoffType.id } }),
      prisma.sitePoint.findFirst({ where: { siteId: site.id, sitePointTypeId: landingType.id } }),
    ]);
    if (takeoffPoint || landingPoint) {
      await prisma.site.update({
        where: { id: site.id },
        data: {
          primaryTakeoffPointId: site.primaryTakeoffPointId ?? takeoffPoint?.id,
          primaryLandingPointId: site.primaryLandingPointId ?? landingPoint?.id,
        },
      });
      console.log(`Site ${site.id}: primary point(s) backfilled.`);
    }
  }

  const stillMissing = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "Flight" WHERE "departurePointId" IS NULL OR "arrivalPointId" IS NULL
  `;
  console.log(`Flights still missing a point after backfill: ${stillMissing[0]?.count ?? "?"}`);
}

main().finally(() => prisma.$disconnect());
