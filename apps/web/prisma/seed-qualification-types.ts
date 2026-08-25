// Chargé explicitement : ce script est invoqué directement via tsx (pas via
// `prisma db seed`), donc pas de passage par prisma.config.ts qui fait ce
// import pour le seed principal.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Référentiel QualificationType (docs/domain-model.md, issue #171) : table
// de référence, même principe qu'ActivityType/SiteType/FlightType/
// TrainingCampType (docs/decisions/003-reference-table-codes.md). Pas de
// label ici, le libellé affiché vit dans src/messages/{fr-FR,en-GB}.ts.
//
// Script volontairement séparé de prisma/seed.ts (pas branché sur
// `prisma db seed`/prisma.config.ts) : ce référentiel doit pouvoir être
// peuplé indépendamment sur preview et sur prod, sans ré-exécuter le reste
// du seed principal (comptes/écoles/spots) à chaque fois. À lancer via
// `pnpm --filter web prisma:seed:qualification-types`.
const qualificationTypes = [
  { code: "INITIATION" },
  { code: "PILOT" },
  { code: "CONFIRMED_PILOT" },
  { code: "TANDEM" },
  { code: "SIV" },
  { code: "INSTRUCTOR" },
  { code: "OTHER" },
];

async function main() {
  for (const qualificationType of qualificationTypes) {
    await prisma.qualificationType.upsert({
      where: { code: qualificationType.code },
      update: {},
      create: qualificationType,
    });
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
