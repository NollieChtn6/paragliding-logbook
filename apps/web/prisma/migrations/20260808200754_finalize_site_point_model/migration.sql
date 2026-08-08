-- Applied after the historical data backfill
-- (apps/web/scripts/20260808-backfill-flight-site-points.ts) has populated
-- Flight.departurePointId/arrivalPointId for every existing row.

-- DropForeignKey
ALTER TABLE "Flight" DROP CONSTRAINT "Flight_siteId_fkey";

-- DropIndex
DROP INDEX "Flight_siteId_idx";

-- AlterTable
ALTER TABLE "Flight" ALTER COLUMN "departurePointId" SET NOT NULL,
ALTER COLUMN "arrivalPointId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Flight" DROP COLUMN "landingAltitudeM",
DROP COLUMN "siteId",
DROP COLUMN "takeoffAltitudeM";
