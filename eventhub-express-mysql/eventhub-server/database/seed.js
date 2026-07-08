/* ==========================================================================
   EventHub — Seed Script
   Run after schema.sql has been applied:  npm run seed
   Creates demo accounts, events, and a couple of flagged items so the
   Admin Portal has something to moderate out of the box.
   ========================================================================== */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function seed() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const adminHash = await bcrypt.hash("admin123", 10);

  console.log("Seeding users…");
  const [adminResult] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, 'admin', 'active')`,
    ["Site Admin", "admin@eventhub.local", adminHash]
  );

  const [organiserResult] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, org_name, status) VALUES (?, ?, ?, 'organiser', ?, 'active')`,
    ["RP Anime Society", "contact@rpanimesoc.edu.sg", passwordHash, "RP Anime Society"]
  );

  const [organiser2Result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, org_name, status) VALUES (?, ?, ?, 'organiser', ?, 'active')`,
    ["ClearStock SG", "events@clearstock.sg", passwordHash, "ClearStock SG"]
  );

  const [spamOrganiserResult] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, org_name, status) VALUES (?, ?, ?, 'organiser', ?, 'active')`,
    ["Definitely Not Spam LLC", "totally.legit@freemail.com", passwordHash, "Definitely Not Spam LLC"]
  );

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, 'visitor', 'active')`,
    ["Jamie Tan", "jamie.tan@example.com", passwordHash]
  );

  const organiserId = organiserResult.insertId;
  const organiser2Id = organiser2Result.insertId;
  const spamOrganiserId = spamOrganiserResult.insertId;

  console.log("Seeding events…");
  const events = [
    [organiserId, "Campus Anime & Manga Fandom Meet", "Fandom", "2026-07-12", "14:00:00", "Republic Polytechnic, Hub Level 2", "Cosplay, swap-market, and a fan-art showcase for anime and manga fans.", "https://example.com/rp-anime-meet", 0, "active"],
    [organiser2Id, "Weekend Warehouse Clearance Sale", "Warehouse Sale", "2026-07-18", "10:00:00", "Sungei Kadut Warehouse 7", "Up to 70% off overstocked apparel, homeware, and electronics.", "https://example.com/clearstock-sale", 0, "active"],
    [organiserId, "Handmade Flea & Vintage Market", "Flea Market", "2026-07-19", "11:00:00", "Somerset Skate Park", "Local makers selling handmade crafts, vintage clothing, and vinyl.", "https://example.com/handmade-flea", 0, "active"],
    [organiser2Id, "Beginner Pottery Hobby Workshop", "Hobby", "2026-07-25", "16:30:00", "Studio Clay, Tiong Bahru", "Hands-on wheel-throwing session for absolute beginners. Materials included.", "https://example.com/pottery-workshop", 38, "active"],
    [organiserId, "Student Startup Demo Night", "Student Activity", "2026-08-02", "18:30:00", "LaunchLab Auditorium", "Student teams pitch their semester projects to a live audience.", "https://example.com/demo-night", 0, "active"],
    [spamOrganiserId, "FREE IPHONE GIVEAWAY CLICK NOW", "Pop-up Sale", "2026-08-05", "12:00:00", "Unknown location", "Click here to claim your free prize!!! Limited time!!!", "https://totally-not-a-scam.example", 0, "flagged"]
  ];

  const eventIds = [];
  for (const evt of events) {
    const [result] = await pool.query(
      `INSERT INTO events (organiser_id, title, category, event_date, event_time, venue, description, external_url, price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      evt
    );
    eventIds.push(result.insertId);
  }

  console.log("Seeding reviews…");
  await pool.query(
    `INSERT INTO reviews (event_id, name, rating, comment, status) VALUES (?, ?, ?, ?, 'visible')`,
    [eventIds[0], "Wei Ling", 5, "Amazing turnout and the cosplay contest was so much fun!"]
  );
  await pool.query(
    `INSERT INTO reviews (event_id, name, rating, comment, status) VALUES (?, ?, ?, ?, 'flagged')`,
    [eventIds[0], "totally_real_user_99", 1, "VISIT MY PROFILE FOR FREE FOLLOWERS!!! link in bio"]
  );

  console.log("Seeding reports (moderation queue)…");
  await pool.query(
    `INSERT INTO reports (target_type, target_id, reason, reported_by, status) VALUES (?, ?, ?, ?, 'open')`,
    ["event", eventIds[5], "This looks like a scam / phishing listing", "jamie.tan@example.com"]
  );
  await pool.query(
    `INSERT INTO reports (target_type, target_id, reason, reported_by, status) VALUES (?, ?, ?, ?, 'open')`,
    ["user", spamOrganiserId, "Account is posting spam/scam event listings", "jamie.tan@example.com"]
  );

  console.log("\nSeed complete.");
  console.log("Admin login:     admin@eventhub.local / admin123");
  console.log("Organiser login: contact@rpanimesoc.edu.sg / password123");
  console.log("Visitor login:   jamie.tan@example.com / password123");

  await pool.end();
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
