/*
  Warnings:

  - You are about to drop the column `certification` on the `TrainingCamp` table. All the data in that column will be lost.

*/
-- AlterTable
ALTER TABLE "TrainingCamp" DROP COLUMN "certification",
ADD COLUMN     "qualificationTypeId" UUID;

-- CreateIndex
CREATE INDEX "TrainingCamp_qualificationTypeId_idx" ON "TrainingCamp"("qualificationTypeId");

-- AddForeignKey
ALTER TABLE "TrainingCamp" ADD CONSTRAINT "TrainingCamp_qualificationTypeId_fkey" FOREIGN KEY ("qualificationTypeId") REFERENCES "QualificationType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
