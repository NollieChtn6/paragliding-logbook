// Script de migration de données ponctuel, à exécuter une seule fois entre
// les deux migrations Prisma de l'évolution FlightType (docs/decisions/003-reference-table-codes.md) :
//   1. 20260808205622_add_flight_type_table (convertit Flight.flightType en
//      TEXT, ajoute flightTypeId nullable, sans toucher aux valeurs existantes)
//   2. pnpm prisma:seed (crée les lignes FlightType)
//   3. ce script (backfill des Flight existants)
//   4. migration de finalisation (NOT NULL + drop de l'ancienne colonne flightType)
//
// Conservé dans le repo comme trace de la migration, pas destiné à être
// ré-exécuté : après l'étape 4, la colonne qu'il lit (flightType, TEXT)
// n'existe plus.
//
// CROSS est renommé en CROSS_COUNTRY (décision actée dans l'analyse du
// modèle) : c'est le seul mapping qui n'est pas une identité.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const LEGACY_CODE_MAPPING: Record<string, string> = {
  LOCAL: "LOCAL",
  CROSS: "CROSS_COUNTRY",
  SOARING: "SOARING",
  THERMAL: "THERMAL",
  TRAINING: "TRAINING",
  OTHER: "OTHER",
};

type LegacyFlightRow = {
  id: string;
  flightType: string;
};

async function main() {
  const legacyFlights = await prisma.$queryRaw<LegacyFlightRow[]>`
    SELECT id, "flightType" FROM "Flight" WHERE "flightTypeId" IS NULL
  `;
  console.log(`Found ${legacyFlights.length} flight(s) to backfill.`);

  const flightTypes = await prisma.flightType.findMany();
  const flightTypeIdByCode = new Map(flightTypes.map((ft) => [ft.code, ft.id]));

  for (const flight of legacyFlights) {
    const newCode = LEGACY_CODE_MAPPING[flight.flightType];
    if (!newCode) {
      throw new Error(`Unmapped legacy flightType "${flight.flightType}" on Flight ${flight.id}`);
    }
    const flightTypeId = flightTypeIdByCode.get(newCode);
    if (!flightTypeId) {
      throw new Error(`No FlightType row found for code "${newCode}" (run the seed first).`);
    }

    await prisma.flight.update({
      where: { id: flight.id },
      data: { flightTypeId },
    });
    console.log(`Flight ${flight.id}: ${flight.flightType} -> ${newCode} (${flightTypeId})`);
  }

  const stillMissing = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "Flight" WHERE "flightTypeId" IS NULL
  `;
  console.log(
    `Flights still missing a flightTypeId after backfill: ${stillMissing[0]?.count ?? "?"}`,
  );
}

main().finally(() => prisma.$disconnect());
