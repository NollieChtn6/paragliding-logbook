-- CreateEnum
CREATE TYPE "FlightType" AS ENUM ('LOCAL', 'CROSS', 'SOARING', 'THERMAL', 'TRAINING', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityType" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "ActivityType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "activityTypeId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flight" (
    "id" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "trainingCampId" UUID,
    "date" TIMESTAMP(3) NOT NULL,
    "takeoffAltitudeM" INTEGER NOT NULL,
    "landingAltitudeM" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "flightType" "FlightType" NOT NULL,
    "observations" TEXT NOT NULL,
    "improvementPoints" TEXT NOT NULL,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingCamp" (
    "id" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "campType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "certification" TEXT,

    CONSTRAINT "TrainingCamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroundHandlingSession" (
    "id" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "exercises" TEXT NOT NULL,
    "difficulties" TEXT,
    "feeling" TEXT,

    CONSTRAINT "GroundHandlingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityType_code_key" ON "ActivityType"("code");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Flight_activityId_key" ON "Flight"("activityId");

-- CreateIndex
CREATE INDEX "Flight_siteId_idx" ON "Flight"("siteId");

-- CreateIndex
CREATE INDEX "Flight_trainingCampId_idx" ON "Flight"("trainingCampId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCamp_activityId_key" ON "TrainingCamp"("activityId");

-- CreateIndex
CREATE INDEX "TrainingCamp_schoolId_idx" ON "TrainingCamp"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "GroundHandlingSession_activityId_key" ON "GroundHandlingSession"("activityId");

-- CreateIndex
CREATE INDEX "GroundHandlingSession_siteId_idx" ON "GroundHandlingSession"("siteId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_activityTypeId_fkey" FOREIGN KEY ("activityTypeId") REFERENCES "ActivityType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_trainingCampId_fkey" FOREIGN KEY ("trainingCampId") REFERENCES "TrainingCamp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCamp" ADD CONSTRAINT "TrainingCamp_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCamp" ADD CONSTRAINT "TrainingCamp_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroundHandlingSession" ADD CONSTRAINT "GroundHandlingSession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroundHandlingSession" ADD CONSTRAINT "GroundHandlingSession_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
