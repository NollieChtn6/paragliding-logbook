-- Flight: departurePointId/arrivalPointId (generic roles) become
-- takeoffPointId/landingPointId, matching the new business rule that a
-- takeoff point must be of SitePointType TAKEOFF and a landing point of
-- type LANDING (enforced at the application layer, see
-- features/flights/{create,update}-flight.service.ts).
--
-- Every existing Flight row already satisfies this rule (verified:
-- departurePointId always points to a TAKEOFF point, arrivalPointId always
-- to a LANDING point) — a direct copy, no data loss, no ambiguous case.
ALTER TABLE "Flight" ADD COLUMN "takeoffPointId" UUID;
ALTER TABLE "Flight" ADD COLUMN "landingPointId" UUID;

UPDATE "Flight" SET "takeoffPointId" = "departurePointId", "landingPointId" = "arrivalPointId";

ALTER TABLE "Flight" ALTER COLUMN "takeoffPointId" SET NOT NULL;
ALTER TABLE "Flight" ALTER COLUMN "landingPointId" SET NOT NULL;

ALTER TABLE "Flight" DROP CONSTRAINT "Flight_departurePointId_fkey";
ALTER TABLE "Flight" DROP CONSTRAINT "Flight_arrivalPointId_fkey";
DROP INDEX "Flight_departurePointId_idx";
DROP INDEX "Flight_arrivalPointId_idx";
ALTER TABLE "Flight" DROP COLUMN "departurePointId";
ALTER TABLE "Flight" DROP COLUMN "arrivalPointId";

CREATE INDEX "Flight_takeoffPointId_idx" ON "Flight"("takeoffPointId");
CREATE INDEX "Flight_landingPointId_idx" ON "Flight"("landingPointId");

ALTER TABLE "Flight" ADD CONSTRAINT "Flight_takeoffPointId_fkey" FOREIGN KEY ("takeoffPointId") REFERENCES "SitePoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_landingPointId_fkey" FOREIGN KEY ("landingPointId") REFERENCES "SitePoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Site: drop the "primary point" concept entirely (business decision — a
-- Site groups an arbitrary number of TAKEOFF/LANDING points, none of them
-- privileged; see docs/decisions/005-flight-takeoff-landing-points.md).
ALTER TABLE "Site" DROP CONSTRAINT "Site_primaryTakeoffPointId_fkey";
ALTER TABLE "Site" DROP CONSTRAINT "Site_primaryLandingPointId_fkey";
DROP INDEX "Site_primaryTakeoffPointId_idx";
DROP INDEX "Site_primaryLandingPointId_idx";
ALTER TABLE "Site" DROP COLUMN "primaryTakeoffPointId";
ALTER TABLE "Site" DROP COLUMN "primaryLandingPointId";
