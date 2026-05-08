-- Backfilled local migration to match database history.
-- This migration is intentionally aligned with already-applied DB changes.

ALTER TABLE `UserInfo`
    ADD COLUMN `bmi` DOUBLE NULL,
    ADD COLUMN `bmr` DOUBLE NULL;
