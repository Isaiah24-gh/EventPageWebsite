/* ==========================================================================
   Feature 2: Account Webpage
   OWNERSHIP: Isaiah
   ========================================================================== */

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { requireLogin } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/avatars"),
  filename: (req, file, cb) => cb(null, `user-${req.session.user.id}-${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => cb(null, /jpeg|jpg|png|webp/.test(file.mimetype))
});

router.post("/profile", requireLogin, upload.single("avatar"), async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { bio, gender } = req.body;
    const genderValue = ["male", "female"].includes(gender) ? gender : null;

    if (req.file) {
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await pool.query("UPDATE users SET bio = ?, gender = ?, avatar_url = ? WHERE id = ?", [bio, genderValue, avatarUrl, userId]);
    } else {
      await pool.query("UPDATE users SET bio = ?, gender = ? WHERE id = ?", [bio, genderValue, userId]);
    }

    req.flash("success", "Profile updated.");
    res.redirect("/account");
  } catch (err) {
    next(err);
  }
});

router.get("/", requireLogin, async (req, res, next) => {
  try {
    const user = req.session.user;

    const [userRows] = await pool.query("SELECT * FROM users WHERE id = ?", [user.id]);
    const profileUser = userRows[0];

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

    res.render("account", { title: "My Account", pageCss: "account", pageJs: "account", favourites, listings, profileUser });
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