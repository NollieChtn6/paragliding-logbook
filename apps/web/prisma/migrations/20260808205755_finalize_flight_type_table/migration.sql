-- Applied after the historical data backfill
-- (apps/web/scripts/20260808-backfill-flight-type.ts) has populated
-- Flight.flightTypeId for every existing row.

-- AlterTable
ALTER TABLE "Flight" ALTER COLUMN "flightTypeId" SET NOT NULL;

ALTER TABLE "Flight" DROP COLUMN "flightType";
