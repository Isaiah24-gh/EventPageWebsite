/* ==========================================================================
   Feature 2: Account Webpage
   OWNERSHIP: [teammate name]
   ========================================================================== */

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { requireLogin } = require("../middleware/auth");

router.get("/", requireLogin, async (req, res, next) => {
  try {
    const user = req.session.user;

    const [favourites] = await pool.query(
      `SELECT e.* FROM favourites f
       JOIN events e ON e.id = f.event_id
       WHERE f.user_id = ? AND e.status != 'removed'
       ORDER BY e.event_date ASC`,
      [user.id]
    );

    let listings = [];
    if (user.role === "organiser") {
      const [rows] = await pool.query(
        `SELECT * FROM events WHERE organiser_id = ? ORDER BY event_date DESC`,
        [user.id]
      );
      listings = rows;
    }

    res.render("account", { title: "My Account", pageCss: "account", pageJs: "account", favourites, listings });
  } catch (err) {
    next(err);
  }
});

router.post("/favourites/:eventId", requireLogin, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const eventId = req.params.eventId;

    const [existing] = await pool.query(
      "SELECT * FROM favourites WHERE user_id = ? AND event_id = ?",
      [userId, eventId]
    );

    if (existing.length) {
      await pool.query("DELETE FROM favourites WHERE user_id = ? AND event_id = ?", [userId, eventId]);
      req.flash("success", "Removed from favourites.");
    } else {
      await pool.query("INSERT INTO favourites (user_id, event_id) VALUES (?, ?)", [userId, eventId]);
      req.flash("success", "Saved to favourites.");
    }

    res.redirect(req.get("Referrer") || "/account");
  } catch (err) {
    next(err);
  }
});

router.post("/listings", requireLogin, async (req, res, next) => {
  try {
    if (req.session.user.role !== "organiser") {
      req.flash("error", "Only organiser accounts can publish listings.");
      return res.redirect("/account");
    }

    const { title, category, eventDate, eventTime, venue, description, externalUrl } = req.body;

    await pool.query(
      `INSERT INTO events (organiser_id, title, category, event_date, event_time, venue, description, external_url, price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'active')`,
      [req.session.user.id, title, category, eventDate, eventTime, venue, description, externalUrl]
    );

    req.flash("success", "Listing published!");
    res.redirect("/account");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
