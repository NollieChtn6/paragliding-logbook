-- Applied after the historical data backfill
-- (apps/web/scripts/20260809-backfill-training-camp-type.ts) has populated
-- TrainingCamp.trainingCampTypeId for every existing row.

-- AlterTable
ALTER TABLE "TrainingCamp" ALTER COLUMN "trainingCampTypeId" SET NOT NULL;

ALTER TABLE "TrainingCamp" DROP COLUMN "campType";
