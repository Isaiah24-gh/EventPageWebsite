/* ==========================================================================
   Feature 5: Notifications (Calendar Reminders)
   OWNERSHIP: [teammate name]
   ========================================================================== */

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { requireLogin } = require("../middleware/auth");

router.get("/", requireLogin, async (req, res, next) => {
  try {
    const [reminders] = await pool.query(
      `SELECT e.* FROM reminders r
       JOIN events e ON e.id = r.event_id
       WHERE r.user_id = ? AND e.status != 'removed'
       ORDER BY e.event_date ASC`,
      [req.session.user.id]
    );

    res.render("notifications", {
      title: "Reminders",
      active: "notifications",
      pageCss: "notifications",
      pageJs: "notifications",
      reminders
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:eventId", requireLogin, async (req, res, next) => {
  try {
    await pool.query(
      "INSERT IGNORE INTO reminders (user_id, event_id) VALUES (?, ?)",
      [req.session.user.id, req.params.eventId]
    );
    req.flash("success", "Reminder added!");
    res.redirect(req.get("Referrer") || "/notifications");
  } catch (err) {
    next(err);
  }
});

router.post("/:eventId/remove", requireLogin, async (req, res, next) => {
  try {
    await pool.query(
      "DELETE FROM reminders WHERE user_id = ? AND event_id = ?",
      [req.session.user.id, req.params.eventId]
    );
    req.flash("success", "Reminder removed.");
    res.redirect("/notifications");
  } catch (err) {
    next(err);
  }
});

router.get("/:eventId/ics", requireLogin, async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [req.params.eventId]);
    const evt = rows[0];
    if (!evt) return res.redirect("/notifications");

    const start = new Date(`${evt.event_date.toISOString().slice(0, 10)}T${evt.event_time}`);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EventHub//Prototype//EN",
      "BEGIN:VEVENT",
      `UID:${evt.id}@eventhub.local`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${evt.title}`,
      `LOCATION:${evt.venue}`,
      `DESCRIPTION:${evt.description.replace(/\n/g, " ")}`,
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      "DESCRIPTION:Event reminder",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    res.setHeader("Content-Type", "text/calendar");
    res.setHeader("Content-Disposition", `attachment; filename="${evt.title.replace(/[^a-z0-9]+/gi, "-")}.ics"`);
    res.send(ics);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
