/* ==========================================================================
   Feature 6: Ticketing
   OWNERSHIP: [teammate name]
   Does not process payments. Confirms an order summary, then hands off to
   the organiser's external, secure ticketing link (event.external_url).
   ========================================================================== */

const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/:eventId", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM events WHERE id = ? AND status != 'removed'",
      [req.params.eventId]
    );
    const event = rows[0];

    let hostname = null;
    if (event) {
      try { hostname = new URL(event.external_url).hostname; } catch { hostname = event.external_url; }
    }

    res.render("ticketing", {
      title: "Get Tickets",
      pageCss: "ticketing",
      pageJs: "ticketing",
      event,
      hostname
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
