-- ==========================================================================
-- Migration: add password_resets table (Feature 4: Email System)
-- Backs the "Forgot password" flow — one row per reset link issued.
-- Run this ONLY if your local database was created before this table
-- existed. Fresh installs from schema.sql already have it.
--   mysql -u root -p eventhub < database/migration_add_password_resets.sql
-- ==========================================================================

USE eventhub;

CREATE TABLE IF NOT EXISTS password_resets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  token_hash  CHAR(64) NOT NULL,          -- SHA-256 of the token, never the token itself
  expires_at  DATETIME NOT NULL,
  used_at     DATETIME NULL,              -- set once the link has been used
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_password_resets_token ON password_resets(token_hash);
