-- Convert Flight.flightType from the enum to plain text first, so its
-- existing values stay readable for the backfill script (see
-- apps/web/scripts/) once the enum type itself is dropped. The new
-- flightTypeId column is added nullable here; a follow-up migration
-- (after seed + backfill) makes it NOT NULL and drops this legacy column,
-- mirroring the two-step approach already used for the Site/SitePoint
-- migration.
ALTER TABLE "Flight" ALTER COLUMN "flightType" TYPE TEXT;

-- DropEnum
DROP TYPE "FlightType";

-- AlterTable: reference tables lose their label column (docs/decisions/003-reference-table-codes.md)
ALTER TABLE "ActivityType" DROP COLUMN "label";

ALTER TABLE "SitePointType" DROP COLUMN "label";

-- CreateTable
CREATE TABLE "FlightType" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "FlightType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlightType_code_key" ON "FlightType"("code");

-- AlterTable
ALTER TABLE "Flight" ADD COLUMN "flightTypeId" UUID;

-- CreateIndex
CREATE INDEX "Flight_flightTypeId_idx" ON "Flight"("flightTypeId");

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_flightTypeId_fkey" FOREIGN KEY ("flightTypeId") REFERENCES "FlightType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
