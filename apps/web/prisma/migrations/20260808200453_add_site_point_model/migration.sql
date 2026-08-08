-- CreateTable
CREATE TABLE "SitePointType" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "SitePointType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitePoint" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "siteId" UUID NOT NULL,
    "sitePointTypeId" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitudeM" INTEGER NOT NULL,
    "orientationDeg" INTEGER,

    CONSTRAINT "SitePoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SitePointType_code_key" ON "SitePointType"("code");

-- CreateIndex
CREATE INDEX "SitePoint_siteId_idx" ON "SitePoint"("siteId");

-- CreateIndex
CREATE INDEX "SitePoint_sitePointTypeId_idx" ON "SitePoint"("sitePointTypeId");

-- AddForeignKey
ALTER TABLE "SitePoint" ADD CONSTRAINT "SitePoint_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitePoint" ADD CONSTRAINT "SitePoint_sitePointTypeId_fkey" FOREIGN KEY ("sitePointTypeId") REFERENCES "SitePointType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Site gains its primary point pointers (nullable: no Site
-- management UI yet, existing Sites have no SitePoint at all).
ALTER TABLE "Site" ADD COLUMN     "primaryLandingPointId" UUID,
ADD COLUMN     "primaryTakeoffPointId" UUID;

-- CreateIndex
CREATE INDEX "Site_primaryTakeoffPointId_idx" ON "Site"("primaryTakeoffPointId");

-- CreateIndex
CREATE INDEX "Site_primaryLandingPointId_idx" ON "Site"("primaryLandingPointId");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_primaryTakeoffPointId_fkey" FOREIGN KEY ("primaryTakeoffPointId") REFERENCES "SitePoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_primaryLandingPointId_fkey" FOREIGN KEY ("primaryLandingPointId") REFERENCES "SitePoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Flight gains departurePointId/arrivalPointId as NULLABLE for
-- now. A follow-up migration (after the historical data backfill script,
-- see apps/web/scripts/) sets them NOT NULL and drops siteId/
-- takeoffAltitudeM/landingAltitudeM. Splitting in two migrations keeps this
-- one pure DDL, consistent with every other migration in this project
-- (reference/historical data lives in seed.ts or a one-off script, never in
-- migration.sql).
ALTER TABLE "Flight" ADD COLUMN     "arrivalPointId" UUID,
ADD COLUMN     "departurePointId" UUID;

-- CreateIndex
CREATE INDEX "Flight_departurePointId_idx" ON "Flight"("departurePointId");

-- CreateIndex
CREATE INDEX "Flight_arrivalPointId_idx" ON "Flight"("arrivalPointId");

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_departurePointId_fkey" FOREIGN KEY ("departurePointId") REFERENCES "SitePoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_arrivalPointId_fkey" FOREIGN KEY ("arrivalPointId") REFERENCES "SitePoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
