// Script de migration de données ponctuel, à exécuter une seule fois entre
// les deux migrations Prisma de l'évolution TrainingCampType
// (docs/decisions/003-reference-table-codes.md) :
//   1. 20260809084532_add_training_camp_type_table (ajoute trainingCampTypeId
//      nullable, sans toucher à campType)
//   2. pnpm prisma:seed (crée les lignes TrainingCampType)
//   3. ce script (backfill des TrainingCamp existants)
//   4. migration de finalisation (NOT NULL + drop de l'ancienne colonne campType)
//
// Conservé dans le repo comme trace de la migration, pas destiné à être
// ré-exécuté : après l'étape 4, la colonne qu'il lit (campType, TEXT)
// n'existe plus.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const LEGACY_CODE_MAPPING: Record<string, string> = {
  Initiation: "INIT",
  Perfectionnement: "PROGRESSION",
  Progression: "PROGRESSION",
  Thermique: "THERMAL",
  SIV: "SIV",
};

type LegacyTrainingCampRow = {
  id: string;
  campType: string;
};

async function main() {
  const legacyTrainingCamps = await prisma.$queryRaw<LegacyTrainingCampRow[]>`
    SELECT id, "campType" FROM "TrainingCamp" WHERE "trainingCampTypeId" IS NULL
  `;
  console.log(`Found ${legacyTrainingCamps.length} training camp(s) to backfill.`);

  const trainingCampTypes = await prisma.trainingCampType.findMany();
  const trainingCampTypeIdByCode = new Map(trainingCampTypes.map((tct) => [tct.code, tct.id]));

  for (const trainingCamp of legacyTrainingCamps) {
    const newCode = LEGACY_CODE_MAPPING[trainingCamp.campType];
    if (!newCode) {
      throw new Error(
        `Unmapped legacy campType "${trainingCamp.campType}" on TrainingCamp ${trainingCamp.id}`,
      );
    }
    const trainingCampTypeId = trainingCampTypeIdByCode.get(newCode);
    if (!trainingCampTypeId) {
      throw new Error(`No TrainingCampType row found for code "${newCode}" (run the seed first).`);
    }

    await prisma.trainingCamp.update({
      where: { id: trainingCamp.id },
      data: { trainingCampTypeId },
    });
    console.log(
      `TrainingCamp ${trainingCamp.id}: ${trainingCamp.campType} -> ${newCode} (${trainingCampTypeId})`,
    );
  }

  const stillMissing = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "TrainingCamp" WHERE "trainingCampTypeId" IS NULL
  `;
  console.log(
    `Training camps still missing a trainingCampTypeId after backfill: ${stillMissing[0]?.count ?? "?"}`,
  );
}

main().finally(() => prisma.$disconnect());
