-- ==========================================================================
-- Migration: add gender to users (Feature 1/2: preferred gender on profile)
-- Run this ONLY if your local database was created before this column
-- existed. Fresh installs from schema.sql already have it.
--   mysql -u root -p eventhub < database/migration_add_gender_field.sql
-- ==========================================================================
 
USE eventhub;
 
ALTER TABLE users
  ADD COLUMN gender ENUM('male', 'female') NULL AFTER bio;