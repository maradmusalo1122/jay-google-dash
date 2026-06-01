-- Add MediaKind enum + kind/duration/width/height fields to Photo,
-- so the table can store videos alongside photos.

-- 1. New enum
CREATE TYPE "MediaKind" AS ENUM ('photo', 'video');

-- 2. Photo table: add columns (all defaulted or nullable so existing rows are safe)
ALTER TABLE "Photo"
  ADD COLUMN     "kind"      "MediaKind" NOT NULL DEFAULT 'photo',
  ADD COLUMN     "duration"  INTEGER,
  ADD COLUMN     "width"     INTEGER,
  ADD COLUMN     "height"    INTEGER;
