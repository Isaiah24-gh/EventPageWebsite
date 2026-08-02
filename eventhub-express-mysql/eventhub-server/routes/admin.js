/* ==========================================================================
   Feature 7: Admin Portal
   OWNERSHIP: Brian
   Gives admins master control over the site: flag/remove suspicious event
   listings, suspend spam accounts, and work through a reports queue fed by
   the "Report" buttons on events and reviews (see routes/events.js).
   ========================================================================== */

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { requireRole } = require("../middleware/auth");

router.use(requireRole("admin"));

async function logAction(adminId, action, targetType, targetId) {
  await pool.query(
    "INSERT INTO admin_actions (admin_id, action, target_type, target_id) VALUES (?, ?, ?, ?)",
    [adminId, action, targetType, targetId]
  );
}

// ---- Dashboard ----
router.get("/", async (req, res, next) => {
  try {
    const [[userCount]] = await pool.query("SELECT COUNT(*) AS n FROM users");
    const [[eventCount]] = await pool.query("SELECT COUNT(*) AS n FROM events WHERE status != 'removed'");
    const [[flaggedCount]] = await pool.query("SELECT COUNT(*) AS n FROM events WHERE status = 'flagged'");
    const [[openReportCount]] = await pool.query("SELECT COUNT(*) AS n FROM reports WHERE status = 'open'");
    const [[suspendedCount]] = await pool.query("SELECT COUNT(*) AS n FROM users WHERE status = 'suspended'");

    const [recentActions] = await pool.query(
      `SELECT a.*, u.name AS admin_name FROM admin_actions a
       JOIN users u ON u.id = a.admin_id
       ORDER BY a.created_at DESC LIMIT 8`
    );

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      active: "admin",
      pageCss: 'admin',
      adminTab: "dashboard",
      stats: {
        users: userCount.n,
        events: eventCount.n,
        flagged: flaggedCount.n,
        openReports: openReportCount.n,
        suspended: suspendedCount.n
      },
      recentActions
    });
  } catch (err) {
    next(err);
  }
});

// ---- Events moderation ----
router.get("/events", async (req, res, next) => {
  try {
    const [events] = await pool.query(
      `SELECT e.*, u.name AS organiser_name FROM events e
       JOIN users u ON u.id = e.organiser_id
       ORDER BY FIELD(e.status, 'flagged', 'active', 'removed'), e.created_at DESC`
    );
    res.render("admin/events", { title: "Manage Events", active: "admin", pageCss: 'admin', adminTab: "events", events });
  } catch (err) {
    next(err);
  }
});

router.post("/events/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "flagged", "removed"].includes(status)) {
      req.flash("error", "Invalid status.");
      return res.redirect("/admin/events");
    }
    await pool.query("UPDATE events SET status = ? WHERE id = ?", [status, req.params.id]);
    await logAction(req.session.user.id, `Set event status to "${status}"`, "event", req.params.id);
    req.flash("success", `Event marked as ${status}.`);
    res.redirect("/admin/events");
  } catch (err) {
    next(err);
  }
});

// ---- User / account moderation ----
router.get("/users", async (req, res, next) => {
  try {
    const [users] = await pool.query(
      `SELECT u.*, (SELECT COUNT(*) FROM events e WHERE e.organiser_id = u.id) AS event_count
       FROM users u ORDER BY FIELD(u.status, 'suspended', 'active'), u.created_at DESC`
    );
    res.render("admin/users", { title: "Manage Accounts", active: "admin", pageCss: 'admin', adminTab: "users", users });
  } catch (err) {
    next(err);
  }
});

router.post("/users/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended"].includes(status)) {
      req.flash("error", "Invalid status.");
      return res.redirect("/admin/users");
    }
    if (Number(req.params.id) === req.session.user.id) {
      req.flash("error", "You can't suspend your own account.");
      return res.redirect("/admin/users");
    }
    await pool.query("UPDATE users SET status = ? WHERE id = ?", [status, req.params.id]);
    await logAction(req.session.user.id, `Set account status to "${status}"`, "user", req.params.id);
    req.flash("success", `Account marked as ${status}.`);
    res.redirect("/admin/users");
  } catch (err) {
    next(err);
  }
});

// ---- Reports queue ----
router.get("/reports", async (req, res, next) => {
  try {
    const [reports] = await pool.query(
      `SELECT r.*, rev.name AS review_name, rev.rating AS review_rating, rev.comment AS review_comment
       FROM reports r
       LEFT JOIN reviews rev ON r.target_type = 'review' AND r.target_id = rev.id
       ORDER BY FIELD(r.status, 'open', 'resolved', 'dismissed'), r.created_at DESC`
    );
    res.render("admin/reports", { title: "Reports Queue", active: "admin", pageCss: 'admin', adminTab: "reports", reports });
  } catch (err) {
    next(err);
  }
});

router.post("/reports/:id/:action(resolve|dismiss)", async (req, res, next) => {
  try {
    const status = req.params.action === "resolve" ? "resolved" : "dismissed";
    await pool.query("UPDATE reports SET status = ? WHERE id = ?", [status, req.params.id]);
    await logAction(req.session.user.id, `Marked report as ${status}`, "report", req.params.id);
    req.flash("success", `Report ${status}.`);
    res.redirect("/admin/reports");
  } catch (err) {
    next(err);
  }
});

router.post("/reports/:id/delete-review", async (req, res, next) => {
  try {
    const [reports] = await pool.query("SELECT * FROM reports WHERE id = ?", [req.params.id]);
    const report = reports[0];
    if (!report || report.target_type !== "review") {
      req.flash("error", "Unable to delete that review.");
      return res.redirect("/admin/reports");
    }

    const [reviews] = await pool.query("SELECT * FROM reviews WHERE id = ?", [report.target_id]);
    if (!reviews.length) {
      req.flash("error", "Review not found.");
      return res.redirect("/admin/reports");
    }

    await pool.query("UPDATE reviews SET status = 'removed' WHERE id = ?", [report.target_id]);
    await pool.query("UPDATE reports SET status = 'resolved' WHERE id = ?", [req.params.id]);
    await pool.query("UPDATE reports SET status = 'resolved' WHERE target_type = 'review' AND target_id = ?", [report.target_id]);
    await logAction(req.session.user.id, `Hid review and resolved report`, "review", report.target_id);
    req.flash("success", "Review hidden and report resolved.");
    res.redirect("/admin/reports");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
