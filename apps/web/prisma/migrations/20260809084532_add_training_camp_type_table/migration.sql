-- TrainingCampType: new reference table (docs/decisions/003-reference-table-codes.md),
-- same principle as ActivityType/SitePointType/FlightType, but with
-- createdAt/updatedAt (explicit requirement for this table only).
-- TrainingCamp.trainingCampTypeId is added nullable here; TrainingCamp.campType
-- (existing TEXT column) is kept untouched so a follow-up backfill script can
-- still read it. A finalize migration (after seed + backfill) makes
-- trainingCampTypeId NOT NULL and drops campType, mirroring the two-step
-- approach already used for FlightType
-- (20260808205622_add_flight_type_table / 20260808205755_finalize_flight_type_table).

-- CreateTable
CREATE TABLE "TrainingCampType" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingCampType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCampType_code_key" ON "TrainingCampType"("code");

-- AlterTable
ALTER TABLE "TrainingCamp" ADD COLUMN "trainingCampTypeId" UUID;

-- CreateIndex
CREATE INDEX "TrainingCamp_trainingCampTypeId_idx" ON "TrainingCamp"("trainingCampTypeId");

-- AddForeignKey
ALTER TABLE "TrainingCamp" ADD CONSTRAINT "TrainingCamp_trainingCampTypeId_fkey" FOREIGN KEY ("trainingCampTypeId") REFERENCES "TrainingCampType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
