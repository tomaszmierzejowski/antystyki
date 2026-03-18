-- ============================================================
-- Antystyki — Safe Auto-Generated Content Cleanup Script
-- ============================================================
-- PURPOSE:
--   Delete all Statistics and Antistics created by the system
--   batch job (antystyki@gmail.com). Manually-created records
--   from any other user are NOT touched.
--
-- HOW TO RUN (choose one):
--   Option A — via Docker exec:
--     docker exec -it antystics-db psql -U postgres -d antystics -f /path/to/cleanup_autogen_content.sql
--
--   Option B — direct psql:
--     psql -h localhost -p 5432 -U postgres -d antystics -f cleanup_autogen_content.sql
--
-- REVIEW STEP:
--   Run the SELECT queries first (section 1) to confirm row counts.
--   Only run the DELETE queries (section 2) after you are satisfied.
-- ============================================================

-- ============================================================
-- SECTION 1 — REVIEW: Identify the system user and row counts
-- ============================================================

-- 1a. Find the system user's ID
SELECT id, "Email", "UserName"
FROM "AspNetUsers"
WHERE "Email" = 'antystyki@gmail.com';

-- 1b. Count auto-generated Antistics (replace <SYSTEM_USER_ID> with the id from above)
-- SELECT COUNT(*) AS antistics_to_delete
-- FROM "Antistics"
-- WHERE "UserId" = '<SYSTEM_USER_ID>';

-- 1c. Count auto-generated Statistics
-- SELECT COUNT(*) AS statistics_to_delete
-- FROM "Statistics"
-- WHERE "CreatedByUserId" = '<SYSTEM_USER_ID>';

-- 1d. Sanity-check: confirm zero manually-created records share this user id
-- SELECT COUNT(*) AS manual_antistics_preserved
-- FROM "Antistics"
-- WHERE "UserId" != '<SYSTEM_USER_ID>';


-- ============================================================
-- SECTION 2 — EXECUTE: Delete auto-generated records
--   !! Replace <SYSTEM_USER_ID> with the actual UUID before running !!
-- ============================================================

-- BEGIN;

-- DELETE FROM "Antistics"
-- WHERE "UserId" = '<SYSTEM_USER_ID>';

-- DELETE FROM "Statistics"
-- WHERE "CreatedByUserId" = '<SYSTEM_USER_ID>';

-- -- Verify final counts
-- SELECT
--   (SELECT COUNT(*) FROM "Antistics")  AS remaining_antistics,
--   (SELECT COUNT(*) FROM "Statistics") AS remaining_statistics;

-- COMMIT;

-- ============================================================
-- NOTE: Foreign-key ordering
--   If your schema has FK constraints from other tables (e.g.
--   Likes, Reports) pointing to Statistics or Antistics, delete
--   those child rows first, or add ON DELETE CASCADE to the FK.
-- ============================================================
