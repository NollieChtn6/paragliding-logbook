-- Renommage de vocabulaire (ADR 007, docs/decisions/007-site-spot-terminology-rename.md) :
-- Site -> Spot, SitePoint -> Site, SitePointType -> SiteType. Écrit à la
-- main plutôt que généré par `prisma migrate dev` : le diff automatique
-- traite ça comme des DROP/CREATE (perte des données existantes), alors que
-- ce sont des renommages purs. Ordre obligatoire : "Site" doit d'abord être
-- libéré (renommé en "Spot") avant que "SitePoint" puisse le reprendre.

-- RenameTable
ALTER TABLE "Site" RENAME TO "Spot";
ALTER TABLE "SitePoint" RENAME TO "Site";
ALTER TABLE "SitePointType" RENAME TO "SiteType";

-- RenameColumn
ALTER TABLE "GroundHandlingSession" RENAME COLUMN "siteId" TO "spotId";
ALTER TABLE "Site" RENAME COLUMN "siteId" TO "spotId";
ALTER TABLE "Site" RENAME COLUMN "sitePointTypeId" TO "siteTypeId";

-- RenameConstraint (renommer une contrainte de clé primaire renomme aussi
-- son index de support automatiquement, pas besoin d'ALTER INDEX séparé
-- pour celles-ci)
ALTER TABLE "Spot" RENAME CONSTRAINT "Site_pkey" TO "Spot_pkey";
ALTER TABLE "Site" RENAME CONSTRAINT "SitePoint_pkey" TO "Site_pkey";
ALTER TABLE "Site" RENAME CONSTRAINT "SitePoint_siteId_fkey" TO "Site_spotId_fkey";
ALTER TABLE "Site" RENAME CONSTRAINT "SitePoint_sitePointTypeId_fkey" TO "Site_siteTypeId_fkey";
ALTER TABLE "SiteType" RENAME CONSTRAINT "SitePointType_pkey" TO "SiteType_pkey";
ALTER TABLE "GroundHandlingSession" RENAME CONSTRAINT "GroundHandlingSession_siteId_fkey" TO "GroundHandlingSession_spotId_fkey";

-- Note : Flight_takeoffPointId_fkey / Flight_landingPointId_fkey référencent
-- la table renommée Site (ex-SitePoint) par OID, pas par nom — Postgres n'a
-- besoin d'aucune instruction pour rester cohérent après le renommage de la
-- table cible.

-- RenameIndex (index simples, non portés par une contrainte)
ALTER INDEX "SitePoint_siteId_idx" RENAME TO "Site_spotId_idx";
ALTER INDEX "SitePoint_sitePointTypeId_idx" RENAME TO "Site_siteTypeId_idx";
ALTER INDEX "SitePointType_code_key" RENAME TO "SiteType_code_key";
ALTER INDEX "GroundHandlingSession_siteId_idx" RENAME TO "GroundHandlingSession_spotId_idx";
