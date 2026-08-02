/* ==========================================================================
   Feature 6: Ticketing
   OWNERSHIP: Hnin
   Does not process payments. Confirms an order summary, then hands off to
   the organiser's external, secure ticketing link (event.external_url).
   ========================================================================== */

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { sendTicketConfirmationEmail } = require("../config/mail");

router.get("/:eventId", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM events WHERE id = ? AND status != 'removed'",
      [req.params.eventId]
    );
    const event = rows[0];

    if (!req.session.user) {
      req.flash("error", "You must be logged in to purchase tickets.");
      return res.redirect("/login");
    }

    res.render("ticketing", {
      title: "Get Tickets",
      pageCss: "ticketing",
      pageJs: "ticketing",
      event,
      messages: req.flash()
    });
  } catch (err) {
    next(err);
  }
});

router.post("/checkout", async (req, res, next) => {
  try {
    const { eventId, quantity } = req.body;
    const userId = req.session.user ? req.session.user.id : null;

    if (!userId) {
      return res.status(401).render("500", { title: "Unauthorized", message: "Please log in." });
    }

    const [events] = await pool.query("SELECT * FROM events WHERE id = ?", [eventId]);
    const event = events[0];

    if (!event) {
      return res.status(404).render("404", { title: "Event not found" });
    }

    const qtyInt = parseInt(quantity, 10);
    const totalAmount = event.price * qtyInt;

    const generatedTxnId = "TXN-" + Date.now();
    const paymentSuccess = true;

    if (paymentSuccess) {
      const sql = `INSERT INTO orders (user_id, event_id, quantity, total_paid, transaction_id, status) 
                   VALUES (?, ?, ?, ?, ?, ?)`;

      await pool.query(sql, [userId, eventId, qtyInt, totalAmount, generatedTxnId, "Paid"]);

      // ---- Feature 4: purchase confirmation email ----
      // Prefers the contact address on the user's email preferences, which is
      // deliberately separate from the address they log in with. Users who have
      // never saved their preferences have no row yet, so we fall back to the
      // account email. Wrapped in its own try/catch: the order is already saved,
      // so a mail failure must not turn a purchase into an error page.
      try {
        const [prefRows] = await pool.query(
          "SELECT contact_email FROM email_preferences WHERE user_id = ?",
          [userId]
        );
        const contactEmail =
          (prefRows[0] && prefRows[0].contact_email) || req.session.user.email;

        await sendTicketConfirmationEmail(contactEmail, req.session.user.name, {
          event,
          quantity: qtyInt,
          totalPaid: totalAmount,
          transactionId: generatedTxnId
        });
      } catch (mailErr) {
        console.error("Failed to send ticket confirmation email:", mailErr);
      }

      return res.render("payment-success", {
        title: "Purchase Confirmed",
        transactionId: generatedTxnId,
        totalAmount: totalAmount
      });

    } else {
      return res.status(400).render("500", { title: "Payment Failed", message: "Card declined." });
    }

  } catch (err) {
    console.error("Database or Server Error: ", err);
    res.status(500).render("500", { title: "Error", message: "Internal server error." });
  }
});

module.exports = router;
