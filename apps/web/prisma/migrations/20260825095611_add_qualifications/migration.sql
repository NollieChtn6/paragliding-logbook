-- CreateTable
CREATE TABLE "QualificationType" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "QualificationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Qualification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "qualificationTypeId" UUID NOT NULL,
    "obtainedDate" DATE NOT NULL,
    "schoolId" UUID,
    "trainingCampId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Qualification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QualificationType_code_key" ON "QualificationType"("code");

-- CreateIndex
CREATE INDEX "Qualification_userId_idx" ON "Qualification"("userId");

-- CreateIndex
CREATE INDEX "Qualification_qualificationTypeId_idx" ON "Qualification"("qualificationTypeId");

-- CreateIndex
CREATE INDEX "Qualification_schoolId_idx" ON "Qualification"("schoolId");

-- CreateIndex
CREATE INDEX "Qualification_trainingCampId_idx" ON "Qualification"("trainingCampId");

-- AddForeignKey
ALTER TABLE "Qualification" ADD CONSTRAINT "Qualification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Qualification" ADD CONSTRAINT "Qualification_qualificationTypeId_fkey" FOREIGN KEY ("qualificationTypeId") REFERENCES "QualificationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Qualification" ADD CONSTRAINT "Qualification_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Qualification" ADD CONSTRAINT "Qualification_trainingCampId_fkey" FOREIGN KEY ("trainingCampId") REFERENCES "TrainingCamp"("id") ON DELETE SET NULL ON UPDATE CASCADE;
