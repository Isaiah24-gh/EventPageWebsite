-- ==========================================================================
-- Migration: add orders table (Order & Payment Tracking)
-- Run this to add the new orders table to an existing database.
--   mysql -u root -p eventhub < database/migration_add_orders_table.sql
-- ==========================================================================

USE eventhub;

-- ---------- Orders & Payment Tracking ----------
CREATE TABLE IF NOT EXISTS orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  event_id        INT NOT NULL,
  quantity        INT NOT NULL,
  total_paid      DECIMAL(10, 2) NOT NULL,
  transaction_id  VARCHAR(100) NOT NULL,
  status          VARCHAR(50) DEFAULT 'Paid',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB;
