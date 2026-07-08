/* ==========================================================================
   Feature 4: Email System
   OWNERSHIP: [teammate name]
   ========================================================================== */

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { requireLogin } = require("../middleware/auth");

router.get("/", requireLogin, async (req, res, next) => {
  try {
    const userId = req.session.user.id;

    const [prefRows] = await pool.query("SELECT * FROM email_preferences WHERE user_id = ?", [userId]);
    const prefs = prefRows[0] || {
      subscribed: false,
      categories: "",
      reminders_enabled: true,
      contact_email: req.session.user.email
    };

    const [categoryRows] = await pool.query(
      "SELECT DISTINCT category FROM events WHERE status = 'active' ORDER BY category"
    );

    const [sampleEvents] = await pool.query(
      "SELECT * FROM events WHERE status = 'active' ORDER BY event_date ASC LIMIT 3"
    );

    res.render("email-preferences", {
      title: "Email Preferences",
      active: "email",
      pageCss: "email",
      pageJs: "email",
      prefs,
      selectedCategories: (prefs.categories || "").split(",").filter(Boolean),
      categories: categoryRows.map(r => r.category),
      sampleEvents
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireLogin, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { subscribed, reminders, contactEmail, categories } = req.body;
    const categoryList = Array.isArray(categories) ? categories : (categories ? [categories] : []);

    await pool.query(
      `INSERT INTO email_preferences (user_id, subscribed, categories, reminders_enabled, contact_email)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE subscribed = VALUES(subscribed), categories = VALUES(categories),
         reminders_enabled = VALUES(reminders_enabled), contact_email = VALUES(contact_email)`,
      [userId, !!subscribed, categoryList.join(","), !!reminders, contactEmail]
    );

    req.flash("success", "Email preferences saved!");
    res.redirect("/email-preferences");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
