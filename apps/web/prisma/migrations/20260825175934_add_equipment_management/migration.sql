-- CreateEnum
CREATE TYPE "EquipmentCondition" AS ENUM ('NEW', 'USED');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('ACTIVE', 'SOLD', 'RETIRED');

-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "harnessId" UUID,
ADD COLUMN     "reserveId" UUID,
ADD COLUMN     "wingId" UUID;

-- AlterTable
ALTER TABLE "GroundHandlingSession" ADD COLUMN     "harnessId" UUID,
ADD COLUMN     "wingId" UUID;

-- CreateTable
CREATE TABLE "EquipmentType" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "EquipmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "equipmentTypeId" UUID NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "size" TEXT,
    "purchaseDate" DATE NOT NULL,
    "condition" "EquipmentCondition" NOT NULL,
    "initialUsageMin" INTEGER NOT NULL DEFAULT 0,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentType_code_key" ON "EquipmentType"("code");

-- CreateIndex
CREATE INDEX "Equipment_userId_idx" ON "Equipment"("userId");

-- CreateIndex
CREATE INDEX "Equipment_equipmentTypeId_idx" ON "Equipment"("equipmentTypeId");

-- CreateIndex
CREATE INDEX "Flight_wingId_idx" ON "Flight"("wingId");

-- CreateIndex
CREATE INDEX "Flight_harnessId_idx" ON "Flight"("harnessId");

-- CreateIndex
CREATE INDEX "Flight_reserveId_idx" ON "Flight"("reserveId");

-- CreateIndex
CREATE INDEX "GroundHandlingSession_wingId_idx" ON "GroundHandlingSession"("wingId");

-- CreateIndex
CREATE INDEX "GroundHandlingSession_harnessId_idx" ON "GroundHandlingSession"("harnessId");

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_wingId_fkey" FOREIGN KEY ("wingId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_harnessId_fkey" FOREIGN KEY ("harnessId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_reserveId_fkey" FOREIGN KEY ("reserveId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroundHandlingSession" ADD CONSTRAINT "GroundHandlingSession_wingId_fkey" FOREIGN KEY ("wingId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroundHandlingSession" ADD CONSTRAINT "GroundHandlingSession_harnessId_fkey" FOREIGN KEY ("harnessId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES "EquipmentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
