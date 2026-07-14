-- ==========================================================================
-- Migration: add avatar_url + bio to users (Feature 2: Account Webpage)
-- Run this ONLY if your local database was created before these columns
-- existed. Fresh installs from schema.sql already have them.
--   mysql -u root -p eventhub < database/migration_add_profile_fields.sql
-- ==========================================================================

USE eventhub;

ALTER TABLE users
  ADD COLUMN avatar_url VARCHAR(255) NULL AFTER org_name,
  ADD COLUMN bio VARCHAR(500) NULL AFTER avatar_url;
