-- School: structured address fields (address/postalCode/city/countryCode +
-- coordinates), replacing the free-text `location`. createdAt/updatedAt
-- already exist on this table (added in an earlier migration), nothing to
-- do there.
ALTER TABLE "School" ADD COLUMN "address" TEXT,
                      ADD COLUMN "city" TEXT,
                      ADD COLUMN "countryCode" CHAR(2),
                      ADD COLUMN "latitude" DOUBLE PRECISION,
                      ADD COLUMN "longitude" DOUBLE PRECISION,
                      ADD COLUMN "postalCode" TEXT;

-- Backfill: `location` was free text that in practice held the school's
-- commune/city name (e.g. "Annecy", "Saint-Hilaire-du-Touvet") — copied
-- as-is into `city`, the closest structured equivalent. address/postalCode/
-- countryCode cannot be reliably derived from a single free-text field and
-- are intentionally left NULL rather than guessed (see
-- docs/decisions/004-editable-referentials.md).
UPDATE "School" SET "city" = "location" WHERE "location" IS NOT NULL;

ALTER TABLE "School" DROP COLUMN "location";

-- Site: `country` (free text) becomes `countryCode` (ISO 3166-1 alpha-2).
ALTER TABLE "Site" ADD COLUMN "countryCode" CHAR(2);

-- Backfill: no known Site row currently has a non-null `country` value, but
-- this mapping documents the intended conversion for the common spellings
-- already used as examples elsewhere in the app (FR/CH/IT/ES). Anything not
-- recognized is left NULL rather than truncated/guessed.
UPDATE "Site" SET "countryCode" = CASE
  WHEN "country" ILIKE 'france' THEN 'FR'
  WHEN "country" ILIKE 'suisse' OR "country" ILIKE 'switzerland' THEN 'CH'
  WHEN "country" ILIKE 'italie' OR "country" ILIKE 'italy' THEN 'IT'
  WHEN "country" ILIKE 'espagne' OR "country" ILIKE 'spain' THEN 'ES'
  ELSE NULL
END
WHERE "country" IS NOT NULL;

ALTER TABLE "Site" DROP COLUMN "country";
