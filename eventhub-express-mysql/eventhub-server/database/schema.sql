-- ==========================================================================
-- EventHub — Database Schema
-- Run this once against a fresh database: mysql -u root -p eventhub < schema.sql
-- ==========================================================================

CREATE DATABASE IF NOT EXISTS eventhub CHARACTER SET utf8mb4;
USE eventhub;

-- ---------- Users (Feature 1 & 2) ----------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('visitor', 'organiser', 'admin') NOT NULL DEFAULT 'visitor',
  org_name      VARCHAR(160) NULL,
  avatar_url    VARCHAR(255) NULL,
  bio           VARCHAR(500) NULL,
  status        ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Events (Feature 2 organiser listings + homepage browse) ----------
CREATE TABLE IF NOT EXISTS events (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  organiser_id  INT NOT NULL,
  title         VARCHAR(180) NOT NULL,
  category      VARCHAR(80) NOT NULL,
  event_date    DATE NOT NULL,
  event_time    TIME NOT NULL,
  venue         VARCHAR(200) NOT NULL,
  description   TEXT NOT NULL,
  external_url  VARCHAR(500) NOT NULL,
  price         DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  status        ENUM('active', 'flagged', 'removed') NOT NULL DEFAULT 'active',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organiser_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Reviews & comments (Feature 3) ----------
CREATE TABLE IF NOT EXISTS reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  event_id    INT NOT NULL,
  user_id     INT NULL,
  name        VARCHAR(120) NOT NULL,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT NOT NULL,
  status      ENUM('visible', 'flagged', 'removed') NOT NULL DEFAULT 'visible',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- Favourites (used by Feature 2 dashboard) ----------
CREATE TABLE IF NOT EXISTS favourites (
  user_id     INT NOT NULL,
  event_id    INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, event_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Reminders (Feature 5) ----------
CREATE TABLE IF NOT EXISTS reminders (
  user_id     INT NOT NULL,
  event_id    INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, event_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Email preferences (Feature 4) ----------
CREATE TABLE IF NOT EXISTS email_preferences (
  user_id             INT PRIMARY KEY,
  subscribed          BOOLEAN NOT NULL DEFAULT FALSE,
  categories          VARCHAR(500) NOT NULL DEFAULT '',   -- comma-separated category list
  reminders_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  contact_email       VARCHAR(190) NOT NULL,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Reports / moderation queue (feeds the Admin Portal) ----------
CREATE TABLE IF NOT EXISTS reports (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  target_type   ENUM('event', 'review', 'user') NOT NULL,
  target_id     INT NOT NULL,
  reason        VARCHAR(255) NOT NULL,
  reported_by   VARCHAR(120) NULL,
  status        ENUM('open', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Admin action log (accountability trail for the Admin Portal) ----------
CREATE TABLE IF NOT EXISTS admin_actions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  admin_id      INT NOT NULL,
  action        VARCHAR(255) NOT NULL,
  target_type   VARCHAR(50) NOT NULL,
  target_id     INT NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_reviews_event ON reviews(event_id);
CREATE INDEX idx_reports_status ON reports(status);
