/* ==========================================================================
   Feature 3: Event Detail, Reviews & Comments
   OWNERSHIP: Cheeks
   ========================================================================== */

const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/:id", async (req, res, next) => {
  try {
    const eventId = req.params.id;

    const [eventRows] = await pool.query(
      `SELECT e.*, u.name AS organiser_name FROM events e
       JOIN users u ON u.id = e.organiser_id
       WHERE e.id = ? AND e.status != 'removed'`,
      [eventId]
    );
    const event = eventRows[0];
    if (!event) {
      return res.status(404).render("404", { title: "Event Not Found" });
    }

    const [reviews] = await pool.query(
      `SELECT * FROM reviews WHERE event_id = ? AND status != 'removed' ORDER BY created_at DESC`,
      [eventId]
    );

    const avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    let isFavourited = false;
    if (req.session.user) {
      const [favRows] = await pool.query(
        "SELECT 1 FROM favourites WHERE user_id = ? AND event_id = ?",
        [req.session.user.id, eventId]
      );
      isFavourited = favRows.length > 0;
    }

    res.render("event-detail", {
      title: event.title,
      pageCss: "reviews",
      pageJs: "reviews",
      event,
      reviews,
      avgRating,
      isFavourited
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/reviews", async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const { name, rating, comment } = req.body;

    if (!name || !rating || !comment) {
      req.flash("error", "Please fill in your name, a rating, and a comment.");
      return res.redirect(`/events/${eventId}`);
    }

    await pool.query(
      `INSERT INTO reviews (event_id, user_id, name, rating, comment, status) VALUES (?, ?, ?, ?, ?, 'visible')`,
      [eventId, req.session.user ? req.session.user.id : null, name, rating, comment]
    );

    req.flash("success", "Review posted!");
    res.redirect(`/events/${eventId}#reviews`);
  } catch (err) {
    next(err);
  }
});

// ---- Reporting (feeds the Admin Portal moderation queue) ----
router.post("/:id/report", async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const { reason } = req.body;
    const reportedBy = req.session.user ? req.session.user.email : "anonymous";

    await pool.query(
      `INSERT INTO reports (target_type, target_id, reason, reported_by, status) VALUES ('event', ?, ?, ?, 'open')`,
      [eventId, reason || "Reported as suspicious", reportedBy]
    );

    req.flash("success", "Thanks — this event has been reported to our moderators.");
    res.redirect(`/events/${eventId}`);
  } catch (err) {
    next(err);
  }
});

router.post("/reviews/:reviewId/report", async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const reportedBy = req.session.user ? req.session.user.email : "anonymous";

    const [rows] = await pool.query("SELECT event_id FROM reviews WHERE id = ?", [reviewId]);
    if (!rows.length) return res.redirect("/");

    await pool.query(
      `INSERT INTO reports (target_type, target_id, reason, reported_by, status) VALUES ('review', ?, 'Reported as spam/inappropriate', ?, 'open')`,
      [reviewId, reportedBy]
    );

    req.flash("success", "Thanks — this comment has been reported to our moderators.");
    res.redirect(`/events/${rows[0].event_id}#reviews`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
