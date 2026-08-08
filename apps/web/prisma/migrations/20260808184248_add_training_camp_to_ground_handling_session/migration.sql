-- AlterTable
ALTER TABLE "GroundHandlingSession" ADD COLUMN     "trainingCampId" UUID;

-- CreateIndex
CREATE INDEX "GroundHandlingSession_trainingCampId_idx" ON "GroundHandlingSession"("trainingCampId");

-- AddForeignKey
ALTER TABLE "GroundHandlingSession" ADD CONSTRAINT "GroundHandlingSession_trainingCampId_fkey" FOREIGN KEY ("trainingCampId") REFERENCES "TrainingCamp"("id") ON DELETE SET NULL ON UPDATE CASCADE;
